import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User, idx_user_email, chk_user_role } from '../entities/user.entity.js';
import { IUserRepository } from './user.repository.interface.js';
import {
  isUniqueKeyViolationError,
  isCheckViolationError,
  ValidationError,
} from '@credpal-fx-trading-app/common';

@Injectable()
export class UserRepository extends Repository<User> implements IUserRepository {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async createUser(user: Partial<User>): Promise<User> {
    try {
      const savedUser = await this.save(this.create(user));
      return savedUser;
    } catch (error) {
      if (isUniqueKeyViolationError(error, idx_user_email)) {
        throw new ValidationError('A user with this email already exists.');
      }

      if (isCheckViolationError(error, chk_user_role)) {
        throw new ValidationError('Invalid user role provided.');
      }

      throw new InternalServerErrorException('Unable to complete operation.');
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.findOne({ where: { id } });
  }
}
