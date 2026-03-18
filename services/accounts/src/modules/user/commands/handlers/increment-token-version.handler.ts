import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, InternalServerErrorException } from '@nestjs/common';
import { IncrementAuthTokenVersionCommand } from '../impl.js';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../repositories/user.repository.interface.js';

@CommandHandler(IncrementAuthTokenVersionCommand)
export class IncrementAuthTokenVersionHandler
  implements ICommandHandler<IncrementAuthTokenVersionCommand, void>
{
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: IncrementAuthTokenVersionCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) throw new InternalServerErrorException('User not found while incrementing token version');

    // Atomically increment the token version so all outstanding tokens
    // issued with the previous version become invalid the next time
    // they are verified (the auth guard checks version from the DB).
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.userRepository.updateUser(user.id, { tokenVersion: user.tokenVersion });
  }
}
