import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserActivityDocument = HydratedDocument<UserActivity>;

@Schema({ minimize: false })
export class UserActivity {
  _id: Types.ObjectId;

  @Prop({ index: true })
  userId: string;

  @Prop()
  activityType: string;

  @Prop({ type: Object })
  reqContext: Record<string, any>;

  @Prop({ default: () => new Date(), index: true })
  createdAt: Date;
}

export const UserActivitySchema = SchemaFactory.createForClass(UserActivity);
