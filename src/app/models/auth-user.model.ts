export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export type UserRole = 'user' | 'admin';
