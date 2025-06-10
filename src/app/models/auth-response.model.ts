import { AuthUser } from './auth-user.model';

export interface AuthResponse {
    user: AuthUser;
    token: string;
    refreshToken: string;
    expiresIn: number;
  }
