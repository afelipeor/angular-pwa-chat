import { Attachment } from './attachment.model';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: MessageType;
  status: MessageStatus;
  replyTo?: string;
  attachments?: Attachment[];
}
export type MessageType = 'text' | 'image' | 'file' | 'audio';
export type MessageStatus = 'sent' | 'delivered' | 'read';
