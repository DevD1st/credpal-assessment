import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserActivity, UserActivityDocument } from '../schemas/user-activity.schema.js';
import { IUserActivityRepository } from './user-activity.repository.interface.js';

@Injectable()
export class UserActivityRepository implements IUserActivityRepository {
  constructor(
    @InjectModel(UserActivity.name)
    private readonly userActivityModel: Model<UserActivityDocument>,
  ) {}

  async createActivity(activity: Partial<UserActivity>): Promise<UserActivity> {
    try {
      const createdActivity = new this.userActivityModel(activity);
      return await createdActivity.save();
    } catch (error) {
      throw new InternalServerErrorException('Unable to complete operation.');
    }
  }

  async findById(id: string): Promise<UserActivity | null> {
    return this.userActivityModel.findById(id).exec();
  }
}
