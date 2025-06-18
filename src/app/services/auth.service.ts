import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginCredentials, RegisterData } from '../models';
import { User } from '../models/user.model';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private socketService: SocketService
  ) {
    this.initializeAuth();
  }
  private initializeAuth(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();

    if (token && user) {
      this.currentUserSubject.next(user);
      this.tokenSubject.next(token);
      // Establish socket connection for authenticated user
      this.socketService.connect(token);
    }
  }

  private getStoredToken(): string | null {
    return (
      localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    );
  }

  private getStoredUser(): User | null {
    const userStr =
      localStorage.getItem('current_user') ||
      sessionStorage.getItem('current_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.clearStorage();
      }
    }
    return null;
  }

  private setStoredAuth(
    user: User,
    token: string,
    remember: boolean = true
  ): void {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('auth_token', token);
    storage.setItem('current_user', JSON.stringify(user));
  }

  private clearStorage(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('current_user');
  }

  /**
   * Login user
   */ login(
    credentials: LoginCredentials,
    remember: boolean = true
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          this.setStoredAuth(response.user, response.token, remember);
          this.currentUserSubject.next(response.user);
          this.tokenSubject.next(response.token);
          // Establish socket connection for authenticated user
          this.socketService.connect(response.token);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */ register(userData: RegisterData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap((response) => {
          this.setStoredAuth(response.user, response.token, true);
          this.currentUserSubject.next(response.user);
          this.tokenSubject.next(response.token);
          // Establish socket connection for authenticated user
          this.socketService.connect(response.token);
        }),
        catchError(this.handleError)
      );
  }
  /**
   * Clear authentication state without logout navigation
   * Used internally when tokens are invalid
   */
  clearAuth(): void {
    // Disconnect socket
    this.socketService.disconnect();

    // Clear local state
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
  }

  /**
   * Handle expired token scenario
   * Show user-friendly message and redirect to login
   */
  handleExpiredToken(): void {
    console.warn('Token has expired. Redirecting to login.');

    // Clear auth state
    this.clearAuth();

    // Navigate to login with message
    this.router.navigate(['/login'], {
      queryParams: {
        message: 'Your session has expired. Please log in again.',
      },
    });
  }

  /**
   * Logout user
   */ logout(): void {
    // Get token before clearing it
    const token = this.getToken();

    // Disconnect socket first
    this.socketService.disconnect();

    // Clear local state immediately
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);

    // Optional: Call server logout endpoint (but don't wait for it)
    if (token) {
      this.http
        .post(
          `${this.apiUrl}/logout`,
          {},
          {
            headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
          }
        )
        .subscribe({
          complete: () => console.log('Logged out from server'),
          error: () =>
            console.log('Server logout failed, but local logout successful'),
        });
    }

    // Navigate to login
    this.router.navigate(['/login']);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.tokenSubject.value || this.getStoredToken();
  }
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Check if token is expired (basic check without server validation)
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Basic JWT parsing (this doesn't verify signature, just checks expiration)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true; // If we can't parse it, consider it expired
    }
  }
  /**
   * Verify token validity
   */
  verifyToken(): Observable<User> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    return this.http
      .get<User>(`${this.apiUrl}/verify`, {
        headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
      })
      .pipe(
        tap((user) => {
          this.currentUserSubject.next(user);
        }),
        catchError((error) => {
          if (error.status === 401) {
            this.logout();
          }
          return this.handleError(error);
        })
      );
  }

  private handleError = (error: any): Observable<never> => {
    console.error('AuthService error:', error);

    let errorMessage = 'An error occurred';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 401) {
      errorMessage = 'Invalid credentials';
    } else if (error.status === 403) {
      errorMessage = 'Access denied';
    } else if (error.status === 409) {
      errorMessage = 'User already exists';
    } else if (error.status === 500) {
      errorMessage = 'Server error - Please try again later';
    }

    return throwError(() => new Error(errorMessage));
  };
}
