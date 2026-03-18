import { Wallets } from '@credpal-fx-trading-app/proto';
import { ClientMetadata } from '@credpal-fx-trading-app/common';

export class GetWalletsQuery {
  constructor(
    public readonly request: Wallets.GetWalletsInput,
    public readonly meta: ClientMetadata,
  ) {}
}
