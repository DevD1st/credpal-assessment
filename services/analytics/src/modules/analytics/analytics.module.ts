import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { MongooseModule } from "@nestjs/mongoose";
import { UserActivity, UserActivitySchema } from "./schemas/user-activity.schema.js";
import { FxTrend, FxTrendSchema } from "./schemas/fx-trend.schema.js";
import { TradeAnalytics, TradeAnalyticsSchema } from "./schemas/trade-analytics.schema.js";
import { UserActivityRepository } from "./repositories/user-activity.repository.js";
import { USER_ACTIVITY_REPOSITORY_TOKEN } from "./repositories/user-activity.repository.interface.js";
import { FxTrendRepository } from "./repositories/fx-trend.repository.js";
import { FX_TREND_REPOSITORY_TOKEN } from "./repositories/fx-trend.repository.interface.js";
import { TradeAnalyticsRepository } from "./repositories/trade-analytics.repository.js";
import { TRADE_ANALYTICS_REPOSITORY_TOKEN } from "./repositories/trade-analytics.repository.interface.js";

const CommandHandlers: any[] = [];
const QueryHandlers: any[] = [];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: UserActivity.name, schema: UserActivitySchema },
      { name: FxTrend.name, schema: FxTrendSchema },
      { name: TradeAnalytics.name, schema: TradeAnalyticsSchema },
    ]),
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: USER_ACTIVITY_REPOSITORY_TOKEN,
      useClass: UserActivityRepository,
    },
    {
      provide: FX_TREND_REPOSITORY_TOKEN,
      useClass: FxTrendRepository,
    },
    {
      provide: TRADE_ANALYTICS_REPOSITORY_TOKEN,
      useClass: TradeAnalyticsRepository,
    },
  ],
  controllers: [],
  exports: [
    USER_ACTIVITY_REPOSITORY_TOKEN,
    FX_TREND_REPOSITORY_TOKEN,
    TRADE_ANALYTICS_REPOSITORY_TOKEN,
  ],
})
export class AnalyticsModule {}
