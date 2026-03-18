import { ClientMetadata } from "@credpal-fx-trading-app/common";
import { Wallets } from "@credpal-fx-trading-app/proto";
import {
  ContextGrpc,
  GrpcExceptionFilter,
} from "@credpal-fx-trading-app/runtime";
import { Controller, UseFilters } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { GrpcMethod, Payload } from "@nestjs/microservices";
import { FetchExchangeRatesQuery } from "../queries/impl.js";

@Controller()
@UseFilters(new GrpcExceptionFilter())
export class FxController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @GrpcMethod("FxService", "FetchExchangeRates")
  async fetchExchangeRates(
    @Payload() request: Wallets.FetchExchangeRatesInput,
    @ContextGrpc() meta: ClientMetadata,
  ): Promise<Wallets.FetchExchangeRatesResponse> {
    const data = await this.queryBus.execute(
      new FetchExchangeRatesQuery(request, meta),
    );
    return data as any;
  }
}
