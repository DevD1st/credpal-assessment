import { User } from '../entities/user.entity.js';

export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY_TOKEN';

export interface IUserRepository {
  createUser(user: Partial<User>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findOne(options: { where: Partial<User> }): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
}
