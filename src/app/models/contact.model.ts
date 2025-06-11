import { User } from './user.model';

export interface Contact extends User {
  phone?: string;
  lastSeen?: Date;
  isBlocked?: boolean;
  selected?: boolean;
}
