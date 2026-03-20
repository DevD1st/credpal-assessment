import { Controller, Inject } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { ApiTags } from "@nestjs/swagger";
import { IRPCTransactionsService, RPC_WALLETS_SERVICE } from "src/utils";

@ApiTags("Transactions")
@Controller({ path: "transactions", version: "1" })
export class TransactionsController {
  private trasnsactionsService: IRPCTransactionsService;

  constructor(
    @Inject(RPC_WALLETS_SERVICE) private readonly walletssClient: ClientGrpc,
  ) {
    this.trasnsactionsService =
      this.walletssClient.getService<IRPCTransactionsService>(
        "TransactionsService",
      );
  }
}
