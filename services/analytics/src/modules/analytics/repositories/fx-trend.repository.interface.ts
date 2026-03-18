import { FxTrend } from '../schemas/fx-trend.schema.js';

export const FX_TREND_REPOSITORY_TOKEN = 'FX_TREND_REPOSITORY_TOKEN';

export interface IFxTrendRepository {
  createTrend(trend: Partial<FxTrend>): Promise<FxTrend>;
  findById(id: string): Promise<FxTrend | null>;
}
