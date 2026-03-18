import { ClientMetadata } from "@credpal-fx-trading-app/common";
import { Wallets } from "@credpal-fx-trading-app/proto";
import {
  ContextGrpc,
  GrpcExceptionFilter,
} from "@credpal-fx-trading-app/runtime";
import { Controller, UseFilters } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { GrpcMethod, Payload } from "@nestjs/microservices";
import { CreateWalletCommand, FundWalletCommand } from "../commands/impl.js";
import { GetWalletsQuery } from "../queries/impl.js";

@Controller()
@UseFilters(new GrpcExceptionFilter())
export class WalletController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @GrpcMethod("WalletsService", "CreateWallet")
  async createWallet(
    @Payload() request: Wallets.CreateWalletInput,
    @ContextGrpc() meta: ClientMetadata,
  ): Promise<Wallets.CreateWalletResponse> {
    const data = await this.commandBus.execute(
      new CreateWalletCommand(request, meta),
    );
    return { data };
  }
  @GrpcMethod("WalletsService", "GetWallets")
  async getWallets(
    @Payload() request: Wallets.GetWalletsInput,
    @ContextGrpc() meta: ClientMetadata,
  ): Promise<Wallets.GetWalletsResponse> {
    const data = await this.queryBus.execute(
      new GetWalletsQuery(request, meta),
    );
    return { data };
  }

  @GrpcMethod("WalletsService", "FundWallet")
  async fundWallet(
    @Payload() request: Wallets.FundWalletInput,
    @ContextGrpc() meta: ClientMetadata,
  ): Promise<Wallets.FundWalletResponse> {
    const data = await this.commandBus.execute(
      new FundWalletCommand(request, meta),
    );
    return { data };
  }
}
