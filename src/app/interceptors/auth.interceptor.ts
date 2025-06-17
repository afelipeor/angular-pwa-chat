// filepath: src/app/interceptors/auth.interceptor.ts
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Get token
    const token = this.authService.getToken();

    // Clone request and add authorization header if token exists
    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Handle the request
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // If 401 error, logout user (no refresh endpoint available)
        if (error.status === 401 && token) {
          this.authService.logout();
        }

        return throwError(() => error);
      })
    );
  }
}
