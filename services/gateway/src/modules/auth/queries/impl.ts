import { ClientMetadata, ITokenMakeup } from "@credpal-fx-trading-app/common";

export interface IValidateTokenInput {
  token: string;
}

export class ValidateAccessTokenQuery {
  constructor(
    public readonly input: IValidateTokenInput,
    public readonly meta: ClientMetadata,
  ) {}
}

export class ValidateRefreshTokenQuery {
  constructor(
    public readonly input: IValidateTokenInput,
    public readonly meta: ClientMetadata,
  ) {}
}

export type ValidateTokenResult = ITokenMakeup;
