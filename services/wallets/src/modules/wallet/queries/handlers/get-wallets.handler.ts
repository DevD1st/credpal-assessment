import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, InternalServerErrorException } from '@nestjs/common';
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from '@credpal-fx-trading-app/runtime';
import { ValidationError } from '@credpal-fx-trading-app/common';
import { Wallets } from '@credpal-fx-trading-app/proto';
import { GetWalletsQuery } from '../impl.js';
import {
  IWalletRepository,
  WALLET_REPOSITORY_TOKEN,
} from '../../repositories/wallet.repository.interface.js';

@QueryHandler(GetWalletsQuery)
export class GetWalletsHandler
  implements IQueryHandler<GetWalletsQuery, Wallets.Wallets>
{
  constructor(
    @Inject(LOGGING_SERVICE_TOKEN) private readonly logger: LoggingService,
    @Inject(WALLET_REPOSITORY_TOKEN)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(query: GetWalletsQuery): Promise<Wallets.Wallets> {
    const { request, meta } = query;

    const userId = meta.userId;
    if (!userId) {
      throw new InternalServerErrorException('User identity could not be resolved from request context');
    }

    this.logger.log({
      message: 'Fetching wallets',
      userId,
      filters: request,
    });

    const { wallets, total } = await this.walletRepository.getWallets(userId, {
      currency: request.currency,
      status: request.status,
      offset: request.offset,
      limit: request.limit,
    });

    return {
      wallets: wallets.map((wallet) => ({
        id: wallet.id,
        userId: wallet.userId,
        currency: wallet.currency,
        balance: wallet.balance,
        status: wallet.status,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
      })),
      total,
    };
  }
}
