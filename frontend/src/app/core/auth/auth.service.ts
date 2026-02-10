import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

const STATIC_USERNAME = 'admin';
const STATIC_PASSWORD = 'admin123';
const AUTH_KEY = 'hireflow_logged_in';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = signal<boolean>(this.hasStoredSession());

  isLoggedIn = computed(() => this.loggedIn());

  constructor(private router: Router) {}

  login(username: string, password: string): boolean {
    if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
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

  private hasStoredSession(): boolean {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }
}
