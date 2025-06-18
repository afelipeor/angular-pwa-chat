import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LoginCredentials } from '../../models';
import { AuthService } from '../../services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  infoMessage = ''; // For showing session expired message

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [true],
    });
  }

  ngOnInit(): void {
    // Check for session expired message
    this.route.queryParams.subscribe((params) => {
      if (params['message']) {
        this.infoMessage = params['message'];
      }
    });

    // Redirect if already logged in (and token is not expired)
    if (
      this.authService.isAuthenticated() &&
      !this.authService.isTokenExpired()
    ) {
      this.router.navigate(['/']);
    }
  }
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.infoMessage = '';

      const credentials: LoginCredentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      };

      this.authService
        .login(credentials, this.loginForm.value.remember)
        .subscribe({
          next: () => {
            // Clear any query params when redirecting after successful login
            this.router.navigate(['/'], { replaceUrl: true });
          },
          error: (error) => {
            console.error('Login error:', error);
            this.errorMessage =
              error.message || 'Login failed. Please try again.';
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          },
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }
}
