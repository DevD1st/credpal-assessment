import { UserActivity } from '../schemas/user-activity.schema.js';

export const USER_ACTIVITY_REPOSITORY_TOKEN = 'USER_ACTIVITY_REPOSITORY_TOKEN';

export interface IUserActivityRepository {
  createActivity(activity: Partial<UserActivity>): Promise<UserActivity>;
  findById(id: string): Promise<UserActivity | null>;
}
