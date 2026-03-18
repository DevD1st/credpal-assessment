import { Wallets } from '@credpal-fx-trading-app/proto';
import { ClientMetadata } from '@credpal-fx-trading-app/common';

export class CreateWalletCommand {
  constructor(
    public readonly request: Wallets.CreateWalletInput,
    public readonly meta: ClientMetadata,
  ) {}
}

export class FundWalletCommand {
  constructor(
    public readonly request: Wallets.FundWalletInput,
    public readonly meta: ClientMetadata,
  ) {}
}

export class TradeCurrencyCommand {
  constructor(
    public readonly request: Wallets.TradeCurrencyInput,
    public readonly meta: ClientMetadata,
  ) {}
}
