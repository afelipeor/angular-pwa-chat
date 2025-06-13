import { Attachment } from './attachment.model';
import { User } from './user.model';

export interface Message {
  _id: string;
  chatId: string;
  sender: User;
  content: string;
  timestamp: Date;
  type: MessageType;
  status: MessageStatus;
  replyTo?: string;
  readBy: User[];
  attachments?: Attachment[];
}
export type MessageType = 'text' | 'image' | 'file' | 'audio';
export enum MessageTypeEnum {
  'text',
  'image',
  'file',
  'audio',
}

export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';
