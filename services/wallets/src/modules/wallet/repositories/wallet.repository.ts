import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Wallet, uq_wallet_user_currency, chk_wallet_balance, chk_wallet_status } from '../entities/wallet.entity.js';
import { IWalletRepository } from './wallet.repository.interface.js';
import {
  isUniqueKeyViolationError,
  isCheckViolationError,
  ValidationError,
} from '@credpal-fx-trading-app/common';

@Injectable()
export class WalletRepository extends Repository<Wallet> implements IWalletRepository {
  constructor(private dataSource: DataSource) {
    super(Wallet, dataSource.createEntityManager());
  }

  async createWallet(wallet: Partial<Wallet>): Promise<Wallet> {
    try {
      const savedWallet = await this.save(this.create(wallet));
      return savedWallet;
    } catch (error) {
      if (isUniqueKeyViolationError(error, uq_wallet_user_currency)) {
        throw new ValidationError('A wallet with this currency already exists for the user.');
      }

      if (isCheckViolationError(error, chk_wallet_balance)) {
        throw new ValidationError('Wallet balance cannot be negative.');
      }

      if (isCheckViolationError(error, chk_wallet_status)) {
        throw new ValidationError('Invalid wallet status provided.');
      }

      throw new InternalServerErrorException('Unable to complete operation.');
    }
  }

  async findById(id: string): Promise<Wallet | null> {
    return this.findOne({ where: { id } });
  }
}
