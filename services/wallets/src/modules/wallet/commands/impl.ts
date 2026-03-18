import { Wallets } from '@credpal-fx-trading-app/proto';
import { ClientMetadata } from '@credpal-fx-trading-app/common';

export class CreateWalletCommand {
  constructor(
    public readonly request: Wallets.CreateWalletInput,
    public readonly meta: ClientMetadata,
  ) {}
}
