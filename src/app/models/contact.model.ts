export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  isBlocked?: boolean;
}
