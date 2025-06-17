import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        const token = this.authService.getToken();
        if (user && token) {
          return true;
        } else {
          // Clear any invalid tokens without logout navigation
          if (!user && token) {
            this.authService.clearAuth();
          }
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}
