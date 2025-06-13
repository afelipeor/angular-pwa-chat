export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export type UserRole = 'user' | 'admin';
