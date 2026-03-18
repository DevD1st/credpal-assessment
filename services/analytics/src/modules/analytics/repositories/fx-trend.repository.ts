import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FxTrend, FxTrendDocument } from '../schemas/fx-trend.schema.js';
import { IFxTrendRepository } from './fx-trend.repository.interface.js';

@Injectable()
export class FxTrendRepository implements IFxTrendRepository {
  constructor(
    @InjectModel(FxTrend.name)
    private readonly fxTrendModel: Model<FxTrendDocument>,
  ) {}

  async createTrend(trend: Partial<FxTrend>): Promise<FxTrend> {
    try {
      const createdTrend = new this.fxTrendModel(trend);
      return await createdTrend.save();
    } catch (error) {
      throw new InternalServerErrorException('Unable to complete operation.');
    }
  }

  async findById(id: string): Promise<FxTrend | null> {
    return this.fxTrendModel.findById(id).exec();
  }
}
