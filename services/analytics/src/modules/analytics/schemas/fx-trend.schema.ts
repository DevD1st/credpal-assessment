import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FxTrendDocument = HydratedDocument<FxTrend>;

@Schema({ minimize: false })
export class FxTrend {
  _id: Types.ObjectId;

  @Prop()
  baseCurrency: string;

  @Prop()
  targetCurrency: string;

  @Prop({ type: Types.Decimal128 })
  rate: Types.Decimal128;

  @Prop()
  provider: string;

  @Prop({ index: true })
  fetchedAt: Date;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

export const FxTrendSchema = SchemaFactory.createForClass(FxTrend);
