import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '../../models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-menu.component.html',
  styleUrls: ['./header-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderMenuComponent {
  currentUser$: Observable<User | null>;
  isMenuOpen = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  closeMenu(): void {
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
    // Note: AuthService.logout() already handles navigation to /login
  }

  getAvatarInitials(name: string): string {
    if (!name) return '';

    return name
      .trim()
      .split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  getStatusColor(status?: string): string {
    if (!status) return '#9e9e9e';

    switch (status.toLowerCase()) {
      case 'online':
        return '#4caf50';
      case 'away':
        return '#ff9800';
      case 'offline':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  }
}
