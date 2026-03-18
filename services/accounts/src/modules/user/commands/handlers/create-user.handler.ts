import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateUserCommand } from '../impl.js';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../repositories/user.repository.interface.js';
import { User } from '../../entities/user.entity.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, User> {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    return this.userRepository.createUser({
      id: command.input.id,
      email: command.input.email,
      passwordHash: command.input.hashedPassword || '',
      isVerified: command.input.isVerified,
      tokenVersion: command.input.tokenVersion || 0,
    });
  }
}
