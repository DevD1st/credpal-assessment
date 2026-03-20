import { Controller, Inject } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { ApiTags } from "@nestjs/swagger";
import { RPC_WALLETS_SERVICE } from "src/utils";
import { IRPCWalletsService } from "src/utils/wallets-rpc.interface";

@ApiTags("Wallet")
@Controller({ path: "wallet", version: "1" })
export class WalletsController {
  private walletsService: IRPCWalletsService;

  constructor(
    @Inject(RPC_WALLETS_SERVICE) private readonly accountsClient: ClientGrpc,
  ) {
    this.walletsService =
      this.accountsClient.getService<IRPCWalletsService>("WalletsService");
  }
}
