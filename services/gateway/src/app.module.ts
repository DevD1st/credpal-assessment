import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggingModule } from "@credpal-fx-trading-app/runtime";
import { getDefaultLoggerOpts } from "@credpal-fx-trading-app/common";
import { getConfig } from "./utils/index.js";
import { CacheModule } from "@nestjs/cache-manager";
import KeyvRedis, { RedisClientOptions } from "@keyv/redis";
import { AuthModule } from "./modules/auth/auth.module.js";

@Module({
  imports: [
    LoggingModule.register({
      ...getDefaultLoggerOpts(getConfig),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../env/root.env", "../../env/gateway.env"],
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
    AuthModule,
  ],
})
export class AppModule {}
