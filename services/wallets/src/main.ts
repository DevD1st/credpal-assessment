import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module.js";
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from "@credpal-fx-trading-app/runtime";
import { join } from "path";
import { getConfig } from "./utils/index.js";

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const logger = app.get<LoggingService>(LOGGING_SERVICE_TOKEN);
    app.useLogger(logger);

    // Define Root - Assuming running from services/wallets, we go up 2 levels
    const PROJECT_ROOT = join(
      process.cwd(),
      process.cwd().includes("services") ? "../../" : "",
    );

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options: {
        package: getConfig("service"),
        protoPath: join(process.cwd(), "..", "..", "protobuf", "wallets.proto"),
        url: getConfig("grpc.url"),
        loader: {
          includeDirs: [PROJECT_ROOT],
          json: true,
          enums: String,
          objects: true,
          arrays: true,
        },
      },
    });

    app.enableShutdownHooks();
    await app.startAllMicroservices();
    await app.init();

    logger.log({
      message: "Wallets service started",
      url: getConfig("grpc.url"),
    });
  } catch (error) {
    console.error("Failed to start wallets service", error);
    process.exit(1);
  }
}

bootstrap();
