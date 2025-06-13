import { Message } from './message.model';

export interface MessagesResponse {
  messages: Message[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}
