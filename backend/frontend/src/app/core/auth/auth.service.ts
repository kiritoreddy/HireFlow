import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';
import { AUTH_ENDPOINTS } from '../config/api.config';

const AUTH_KEY = 'hireflow_logged_in';
const TOKEN_KEY = 'hireflow_access_token';
const USER_KEY = 'hireflow_user';

/** Backend login request */
interface LoginRequest {
  email: string;
  password: string;
}

/** Backend auth response */
interface AuthResponse {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  access_token: string;
  expires_in: number;
}

interface ForgotPasswordResponse {
  message: string;
  reset_token?: string;
  expires_in?: number;
}

interface ResetPasswordResponse {
  message: string;
}

/** Current user profile (from backend or stored). */
export interface CurrentUserProfile {
  displayName: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = signal<boolean>(this.hasStoredSession());

  isLoggedIn = computed(() => this.loggedIn());

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  /** Current user for profile display. From stored session (set after login). */
  getCurrentUser(): CurrentUserProfile | null {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const u = JSON.parse(raw);
      return {
        displayName: u.name ?? '',
        email: u.email ?? '',
        role: u.role ?? '',
      };
    } catch {
      return null;
    }
  }

  /**
   * Login via backend. Returns observable: true if success, false otherwise.
   * On success stores token and user in sessionStorage.
   */
  login(email: string, password: string) {
    const body: LoginRequest = { email: email.trim(), password: password.trim() };
    return this.http.post<AuthResponse>(AUTH_ENDPOINTS.login, body).pipe(
      tap((res) => {
        sessionStorage.setItem(TOKEN_KEY, res.access_token);
        sessionStorage.setItem(USER_KEY, JSON.stringify(res.user));
        sessionStorage.setItem(AUTH_KEY, 'true');
        this.loggedIn.set(true);
      }),
      map(() => true),
      catchError((err) => {
        const msg =
          err?.error?.error ?? (err?.status === 0 ? 'Cannot reach server. Is the backend running?' : 'Invalid credentials');
        return of({ success: false, error: msg });
      })
    );
  }

  /** Request password reset. Backend returns a demo reset token (no email sending yet). */
  requestPasswordReset(email: string) {
    const body = { email: email.trim() };
    return this.http.post<ForgotPasswordResponse>(AUTH_ENDPOINTS.forgotPassword, body).pipe(
      map((res) => ({ success: true as const, resetToken: res.reset_token ?? '' })),
      catchError((err) => {
        const msg = err?.error?.error ?? (err?.status === 0 ? 'Cannot reach server. Is the backend running?' : 'Failed to request reset');
        return of({ success: false as const, error: msg });
      })
    );
  }

  /** Reset password using token from forgot-password. */
  resetPassword(token: string, newPassword: string) {
    const body = { token: token.trim(), password: newPassword.trim() };
    return this.http.post<ResetPasswordResponse>(AUTH_ENDPOINTS.resetPassword, body).pipe(
      map(() => ({ success: true as const })),
      catchError((err) => {
        const msg = err?.error?.error ?? (err?.status === 0 ? 'Cannot reach server. Is the backend running?' : 'Failed to reset password');
        return of({ success: false as const, error: msg });
      })
    );
  }

  logout(): void {
    this.loggedIn.set(false);
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.router.navigate(['/login']);
  }

  /** Get stored JWT for API requests. */
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  private hasStoredSession(): boolean {
    return sessionStorage.getItem(AUTH_KEY) === 'true' && !!sessionStorage.getItem(TOKEN_KEY);
  }
}
