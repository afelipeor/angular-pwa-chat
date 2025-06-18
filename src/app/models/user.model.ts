// Base user data without _id (for registration, etc.)
export interface BaseUser {
  name: string;
  email: string;
  avatar?: string;
  status?: UserStatus;
}

// Full user with _id (for authenticated users)
export interface User extends BaseUser {
  _id: string; // MongoDB always provides _id for existing users
}

export type UserStatus = 'online' | 'offline' | 'away';
