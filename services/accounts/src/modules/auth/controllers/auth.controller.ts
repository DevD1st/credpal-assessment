import { ClientMetadata } from "@credpal-fx-trading-app/common";
import { Accounts } from "@credpal-fx-trading-app/proto";
import {
  ContextGrpc,
  GrpcExceptionFilter,
} from "@credpal-fx-trading-app/runtime";
import { Controller, UseFilters } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { GrpcMethod, Payload } from "@nestjs/microservices";
import {
  LoginCommand,
  RefreshTokenCommand,
  RegisterAccountCommand,
  VerifyOTPCommand,
} from "../commands/impl.js";

@Controller()
@UseFilters(new GrpcExceptionFilter())
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @GrpcMethod("AuthService", "RegisterAccount")
  async registerAccount(
    @Payload() request: Accounts.RegisterAccountInput,
    @ContextGrpc() meta: ClientMetadata,
  ): Promise<Accounts.OTPExpirationResponse> {
    const data = await this.commandBus.execute(
      new RegisterAccountCommand(request, meta),
    );
    return { data };
  }

  @GrpcMethod("AuthService", "VerifyOTP")
  async verifyOTP(
    @Payload() request: Accounts.VerifyOTPInput,
    @ContextGrpc() meta: ClientMetadata,
  ): Promise<Accounts.AuthCredentialsResponse> {
    const data = await this.commandBus.execute(
      new VerifyOTPCommand(request, meta),
    );
    return { data };
  }

  @GrpcMethod("AuthService", "Login")
  async login(
    @Payload() request: Accounts.LoginInput,
    @ContextGrpc() meta: ClientMetadata,
  ): Promise<Accounts.AuthCredentialsResponse> {
    const data = await this.commandBus.execute(new LoginCommand(request, meta));
    return { data };
  }

  @GrpcMethod("AuthService", "RefreshToken")
  async refreshToken(
    @Payload() request: Accounts.RefreshTokenInput,
    @ContextGrpc() meta: ClientMetadata,
  ): Promise<Accounts.AuthCredentialsResponse> {
    const data = await this.commandBus.execute(
      new RefreshTokenCommand(request, meta),
    );
    return { data };
  }
}
