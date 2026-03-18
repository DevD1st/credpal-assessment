import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, InternalServerErrorException } from "@nestjs/common";
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from "@credpal-fx-trading-app/runtime";
import { ConflictError, NotFoundError } from "@credpal-fx-trading-app/common";
import { Wallets } from "@credpal-fx-trading-app/proto";
import { TradeCurrencyCommand } from "../impl.js";
import {
  IWalletRepository,
  WALLET_REPOSITORY_TOKEN,
} from "../../repositories/wallet.repository.interface.js";
import { DataSource } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { BULLMQ_QUEUES, REDIS_KEYS } from "@credpal-fx-trading-app/constants";
import { Transaction } from "../../../transaction/entities/transaction.entity.js";
import { Decimal } from "decimal.js";
import { TRADE_CURRENCY_JOB } from "../../../../utils/index.js";
import { v7 as uuidv7 } from "uuid";

@CommandHandler(TradeCurrencyCommand)
export class TradeCurrencyHandler
  implements ICommandHandler<TradeCurrencyCommand, Wallets.TradeCurrencyResponse>
{
  constructor(
    @Inject(LOGGING_SERVICE_TOKEN) private readonly logger: LoggingService,
    @Inject(WALLET_REPOSITORY_TOKEN)
    private readonly walletRepository: IWalletRepository,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectQueue(BULLMQ_QUEUES.TRANSACTIONS)
    private readonly transactionsQueue: Queue,
  ) {}

  async execute(command: TradeCurrencyCommand): Promise<Wallets.TradeCurrencyResponse> {
    const { request, meta } = command;
    const userId = meta.userId;

    if (!userId) {
      throw new InternalServerErrorException(
        "User identity could not be resolved from request context",
      );
    }

    const { quoteId, baseCurrency, targetCurrency } = request;
    const amount = Number(request.amount);

    this.logger.log({
      message: "Processing trade currency request",
      userId,
      quoteId,
      baseCurrency,
      targetCurrency,
      amount,
    });

    // 1. Fetch and Verify Quote
    const userQuoteKey = REDIS_KEYS.USER_QUOTE(userId, baseCurrency, targetCurrency);
    const cachedQuote = await this.cacheManager.get<Wallets.Quote>(userQuoteKey);

    if (!cachedQuote) {
      throw new NotFoundError("Quote has expired or does not exist.");
    }
    if (cachedQuote.id !== quoteId) {
      throw new ConflictError("Quote provided does not match the active cached quote ID.");
    }
    if (new Date(cachedQuote.expiresAt).getTime() < Date.now()) {
      throw new ConflictError("Quote has already expired.");
    }

    // 2. Load Wallets and Validate funds
    const allWallets = await this.walletRepository.findByUserId(userId);
    const baseWallet = allWallets.find((w) => w.currency === baseCurrency);
    const targetWallet = allWallets.find((w) => w.currency === targetCurrency);

    if (!baseWallet) {
      throw new NotFoundError(`Base wallet for currency ${baseCurrency} not found.`);
    }
    if (!targetWallet) {
      throw new NotFoundError(`Target wallet for currency ${targetCurrency} not found.`);
    }

    const currentBaseBalance = new Decimal(baseWallet.balance);
    const tradeAmount = new Decimal(amount);

    if (currentBaseBalance.lessThan(tradeAmount)) {
      throw new ConflictError("Insufficient funds in the base wallet for this trade.");
    }

    // 3. Compute the target amount based accurately on the Decimal math
    // `cachedQuote.amount` accurately represents the conversion_rate * 10000 structure.
    const preciseRate = new Decimal(cachedQuote.amount).dividedBy(10000);
    const targetAmountCalc = tradeAmount.times(preciseRate); 
    const targetAmountScaled = targetAmountCalc.toNumber();

    const reference = uuidv7();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let txId: string;
    let savedTx: Transaction;

    try {
      // 4. Create Transaction Tracking Entry (Pending)
      const tx = new Transaction();
      tx.userId = userId;
      tx.baseWalletId = baseWallet.id;
      tx.targetWalletId = targetWallet.id;
      tx.type = "CONVERSION";
      tx.status = "PENDING";
      tx.baseCurrency = baseCurrency;
      tx.targetCurrency = targetCurrency;
      tx.baseAmount = amount;
      tx.targetAmount = targetAmountScaled;
      tx.exchangeRate = cachedQuote.amount;
      tx.reference = reference;

      savedTx = await queryRunner.manager.save(Transaction, tx);
      txId = savedTx.id;

      // 5. Submit job to the BullMQ transactionsQueue worker
      await this.transactionsQueue.add(TRADE_CURRENCY_JOB, {
        userId,
        baseWalletId: baseWallet.id,
        targetWalletId: targetWallet.id,
        baseAmount: amount,
        targetAmount: targetAmountScaled,
        exchangeRate: cachedQuote.amount,
        reference,
        quoteId,
      });

      await queryRunner.commitTransaction();

      this.logger.log({
        message: "Trade currency job dispatched successfully",
        userId,
        txId,
        reference,
      });

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error({
        message: "Failed to create trade currency pending transaction",
        error,
        userId,
        reference,
      });
      throw new InternalServerErrorException(
        "An error occurred during trade transaction setup.",
      );
    } finally {
      await queryRunner.release();
    }

    return {
      data: {
        id: savedTx.id,
        userId: savedTx.userId,
        baseWalletId: savedTx.baseWalletId,
        targetWalletId: savedTx.targetWalletId, // Might be null depending on proto if it is empty, but we set it
        type: savedTx.type,
        baseCurrency: savedTx.baseCurrency,
        targetCurrency: savedTx.targetCurrency,
        baseAmount: savedTx.baseAmount,
        targetAmount: savedTx.targetAmount,
        status: savedTx.status,
        exchangeRate: savedTx.exchangeRate,
        exchangeRateWithSpread: savedTx.exchangeRateWithSpread || 0,
        percentageSpread: savedTx.percentageSpread || 0,
        reference: savedTx.reference,
        createdAt: savedTx.createdAt.toISOString(),
        updatedAt: savedTx.updatedAt.toISOString(),
      },
    } as any;
  }
}
