import { BaseUser } from './user.model';

export interface RegisterData extends BaseUser {
  password: string;
}
