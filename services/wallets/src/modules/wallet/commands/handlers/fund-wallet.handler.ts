import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, InternalServerErrorException } from "@nestjs/common";
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from "@credpal-fx-trading-app/runtime";
import { ConflictError, NotFoundError } from "@credpal-fx-trading-app/common";
import { Wallets } from "@credpal-fx-trading-app/proto";
import { FundWalletCommand } from "../impl.js";
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
import { FUND_WALLET_JOB } from "../../../../utils/index.js";

@CommandHandler(FundWalletCommand)
export class FundWalletHandler implements ICommandHandler<
  FundWalletCommand,
  Wallets.Wallet
> {
  constructor(
    @Inject(LOGGING_SERVICE_TOKEN) private readonly logger: LoggingService,
    @Inject(WALLET_REPOSITORY_TOKEN)
    private readonly walletRepository: IWalletRepository,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectQueue(BULLMQ_QUEUES.TRANSACTIONS)
    private readonly transactionsQueue: Queue,
  ) {}

  async execute(command: FundWalletCommand): Promise<Wallets.Wallet> {
    const { request, meta } = command;

    const userId = meta.userId;
    if (!userId) {
      throw new InternalServerErrorException(
        "User identity could not be resolved from request context",
      );
    }

    const walletId = request.walletId;
    const amount = Number(request.amount);
    const reference = request.idempotencyKey;

    this.logger.log({
      message: "Processing fund wallet request",
      userId,
      walletId,
      amount,
      reference,
    });

    // Idempotency Level 2: Redis Cache Check with 60s TTL
    const cacheKey = REDIS_KEYS.FUND_WALLET(userId, walletId, amount);
    const isCached = await this.cacheManager.get(cacheKey);
    if (isCached) {
      throw new ConflictError(
        "A duplicate funding request was recently detected.",
      );
    }

    // Verify Wallet Existence and Ownership
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new NotFoundError(
        "Wallet not found or does not belong to the user.",
      );
    }

    // Idempotency Level 1: Database Reference Check
    const existingTx = await this.dataSource
      .getRepository(Transaction)
      .findOne({ where: { reference } });

    if (existingTx) {
      throw new ConflictError(
        "A transaction with this reference already exists.",
      );
    }

    // Database Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Transaction (Pending)
      const tx = new Transaction();
      tx.userId = userId;
      tx.baseWalletId = wallet.id;
      tx.targetWalletId = wallet.id; // Both base and target are the user's wallet for funding
      tx.type = "FUNDING";
      tx.status = "PENDING";
      tx.baseCurrency = wallet.currency;
      tx.baseAmount = amount;
      tx.reference = reference;

      await queryRunner.manager.save(Transaction, tx);

      // 2. Dispatch BullMQ Job
      await this.transactionsQueue.add(FUND_WALLET_JOB, {
        userId,
        baseWalletId: wallet.id,
        amount,
        reference,
      });

      // 3. Commit
      await queryRunner.commitTransaction();

      this.logger.log({
        message: "Fund wallet job dispatched successfully",
        userId,
        walletId,
        transactionId: tx.id,
      });

      // Set Cache for Duplicate Detection (60s TTL)
      await this.cacheManager.set(cacheKey, "PENDING", 60000);

      return {
        id: wallet.id,
        userId: wallet.userId,
        currency: wallet.currency,
        balance: wallet.balance,
        status: wallet.status,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error({
        message: "Failed to process fund wallet request",
        error,
        userId,
        walletId,
        reference,
      });
      throw new InternalServerErrorException(
        "An error occurred during transaction processing.",
      );
    } finally {
      await queryRunner.release();
    }
  }
}
