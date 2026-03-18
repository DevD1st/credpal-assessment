import { Wallets } from "@credpal-fx-trading-app/proto";
import { ClientMetadata } from "@credpal-fx-trading-app/common";

export class GetTransactionsQuery {
  constructor(
    public readonly request: Wallets.GetTransactionsInput,
    public readonly meta: ClientMetadata,
  ) {}
}
