import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
import { RPC_WALLETS_SERVICE } from "src/utils";
import { FxController } from "./controllers/fx.controller";

const CommandHandlers: [] = [];
const QueryHandlers: any[] = [];

const PROJECT_ROOT = join(
  process.cwd(),
  process.cwd().includes("gateway") ? "../../" : "",
);

@Module({
  imports: [
    CqrsModule,
    ClientsModule.register([
      {
        name: RPC_WALLETS_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: "wallets",
          protoPath: join(process.cwd(), "..", "..", "protobuf/wallets.proto"),
          url: process.env.WALLETS_SERVICE_URL || "wallets:50054",
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
  controllers: [FxController],
})
export class FxModule {}
