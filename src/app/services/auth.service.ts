import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginCredentials, RegisterData } from '../models';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();

    if (token && user) {
      this.currentUserSubject.next(user);
      this.tokenSubject.next(token);
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
   */
  login(
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
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap((response) => {
          this.setStoredAuth(response.user, response.token, true);
          this.currentUserSubject.next(response.user);
          this.tokenSubject.next(response.token);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Optional: Call server logout endpoint
    const token = this.getToken();
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
        });
    }

    this.clearStorage();
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
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
   * Refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/refresh`,
        {},
        {
          headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
        }
      )
      .pipe(
        tap((response) => {
          this.setStoredAuth(response.user, response.token, true);
          this.currentUserSubject.next(response.user);
          this.tokenSubject.next(response.token);
        }),
        catchError((error) => {
          this.logout();
          return this.handleError(error);
        })
      );
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
