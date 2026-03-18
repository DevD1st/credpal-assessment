import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from '@credpal-fx-trading-app/runtime';
import { ValidationError } from '@credpal-fx-trading-app/common';
import { RABBITMQ_TOPICS } from '@credpal-fx-trading-app/constants';
import { Wallets } from '@credpal-fx-trading-app/proto';
import { CreateWalletCommand } from '../impl.js';
import {
  IWalletRepository,
  WALLET_REPOSITORY_TOKEN,
} from '../../repositories/wallet.repository.interface.js';
import { RABBIT_MQ_CLIENT } from '../../../../utils/index.js';

@CommandHandler(CreateWalletCommand)
export class CreateWalletHandler
  implements ICommandHandler<CreateWalletCommand, Wallets.Wallet>
{
  constructor(
    @Inject(LOGGING_SERVICE_TOKEN) private readonly logger: LoggingService,
    @Inject(WALLET_REPOSITORY_TOKEN)
    private readonly walletRepository: IWalletRepository,
    @Inject(RABBIT_MQ_CLIENT) private readonly rabbitClient: ClientProxy,
  ) {}

  async execute(command: CreateWalletCommand): Promise<Wallets.Wallet> {
    const { request, meta } = command;

    const userId = meta.userId;
    if (!userId) {
      throw new ValidationError('User identity could not be resolved from request context');
    }

    this.logger.log({
      message: 'Creating wallet',
      userId,
      currency: request.currency,
    });

    const wallet = await this.walletRepository.createWallet({
      userId,
      currency: request.currency.toUpperCase(),
    });

    this.logger.log({
      message: 'Wallet created successfully',
      walletId: wallet.id,
      userId,
      currency: wallet.currency,
    });

    this.rabbitClient.emit(RABBITMQ_TOPICS.WALLET_CREATED, {
      walletId: wallet.id,
      userId: wallet.userId,
      currency: wallet.currency,
      balance: wallet.balance,
      status: wallet.status,
      createdAt: wallet.createdAt.toISOString(),
    });

    return {
      id: wallet.id,
      userId: wallet.userId,
      currency: wallet.currency,
      balance: wallet.balance,
      status: wallet.status,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
    };
  }
}
