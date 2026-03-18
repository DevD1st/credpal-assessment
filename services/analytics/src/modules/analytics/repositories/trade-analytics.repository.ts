import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TradeAnalytics, TradeAnalyticsDocument } from '../schemas/trade-analytics.schema.js';
import { ITradeAnalyticsRepository } from './trade-analytics.repository.interface.js';

@Injectable()
export class TradeAnalyticsRepository implements ITradeAnalyticsRepository {
  constructor(
    @InjectModel(TradeAnalytics.name)
    private readonly tradeAnalyticsModel: Model<TradeAnalyticsDocument>,
  ) {}

  async createAnalytics(analytics: Partial<TradeAnalytics>): Promise<TradeAnalytics> {
    try {
      const createdAnalytics = new this.tradeAnalyticsModel(analytics);
      return await createdAnalytics.save();
    } catch (error) {
      throw new InternalServerErrorException('Unable to complete operation.');
    }
  }

  async findById(id: string): Promise<TradeAnalytics | null> {
    return this.tradeAnalyticsModel.findById(id).exec();
  }
}
