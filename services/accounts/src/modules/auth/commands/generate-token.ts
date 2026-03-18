import { ClientMetadata } from '@credpal-fx-trading-app/common';
import { User } from '../../user/entities/user.entity.js';

export class GenerateAuthTokenForProfileCommand {
  constructor(
    public readonly user: User,
    public readonly meta: ClientMetadata,
  ) {}
}
