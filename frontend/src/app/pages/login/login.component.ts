import { ChangeDetectorRef, Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { GOOGLE_CLIENT_ID } from '../../core/config/google-client.config';

// Google Identity Services type declaration
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
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, AfterViewInit {
  email = '';
  password = '';
  error = '';
  loading = false;
  googleLoading = false;
  resetSuccess = false;
  hidePassword = true;
  googleAvailable = false;

  private googleInitAttempts = 0;
  private readonly maxGoogleInitAttempts = 50;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.resetSuccess = this.route.snapshot.queryParamMap.get('reset') === 'success';
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  ngAfterViewInit(): void {
    // GIS script is loaded async from index.html; retry until `google` exists
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

      const btnEl = document.getElementById('google-signin-btn');
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
      // Keep fallback button; user can use signInWithGoogle()
    }
  }

  private handleGoogleCredential(idToken: string): void {
    this.error = '';
    this.googleLoading = true;

    this.auth.loginWithGoogle(idToken).subscribe((result) => {
      this.googleLoading = false;

      if (result.success) {
        const role = this.auth.getCurrentUser()?.role ?? '';
        const destination = role === 'candidate' ? '/portal/jobs' : role === 'interviewer' ? '/interviewer/interviews' : '/dashboard';
        this.router.navigate([destination]);
      } else {
        this.error = result.error ?? 'Google sign-in failed.';
      }
      this.cdr.detectChanges();
    });
  }

  onSubmit(): void {
    this.error = '';
    this.loading = true;

    this.auth.login(this.email, this.password).subscribe((result) => {
      this.loading = false;

      if (result === true) {
        const role = this.auth.getCurrentUser()?.role ?? '';
        const destination = role === 'candidate' ? '/portal/jobs' : role === 'interviewer' ? '/interviewer/interviews' : '/dashboard';
        this.router.navigate([destination]);
      } else {
        this.error = (result as { error: string }).error ?? 'Invalid credentials';
      }
      this.cdr.detectChanges();
    });
  }

  signInWithGoogle(): void {
    this.error = '';
    if (!GOOGLE_CLIENT_ID) {
      this.error = 'Google Sign-In is not configured yet. Please use email and password.';
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
}
