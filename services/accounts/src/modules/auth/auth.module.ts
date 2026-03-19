import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { AuthController } from "./controllers/auth.controller.js";
import { RegisterAccountHandler } from "./commands/handlers/register-account.handler.js";
import { VerifyOTPHandler } from "./commands/handlers/verify-otp.handler.js";
import { GenerateAuthTokenForProfileHandler } from "./commands/handlers/generate-token.handler.js";
import { LoginHandler } from "./commands/handlers/login.handler.js";
import { RefreshTokenHandler } from "./commands/handlers/refresh-token.handler.js";
import { RABBIT_MQ_CLIENT, ACCOUNTS_RMQ_QUEUE } from "../../utils/index.js";

const CommandHandlers: any[] = [
  RegisterAccountHandler,
  VerifyOTPHandler,
  LoginHandler,
  RefreshTokenHandler,
  GenerateAuthTokenForProfileHandler,
];
const QueryHandlers: any[] = [];

@Module({
  imports: [
    CqrsModule,
    ClientsModule.register([
      {
        name: RABBIT_MQ_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: ["amqp://localhost:5672"],
          queue: ACCOUNTS_RMQ_QUEUE,
        },
      },
    ]),
  ],
  providers: [...CommandHandlers, ...QueryHandlers],
  controllers: [AuthController],
})
export class AuthModule {}
