import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggingModule } from "@credpal-fx-trading-app/runtime";
import { getDefaultLoggerOpts } from "@credpal-fx-trading-app/common";
import { getConfig } from "./utils/helpers.js";

@Module({
  imports: [
    LoggingModule.register({
      ...getDefaultLoggerOpts(getConfig),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../env/root.env", "../../env/gateway.env"],
    }),
  ],
})
export class AppModule {}
