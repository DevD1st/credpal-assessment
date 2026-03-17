import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { LoggingModule } from "@credpal-fx-trading-app/runtime";
import { getDefaultLoggerOpts } from "@credpal-fx-trading-app/common";
import { getConfig } from "./utils/index.js";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    CqrsModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../env/root.env", "../../env/wallets.env"],
    }),
    LoggingModule.register({
      ...getDefaultLoggerOpts(getConfig),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
