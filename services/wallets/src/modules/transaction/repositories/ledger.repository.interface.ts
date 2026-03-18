import { Ledger } from '../entities/ledger.entity.js';

export const LEDGER_REPOSITORY_TOKEN = 'LEDGER_REPOSITORY_TOKEN';

export interface ILedgerRepository {
  createLedger(ledger: Partial<Ledger>): Promise<Ledger>;
  findById(id: string): Promise<Ledger | null>;
}
