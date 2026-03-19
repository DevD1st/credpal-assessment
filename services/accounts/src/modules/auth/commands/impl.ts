import { Accounts } from "@credpal-fx-trading-app/proto";
import { ClientMetadata } from "@credpal-fx-trading-app/common";

export class RegisterAccountCommand {
  constructor(
    public readonly request: Accounts.RegisterAccountInput,
    public readonly meta: ClientMetadata,
  ) {}
}

export class VerifyOTPCommand {
  constructor(
    public readonly request: Accounts.VerifyOTPInput,
    public readonly meta: ClientMetadata,
  ) {}
}

export class LoginCommand {
  constructor(
    public readonly request: Accounts.LoginInput,
    public readonly meta: ClientMetadata,
  ) {}
}

export class RefreshTokenCommand {
  constructor(
    public readonly request: Accounts.RefreshTokenInput,
    public readonly meta: ClientMetadata,
  ) {}
}
