import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, InternalServerErrorException } from "@nestjs/common";
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from "@credpal-fx-trading-app/runtime";
import { ConflictError, NotFoundError } from "@credpal-fx-trading-app/common";
import { ClientProxy } from "@nestjs/microservices";
import { RABBITMQ_TOPICS } from "@credpal-fx-trading-app/constants";
import { ProcessFundWalletCommand } from "../impl.js";
import { DataSource } from "typeorm";
import { Transaction } from "../../entities/transaction.entity.js";
import { Wallet } from "../../../wallet/entities/wallet.entity.js";
import { Ledger } from "../../entities/ledger.entity.js";
import { Decimal } from "decimal.js";
import { RABBIT_MQ_CLIENT } from "../../../../utils/index.js";

@CommandHandler(ProcessFundWalletCommand)
export class ProcessFundWalletHandler
  implements ICommandHandler<ProcessFundWalletCommand, void>
{
  constructor(
    @Inject(LOGGING_SERVICE_TOKEN) private readonly logger: LoggingService,
    private readonly dataSource: DataSource,
    @Inject(RABBIT_MQ_CLIENT) private readonly rabbitClient: ClientProxy,
  ) {}

  async execute(command: ProcessFundWalletCommand): Promise<void> {
    const { payload } = command;
    const { userId, baseWalletId, amount, reference } = payload;

    this.logger.log({
      message: "Worker received fund wallet processing job",
      userId,
      baseWalletId,
      reference,
      amount,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Lock wallet for update to prevent race conditions during concurrent runs
      const wallet = await queryRunner.manager
        .createQueryBuilder(Wallet, "wallet")
        .setLock("pessimistic_write")
        .where("wallet.id = :id", { id: baseWalletId })
        .getOne();

      if (!wallet) {
        throw new NotFoundError("Target wallet not found");
      }

      // 2. Lock the transaction record to ensure no other worker process duplicates it
      const tx = await queryRunner.manager
        .createQueryBuilder(Transaction, "tx")
        .setLock("pessimistic_write")
        .where("tx.reference = :reference", { reference })
        .getOne();

      if (!tx) {
        throw new NotFoundError("Transaction reference not found");
      }
      if (tx.status !== "PENDING") {
        throw new ConflictError(`Transaction is already processed or failed (status: ${tx.status}).`);
      }

      // 3. Precise additions using Decimal.js for fiat math safety
      const currentBalance = new Decimal(wallet.balance);
      const fundingAmount = new Decimal(amount);
      const newBalance = currentBalance.plus(fundingAmount);
      
      wallet.balance = newBalance.toNumber();
      await queryRunner.manager.save(Wallet, wallet);

      // 4. Update the stored transaction
      tx.status = "SUCCESS";
      await queryRunner.manager.save(Transaction, tx);

      // 5. Create the CREDIT ledger
      const creditLedger = new Ledger();
      creditLedger.walletId = wallet.id;
      creditLedger.transactionId = tx.id;
      creditLedger.type = "CREDIT";
      creditLedger.currency = wallet.currency;
      creditLedger.amount = fundingAmount.toNumber();
      creditLedger.runningBalance = newBalance.toNumber();
      await queryRunner.manager.save(Ledger, creditLedger);

      // 6. Create the DEBIT ledger
      // Requirement specifically requested: we use the exact same walletId as the source of funds
      // since this is a test environment and we do not have an actual external system/bank wallet model configured.
      const debitLedger = new Ledger();
      debitLedger.walletId = wallet.id; // Simulating funds leaving an external source/bank but grouped on the same wallet ID
      debitLedger.transactionId = tx.id;
      debitLedger.type = "DEBIT";
      debitLedger.currency = wallet.currency;
      debitLedger.amount = fundingAmount.toNumber();
      // For this simulated debit, the running balance doesn't represent the true external bank balance,
      // but we log the transaction amount precisely as requested.
      debitLedger.runningBalance = currentBalance.toNumber();
      await queryRunner.manager.save(Ledger, debitLedger);

      // 7. Commit DB transaction BEFORE broadcasting
      await queryRunner.commitTransaction();

      this.logger.log({
        message: "Worker successfully processed fund wallet job",
        userId,
        baseWalletId,
        reference,
        newBalance: wallet.balance,
      });

      // 8. Dispatch event to RabbitMQ (replacing Kafka per monorepo logic patterns)
      this.rabbitClient.emit(RABBITMQ_TOPICS.WALLET_FUNDED, {
        walletId: wallet.id,
        userId: userId,
        amount: fundingAmount.toNumber(),
        currency: wallet.currency,
        newBalance: wallet.balance,
        reference: reference,
        transactionId: tx.id,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.logger.error({
        message: "Worker failed to process fund wallet job. Rolling back.",
        error,
        reference,
      });

      // Secure Failover: update this specific transaction to FAILED on a completely separate runner connection.
      const failoverRunner = this.dataSource.createQueryRunner();
      await failoverRunner.connect();
      await failoverRunner.startTransaction();
      try {
        const failedTx = await failoverRunner.manager.findOne(Transaction, {
          where: { reference },
        });

        if (failedTx && failedTx.status === "PENDING") {
          failedTx.status = "FAILED";
          await failoverRunner.manager.save(Transaction, failedTx);
        }

        await failoverRunner.commitTransaction();
      } catch (innerErr) {
        await failoverRunner.rollbackTransaction();
      } finally {
        await failoverRunner.release();
      }

      // Re-throw so BullMQ catches it for retries/DLQ purposes if needed
      throw new InternalServerErrorException(
        "Unexpected error occurred while processing funding transaction",
      );
    } finally {
      await queryRunner.release();
    }
  }
}
