import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { LoggingModule } from "@credpal-fx-trading-app/runtime";
import { getDefaultLoggerOpts } from "@credpal-fx-trading-app/common";
import { getConfig } from "./utils/index.js";
import { ConfigModule } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import KeyvRedis, { RedisClientOptions } from "@keyv/redis";
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
      envFilePath: ["../../env/root.env", "../../env/accounts.env"],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory() {
        const environment = getConfig("environment");
        const host = getConfig("datastores.redis.host");
        const port = getConfig("datastores.redis.port");

        // show casing how a prod config differs from dev
        const protocol = environment === "development" ? "redis" : "rediss";
        const redisUri = `${protocol}://${host}:${port}`;

        const redisOption: RedisClientOptions = {
          url: redisUri,
          socket:
            environment === "development"
              ? undefined
              : {
                  tls: true,
                  rejectUnauthorized: false,
                },
        };

        const redisConnection = new KeyvRedis(redisOption as any);
        redisConnection.on("error", (error: any) => console.error(error));

        return {
          stores: [redisConnection],
        };
      },
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
