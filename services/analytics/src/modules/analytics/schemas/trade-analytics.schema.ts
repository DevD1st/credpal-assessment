import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TradeAnalyticsDocument = HydratedDocument<TradeAnalytics>;

@Schema({ minimize: false })
export class TradeAnalytics {
  _id: Types.ObjectId;

  @Prop({ index: true })
  transactionId: string;

  @Prop({ index: true })
  userId: string;

  @Prop()
  type: string;

  @Prop()
  baseCurrency: string;

  @Prop()
  targetCurrency: string;

  @Prop({ type: Types.Decimal128 })
  baseAmount: Types.Decimal128;

  @Prop({ type: Types.Decimal128 })
  targetAmount: Types.Decimal128;

  @Prop({ type: Types.Decimal128 })
  exchangeRate: Types.Decimal128;

  @Prop()
  status: string;

  @Prop({ default: () => new Date(), index: true })
  createdAt: Date;
}

export const TradeAnalyticsSchema = SchemaFactory.createForClass(TradeAnalytics);
