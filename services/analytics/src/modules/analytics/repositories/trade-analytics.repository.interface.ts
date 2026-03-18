import { TradeAnalytics } from '../schemas/trade-analytics.schema.js';

export const TRADE_ANALYTICS_REPOSITORY_TOKEN = 'TRADE_ANALYTICS_REPOSITORY_TOKEN';

export interface ITradeAnalyticsRepository {
  createAnalytics(analytics: Partial<TradeAnalytics>): Promise<TradeAnalytics>;
  findById(id: string): Promise<TradeAnalytics | null>;
}
