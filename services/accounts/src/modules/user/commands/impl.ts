import { ClientMetadata } from '@credpal-fx-trading-app/common';

export interface ICreateUser {
  id: string;
  email: string;
  hashedPassword?: string;
  isVerified: boolean;
  tokenVersion?: number;
}

export class CreateUserCommand {
  constructor(
    public readonly input: ICreateUser,
    public readonly meta: ClientMetadata,
  ) {}
}

export class IncrementAuthTokenVersionCommand {
  constructor(
    /** The user whose tokenVersion should be incremented */
    public readonly userId: string,
    public readonly meta: ClientMetadata,
  ) {}
}
