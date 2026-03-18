import { User } from '../entities/user.entity.js';

export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY_TOKEN';

export interface IUserRepository {
  createUser(user: Partial<User>): Promise<User>;
  findById(id: string): Promise<User | null>;
}
