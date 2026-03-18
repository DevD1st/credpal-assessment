import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from "@credpal-fx-trading-app/runtime";
import { ProcessTradeCurrencyCommand } from "../impl.js";
import { DataSource, QueryRunner } from "typeorm";
import { Wallet } from "../../../wallet/entities/wallet.entity.js";
import { Transaction } from "../../entities/transaction.entity.js";
import { Ledger } from "../../entities/ledger.entity.js";
import { Decimal } from "decimal.js";
import { ClientProxy } from "@nestjs/microservices";
import { RABBITMQ_TOPICS } from "@credpal-fx-trading-app/constants";
import { RABBIT_MQ_CLIENT } from "../../../../utils/index.js";

@CommandHandler(ProcessTradeCurrencyCommand)
export class ProcessTradeCurrencyHandler
  implements ICommandHandler<ProcessTradeCurrencyCommand, void>
{
  constructor(
    @Inject(LOGGING_SERVICE_TOKEN) private readonly logger: LoggingService,
    private readonly dataSource: DataSource,
    @Inject(RABBIT_MQ_CLIENT) private readonly rabbitClient: ClientProxy,
  ) {}

  async execute(command: ProcessTradeCurrencyCommand): Promise<void> {
    const { payload } = command;
    const {
      userId,
      baseWalletId,
      targetWalletId,
      baseAmount,
      targetAmount,
      exchangeRate,
      reference,
      quoteId,
    } = payload;

    this.logger.log({
      message: "Processing trade currency job",
      userId,
      baseWalletId,
      targetWalletId,
      baseAmount,
      reference,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let transactionRecord: Transaction | null = null;
    let success = false;

    try {
      // 1. Lock rows defensively to completely eliminate race conditions
      // Lock wallets deterministically (e.g. by ID) to prevent deadlocks ALWAYS
      const firstId = baseWalletId < targetWalletId ? baseWalletId : targetWalletId;
      const secondId = baseWalletId < targetWalletId ? targetWalletId : baseWalletId;
      
      const firstWallet = await queryRunner.manager
        .createQueryBuilder(Wallet, "wallet")
        .setLock("pessimistic_write")
        .where("wallet.id = :id", { id: firstId })
        .getOne();

      const secondWallet = await queryRunner.manager
        .createQueryBuilder(Wallet, "wallet")
        .setLock("pessimistic_write")
        .where("wallet.id = :id", { id: secondId })
        .getOne();

      if (!firstWallet || !secondWallet) {
        throw new Error("One or both wallets missing during transactional processing");
      }

      // Re-assign explicitly
      const baseWallet = firstWallet.id === baseWalletId ? firstWallet : secondWallet;
      const targetWallet = secondWallet.id === targetWalletId ? secondWallet : firstWallet;

      transactionRecord = await queryRunner.manager
        .createQueryBuilder(Transaction, "transaction")
        .setLock("pessimistic_write")
        .where("transaction.reference = :reference", { reference })
        .getOne();

      if (!transactionRecord) {
        throw new Error(`Transaction record missing for reference ${reference}`);
      }

      if (transactionRecord.status !== "PENDING") {
        this.logger.warn({
          message: "Transaction is not pending anymore, ignoring job.",
          reference,
          status: transactionRecord.status,
        });
        await queryRunner.rollbackTransaction();
        return;
      }

      // 2. Base Validation
      const currentBalance = new Decimal(baseWallet.balance);
      const tradeAmount = new Decimal(baseAmount);

      if (currentBalance.lessThan(tradeAmount)) {
        throw new Error(`Insufficient funds: Base Balance ${baseWallet.balance} is less than required ${baseAmount}`);
      }

      // 3. Balance Adjustment Using safe math
      const dbBaseAmount = currentBalance.minus(tradeAmount);
      const currentTargetBalance = new Decimal(targetWallet.balance);
      const dbTargetAmount = currentTargetBalance.plus(new Decimal(targetAmount));

      baseWallet.balance = dbBaseAmount.toNumber();
      targetWallet.balance = dbTargetAmount.toNumber();

      await queryRunner.manager.save(Wallet, [baseWallet, targetWallet]);

      // 4. Create Ledger Entries
      // Debit ledger attached to BaseWallet
      const debitLedger = new Ledger();
      debitLedger.walletId = baseWallet.id;
      debitLedger.transactionId = transactionRecord.id;
      debitLedger.type = "DEBIT";
      debitLedger.amount = baseAmount;
      debitLedger.runningBalance = baseWallet.balance;

      // Credit ledger attached to TargetWallet
      const creditLedger = new Ledger();
      creditLedger.walletId = targetWallet.id;
      creditLedger.transactionId = transactionRecord.id;
      creditLedger.type = "CREDIT";
      creditLedger.amount = targetAmount;
      creditLedger.runningBalance = targetWallet.balance;

      await queryRunner.manager.save(Ledger, [debitLedger, creditLedger]);

      // 5. Success
      transactionRecord.status = "SUCCESS";
      await queryRunner.manager.save(Transaction, transactionRecord);

      await queryRunner.commitTransaction();
      success = true;

      this.logger.log({
        message: "Trade completely executed successfully",
        reference,
        transactionId: transactionRecord.id,
      });

      // 6. Push to rabbitmq pipeline
      this.rabbitClient.emit(RABBITMQ_TOPICS.CURRENCY_TRADED, {
        userId,
        transactionId: transactionRecord.id,
        baseWalletId,
        targetWalletId,
        baseAmount,
        targetAmount,
        exchangeRate,
        quoteId,
      });
      
    } catch (error) {
      this.logger.error({
        message: "Failed processing cross-currency trade. Rolling back...",
        error: error instanceof Error ? error.message : error,
      });
      await queryRunner.rollbackTransaction();
      
      // Secondary transaction specifically to persist a failure status gracefully
      if (transactionRecord) {
        await this.handleFailedTradeSafe(transactionRecord.id);
      }
      
      throw error; // Let BullMQ retry
    } finally {
      await queryRunner.release();
    }
  }

  private async handleFailedTradeSafe(transactionId: string): Promise<void> {
    const errorRunner = this.dataSource.createQueryRunner();
    await errorRunner.connect();
    await errorRunner.startTransaction();

    try {
      const txToFail = await errorRunner.manager
        .createQueryBuilder(Transaction, "transaction")
        .setLock("pessimistic_write")
        .where("transaction.id = :id", { id: transactionId })
        .getOne();

      if (txToFail && txToFail.status === "PENDING") {
        txToFail.status = "FAILED";
        await errorRunner.manager.save(Transaction, txToFail);
      }
      await errorRunner.commitTransaction();
    } catch (err) {
      await errorRunner.rollbackTransaction();
      this.logger.error({
        message: "Failed marking transaction as FAILED",
        err,
      });
    } finally {
      await errorRunner.release();
    }
  }
}
