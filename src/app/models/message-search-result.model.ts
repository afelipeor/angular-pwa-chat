import { Message } from './message.model';

export interface MessageSearchResult {
  messages: Message[];
  totalCount: number;
  highlights: { [messageId: string]: string[] };
}
