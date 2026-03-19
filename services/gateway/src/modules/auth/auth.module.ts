import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
import { RPC_ACCOUNTS_SERVICE } from "../../utils/index.js";
import { AuthController } from "./controllers/auth.controller.js";
import { ValidateAccessTokenHandler } from "./queries/handlers/validate-access-token.handler.js";
import { ValidateRefreshTokenHandler } from "./queries/handlers/validate-refresh-token.handler.js";

const CommandHandlers: [] = [];
const QueryHandlers: any[] = [
  ValidateAccessTokenHandler,
  ValidateRefreshTokenHandler,
];

const PROJECT_ROOT = join(
  process.cwd(),
  process.cwd().includes("gateway") ? "../../" : "",
);

@Module({
  imports: [
    CqrsModule,
    ClientsModule.register([
      {
        name: RPC_ACCOUNTS_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: "accounts",
          protoPath: join(process.cwd(), "..", "..", "protobuf/accounts.proto"),
          url: process.env.ACCOUNTS_SERVICE_URL || "accounts:50051",
          loader: {
            includeDirs: [PROJECT_ROOT],
            json: true,
            enums: String,
            objects: true,
            arrays: true,
          },
        },
      },
    ]),
  ],
  providers: [...CommandHandlers, ...QueryHandlers],
  controllers: [AuthController],
})
export class AuthModule {}
