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

// Replace with your actual Google OAuth Client ID
const GOOGLE_CLIENT_ID = ''; // TODO: set your Google OAuth Client ID here

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
    this.initGoogleSignIn();
  }

  private initGoogleSignIn(): void {
    // Only initialize if GIS script loaded and Client ID is configured
    if (typeof google === 'undefined' || !GOOGLE_CLIENT_ID) {
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          // Run inside Angular zone so change detection fires
          this.zone.run(() => this.handleGoogleCredential(response.credential));
        },
        auto_select: false,
      });

      const btnEl = document.getElementById('google-signin-btn');
      if (btnEl) {
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
      // GIS not available — fallback button shown
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
    if (typeof google !== 'undefined' && GOOGLE_CLIENT_ID) {
      google.accounts.id.prompt();
    } else {
      this.error = 'Google Sign-In is not configured yet. Please use email and password.';
    }
  }
}
