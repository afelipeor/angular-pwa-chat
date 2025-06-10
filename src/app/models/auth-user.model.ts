export interface AuthUser {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'user' | 'admin';
    isVerified: boolean;
    createdAt: Date;
    lastLogin?: Date;
  }
