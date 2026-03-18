import { ClientMetadata } from "@credpal-fx-trading-app/common";
import { Wallets } from "@credpal-fx-trading-app/proto";
import {
  ContextGrpc,
  GrpcExceptionFilter,
} from "@credpal-fx-trading-app/runtime";
import { Controller, UseFilters } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { GrpcMethod, Payload } from "@nestjs/microservices";
import { GetTransactionsQuery } from "../queries/impl.js";

@Controller()
@UseFilters(new GrpcExceptionFilter())
export class TransactionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @GrpcMethod("TransactionsService", "GetTransactions")
  async getTransactions(
    @Payload() request: Wallets.GetTransactionsInput,
    @ContextGrpc() meta: ClientMetadata,
  ): Promise<Wallets.GetTransactionsResponse> {
    const data = await this.queryBus.execute(
      new GetTransactionsQuery(request, meta),
    );
    return data as any;
  }
}
