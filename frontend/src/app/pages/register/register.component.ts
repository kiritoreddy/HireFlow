import {
  ChangeDetectorRef,
  Component,
  OnInit,
  AfterViewInit,
  NgZone,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GOOGLE_CLIENT_ID } from '../../core/config/google-client.config';

declare const google: {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        auto_select?: boolean;
      }): void;
      renderButton(element: HTMLElement, options: object): void;
      prompt(): void;
    };
  };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit, AfterViewInit {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  hidePassword = true;
  hideConfirm = true;
  error = '';
  success = '';
  loading = false;
  googleLoading = false;
  googleAvailable = false;

  private googleInitAttempts = 0;
  private readonly maxGoogleInitAttempts = 50;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  ngAfterViewInit(): void {
    this.scheduleGoogleInit();
  }

  private scheduleGoogleInit(): void {
    if (!GOOGLE_CLIENT_ID) return;

    if (typeof google === 'undefined') {
      this.googleInitAttempts++;
      if (this.googleInitAttempts < this.maxGoogleInitAttempts) {
        setTimeout(() => this.zone.run(() => this.scheduleGoogleInit()), 100);
      }
      return;
    }

    this.initGoogleSignIn();
  }

  private initGoogleSignIn(): void {
    if (typeof google === 'undefined' || !GOOGLE_CLIENT_ID) return;

    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          this.zone.run(() => this.handleGoogleCredential(response.credential));
        },
        auto_select: false,
      });

      const btnEl = document.getElementById('google-register-btn');
      if (btnEl) {
        btnEl.replaceChildren();
        google.accounts.id.renderButton(btnEl, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular',
        });
        this.googleAvailable = true;
        this.cdr.detectChanges();
      }
    } catch {
      // Fallback button remains
    }
  }

  private handleGoogleCredential(idToken: string): void {
    this.error = '';
    this.googleLoading = true;

    this.auth.loginWithGoogle(idToken).subscribe((result) => {
      this.googleLoading = false;

      if (result.success) {
        const role = this.auth.getCurrentUser()?.role ?? '';
        const destination =
          role === 'candidate'
            ? '/portal/jobs'
            : role === 'interviewer'
              ? '/interviewer/interviews'
              : '/dashboard';
        this.router.navigate([destination]);
      } else {
        this.error = result.error ?? 'Google sign-up failed.';
      }
      this.cdr.detectChanges();
    });
  }

  signUpWithGoogle(): void {
    this.error = '';
    if (!GOOGLE_CLIENT_ID) {
      this.error = 'Google Sign-In is not configured yet. Please register with email and password.';
      return;
    }
    if (typeof google === 'undefined') {
      this.error =
        'Google script is still loading. Wait a few seconds and try again, or refresh the page.';
      return;
    }
    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          this.zone.run(() => this.handleGoogleCredential(response.credential));
        },
        auto_select: false,
      });
      google.accounts.id.prompt();
    } catch {
      this.error = 'Could not start Google sign-in. Please try again.';
    }
  }

  onSubmit(): void {
    this.error = '';
    this.success = '';

    if (!this.name.trim() || !this.email.trim() || !this.password.trim()) {
      this.error = 'All fields are required.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters.';
      return;
    }

    this.loading = true;
    this.auth.register(this.name.trim(), this.email.trim(), this.password.trim()).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.success = 'Account created! Redirecting to login…';
          setTimeout(() => this.router.navigate(['/login']), 1800);
        } else {
          this.error = result.error ?? 'Registration failed. Please try again.';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Cannot reach server. Is the backend running?';
      },
    });
  }
}
