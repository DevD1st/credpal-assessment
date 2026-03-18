import { Transaction } from '../entities/transaction.entity.js';

export const TRANSACTION_REPOSITORY_TOKEN = 'TRANSACTION_REPOSITORY_TOKEN';

export interface ITransactionRepository {
  createTransaction(transaction: Partial<Transaction>): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
}
