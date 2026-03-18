import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { LoggingModule } from "@credpal-fx-trading-app/runtime";
import { getDefaultLoggerOpts } from "@credpal-fx-trading-app/common";
import { getConfig } from "./utils/index.js";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AnalyticsModule } from "./modules/analytics/analytics.module.js";

@Module({
  imports: [
    CqrsModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../env/root.env", "../../env/analytics.env"],
    }),
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const MONGODB_URI = `${getConfig("datastores.mongodb.uri")}`;
        return { uri: MONGODB_URI };
      },
    }),
    LoggingModule.register({
      ...getDefaultLoggerOpts(getConfig),
    }),
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
