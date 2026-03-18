import { ClientMetadata } from "@credpal-fx-trading-app/common";
import { Wallets } from "@credpal-fx-trading-app/proto";
import {
  ContextGrpc,
  GrpcExceptionFilter,
} from "@credpal-fx-trading-app/runtime";
import { Controller, UseFilters } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { GrpcMethod, Payload } from "@nestjs/microservices";
import { CreateWalletCommand } from "../commands/impl.js";

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
}
