import { Transaction } from '../entities/transaction.entity.js';

export const TRANSACTION_REPOSITORY_TOKEN = 'TRANSACTION_REPOSITORY_TOKEN';

export interface ITransactionRepository {
  createTransaction(transaction: Partial<Transaction>): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  getTransactions(
    userId: string,
    filters: {
      currency?: string;
      status?: string;
      offset?: number;
      limit?: number;
    },
  ): Promise<{ transactions: Transaction[]; total: number }>;
}
