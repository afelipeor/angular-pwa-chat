export interface Chat {
  id: string;
  name: string;
  participants: string[];
  isGroup: boolean;
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
}