export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: UserStatus;
}

export type UserStatus = 'online' | 'offline' | 'away';
