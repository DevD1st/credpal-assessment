import { Wallets } from "@credpal-fx-trading-app/proto";
import { ClientMetadata } from "@credpal-fx-trading-app/common";

export class CreateQuoteCommand {
  constructor(
    public readonly request: Wallets.CreateQuoteInput,
    public readonly meta: ClientMetadata,
  ) {}
}
