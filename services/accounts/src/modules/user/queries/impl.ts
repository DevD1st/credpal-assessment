import { ClientMetadata } from '@credpal-fx-trading-app/common';

export class IsEmailUsedForAccountQuery {
  constructor(
    public readonly email: string,
    public readonly meta: ClientMetadata,
  ) {}
}
