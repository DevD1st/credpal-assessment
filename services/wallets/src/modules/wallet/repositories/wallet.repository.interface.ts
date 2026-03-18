import { Wallet } from '../entities/wallet.entity.js';

export const WALLET_REPOSITORY_TOKEN = 'WALLET_REPOSITORY_TOKEN';

export interface IWalletRepository {
  createWallet(wallet: Partial<Wallet>): Promise<Wallet>;
  findById(id: string): Promise<Wallet | null>;
}
