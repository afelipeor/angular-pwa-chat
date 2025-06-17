import { User } from './user.model';

export interface RegisterData extends User {
  password: string;
}
