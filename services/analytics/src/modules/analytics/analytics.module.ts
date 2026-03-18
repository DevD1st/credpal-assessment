import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { MongooseModule } from "@nestjs/mongoose";
import { UserActivity, UserActivitySchema } from "./schemas/user-activity.schema.js";
import { FxTrend, FxTrendSchema } from "./schemas/fx-trend.schema.js";
import { TradeAnalytics, TradeAnalyticsSchema } from "./schemas/trade-analytics.schema.js";

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
  providers: [...CommandHandlers, ...QueryHandlers],
  controllers: [],
})
export class AnalyticsModule {}
