import { Message } from './message.model';
import { User } from './user.model';

export interface Chat {
  _id: string;
  name: string;
  participants: User[];
  isGroup: boolean;
  lastMessage?: Message;
  createdAt?: Date;
  updatedAt?: Date;
  avatar?: string;
  unreadCount: number;
}
