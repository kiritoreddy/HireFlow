import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

const STATIC_USERNAME = 'admin';
const STATIC_PASSWORD = 'admin123';
const AUTH_KEY = 'hireflow_logged_in';
const RESET_PASSWORD_KEY = 'hireflow_reset_password';

/** Current user profile (mock). Replace with API/token when backend is ready. */
export interface CurrentUserProfile {
  displayName: string;
  email: string;
  username: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = signal<boolean>(this.hasStoredSession());

  isLoggedIn = computed(() => this.loggedIn());

  /** Current user for profile display. Mock for static login; later from token/API. */
  getCurrentUser(): CurrentUserProfile | null {
    if (!this.hasStoredSession()) return null;
    return {
      displayName: 'Admin User',
      email: 'admin@hireflow.demo',
      username: STATIC_USERNAME,
      role: 'Admin',
    };
  }

  constructor(private router: Router) {}

  private getEffectivePassword(): string {
    return localStorage.getItem(RESET_PASSWORD_KEY) ?? STATIC_PASSWORD;
  }

  login(username: string, password: string): boolean {
    if (username === STATIC_USERNAME && password === this.getEffectivePassword()) {
      this.loggedIn.set(true);
      sessionStorage.setItem(AUTH_KEY, 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    this.loggedIn.set(false);
    sessionStorage.removeItem(AUTH_KEY);
    this.router.navigate(['/login']);
  }

  setResetPassword(newPassword: string): void {
    localStorage.setItem(RESET_PASSWORD_KEY, newPassword);
  }

  clearResetPassword(): void {
    localStorage.removeItem(RESET_PASSWORD_KEY);
  }

  private hasStoredSession(): boolean {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }
}
