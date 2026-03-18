import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject, InternalServerErrorException } from "@nestjs/common";
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from "@credpal-fx-trading-app/runtime";
import { Wallets } from "@credpal-fx-trading-app/proto";
import { GetTransactionsQuery } from "../impl.js";
import {
  ITransactionRepository,
  TRANSACTION_REPOSITORY_TOKEN,
} from "../../repositories/transaction.repository.interface.js";

@QueryHandler(GetTransactionsQuery)
export class GetTransactionsHandler
  implements IQueryHandler<GetTransactionsQuery, Wallets.GetTransactionsResponse>
{
  constructor(
    @Inject(LOGGING_SERVICE_TOKEN) private readonly logger: LoggingService,
    @Inject(TRANSACTION_REPOSITORY_TOKEN)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(query: GetTransactionsQuery): Promise<Wallets.GetTransactionsResponse> {
    const { request, meta } = query;
    const userId = meta.userId;

    if (!userId) {
      throw new InternalServerErrorException(
        "User identity could not be resolved from request context",
      );
    }

    this.logger.log({
      message: "Fetching user transactions",
      userId,
      filters: request,
    });

    const { transactions, total } = await this.transactionRepository.getTransactions(
      userId,
      {
        currency: request.currency,
        status: request.status,
        offset: request.offset,
        limit: request.limit,
      },
    );

    const formattedTransactions: Wallets.Transaction[] = transactions.map((t) => ({
      id: t.id,
      userId: t.userId,
      baseWalletId: t.baseWalletId,
      targetWalletId: t.targetWalletId || "",
      type: t.type,
      baseCurrency: t.baseCurrency,
      targetCurrency: t.targetCurrency || "",
      baseAmount: t.baseAmount,
      targetAmount: t.targetAmount,
      status: t.status,
      exchangeRate: t.exchangeRate,
      exchangeRateWithSpread: t.exchangeRateWithSpread,
      percentageSpread: t.percentageSpread,
      reference: t.reference,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return {
      data: {
        transactions: formattedTransactions,
        total,
      },
    } as any;
  }
}
