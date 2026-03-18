import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { LoggingModule } from "@credpal-fx-trading-app/runtime";
import { getDefaultLoggerOpts } from "@credpal-fx-trading-app/common";
import { getConfig } from "./utils/index.js";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@Module({
  imports: [
    CqrsModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../env/root.env", "../../env/wallets.env"],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const environment = getConfig("environment");
        const host = getConfig("datastores.postgres.write.host");
        const port = getConfig("datastores.postgres.write.port");
        const username = getConfig("datastores.postgres.write.user");
        const password = getConfig("datastores.postgres.write.password");
        const database = getConfig("datastores.postgres.write.database");

        return {
          type: "postgres",
          host,
          port,
          username,
          password,
          database,
          synchronize: true,
          entities: [path.join(__dirname, "..", "**", "*.entity{.ts,.js}")],
          migrations: [path.join(__dirname, "database", "migrations", "*{.ts,.js}")],
          migrationsRun: false,
          autoLoadEntities: true,
          ssl:
            environment === "development"
              ? false
              : {
                  rejectUnauthorized: false,
                },
        };
      },
    }),
    LoggingModule.register({
      ...getDefaultLoggerOpts(getConfig),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
