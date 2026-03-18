import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Ledger, chk_ledger_type } from '../entities/ledger.entity.js';
import { ILedgerRepository } from './ledger.repository.interface.js';
import {
  isCheckViolationError,
  ValidationError,
} from '@credpal-fx-trading-app/common';

@Injectable()
export class LedgerRepository extends Repository<Ledger> implements ILedgerRepository {
  constructor(private dataSource: DataSource) {
    super(Ledger, dataSource.createEntityManager());
  }

  async createLedger(ledger: Partial<Ledger>): Promise<Ledger> {
    try {
      const savedLedger = await this.save(this.create(ledger));
      return savedLedger;
    } catch (error) {
      if (isCheckViolationError(error, chk_ledger_type)) {
        throw new ValidationError('Invalid ledger entry type provided.');
      }

      throw new InternalServerErrorException('Unable to complete operation.');
    }
  }

  async findById(id: string): Promise<Ledger | null> {
    return this.findOne({ where: { id } });
  }
}
