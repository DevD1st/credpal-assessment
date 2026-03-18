import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { LoggingModule } from "@credpal-fx-trading-app/runtime";
import { getDefaultLoggerOpts } from "@credpal-fx-trading-app/common";
import { getConfig } from "./utils/index.js";
import { ConfigModule } from "@nestjs/config";
import { NotificationModule } from "./modules/notification/notification.module.js";

@Module({
  imports: [
    CqrsModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../env/root.env", "../../env/notifications.env"],
    }),
    LoggingModule.register({
      ...getDefaultLoggerOpts(getConfig),
    }),
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
