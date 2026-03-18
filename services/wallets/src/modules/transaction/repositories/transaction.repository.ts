import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  Transaction,
  idx_transaction_reference,
  chk_transaction_type,
  chk_transaction_status,
} from '../entities/transaction.entity.js';
import { ITransactionRepository } from './transaction.repository.interface.js';
import {
  isUniqueKeyViolationError,
  isCheckViolationError,
  ValidationError,
} from '@credpal-fx-trading-app/common';

@Injectable()
export class TransactionRepository extends Repository<Transaction> implements ITransactionRepository {
  constructor(private dataSource: DataSource) {
    super(Transaction, dataSource.createEntityManager());
  }

  async createTransaction(transaction: Partial<Transaction>): Promise<Transaction> {
    try {
      const savedTransaction = await this.save(this.create(transaction));
      return savedTransaction;
    } catch (error) {
      if (isUniqueKeyViolationError(error, idx_transaction_reference)) {
        throw new ValidationError('A transaction with this reference already exists.');
      }

      if (isCheckViolationError(error, chk_transaction_type)) {
        throw new ValidationError('Invalid transaction type provided.');
      }

      if (isCheckViolationError(error, chk_transaction_status)) {
        throw new ValidationError('Invalid transaction status provided.');
      }

      throw new InternalServerErrorException('Unable to complete operation.');
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.findOne({ where: { id } });
  }

  async getTransactions(
    userId: string,
    filters: {
      currency?: string;
      status?: string;
      offset?: number;
      limit?: number;
    },
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const qb = this.createQueryBuilder("transaction");
    qb.where("transaction.user_id = :userId", { userId });

    if (filters.status) {
      qb.andWhere("transaction.status = :status", { status: filters.status });
    }

    if (filters.currency) {
      const currency = filters.currency.toUpperCase();
      qb.andWhere(
        "(transaction.base_currency = :currency OR transaction.target_currency = :currency)",
        { currency },
      );
    }

    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const offset = filters.offset && filters.offset >= 0 ? filters.offset : 0;

    qb.skip(offset).take(limit).orderBy("transaction.created_at", "DESC");

    const [transactions, total] = await qb.getManyAndCount();
    return { transactions, total };
  }
}
