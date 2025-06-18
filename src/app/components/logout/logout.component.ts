import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoutComponent {
  // Output event for when cancel is clicked (useful for modal usage)
  cancelled = output<void>();

  private authService = inject(AuthService);
  private router = inject(Router);
  logout(): void {
    try {
      this.authService.logout();
      // Note: AuthService.logout() already handles navigation to /login
    } catch (error) {
      // If logout fails, still try to navigate to login
      this.router.navigate(['/login']);
    }
  }

  cancel(): void {
    // Emit cancel event for modal usage
    try {
      this.cancelled.emit();
    } catch (error) {
      // Handle gracefully
    }

    // Fallback to history.back() if not used as modal
    try {
      history.back();
    } catch (error) {
      // Handle gracefully
    }
  }
}
