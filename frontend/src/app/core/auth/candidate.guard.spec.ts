import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { hiringOnlyGuard } from './candidate.guard';
import { AuthService } from './auth.service';
import { vi } from 'vitest';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { computed, signal } from '@angular/core';

const makeAuth = (loggedIn: boolean, role: string) => ({
  isLoggedIn: computed(() => loggedIn),
  getCurrentUser: vi.fn().mockReturnValue(loggedIn ? { displayName: 'Test', email: 'test@test.com', role } : null),
});

const fakeRoute = {} as ActivatedRouteSnapshot;
const fakeState = { url: '/jobs' } as RouterStateSnapshot;

const runGuard = (loggedIn: boolean, role: string) => {
  const authSpy = makeAuth(loggedIn, role);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: authSpy },
    ],
  });
  return TestBed.runInInjectionContext(() => hiringOnlyGuard(fakeRoute, fakeState));
};

describe('hiringOnlyGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('should allow admin users to access hiring routes', () => {
    const result = runGuard(true, 'admin');
    expect(result).toBe(true);
  });

  it('should allow hiring_manager users to access hiring routes', () => {
    const result = runGuard(true, 'hiring_manager');
    expect(result).toBe(true);
  });

  it('should redirect candidate users away from hiring routes', () => {
    const result = runGuard(true, 'candidate');
    expect(result).not.toBe(true);
  });

  it('should redirect unauthenticated users to /login', () => {
    const result = runGuard(false, '');
    expect(result).not.toBe(true);
  });
});
