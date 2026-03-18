import { Wallets } from "@credpal-fx-trading-app/proto";
import { ClientMetadata } from "@credpal-fx-trading-app/common";

export class FetchExchangeRatesQuery {
  constructor(
    public readonly request: Wallets.FetchExchangeRatesInput,
    public readonly meta: ClientMetadata,
  ) {}
}
