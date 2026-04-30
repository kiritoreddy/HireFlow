import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { hiringOnlyGuard, hiringManagerAdminGuard, candidateGuard } from './candidate.guard';
import { AuthService } from './auth.service';
import { vi } from 'vitest';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { computed } from '@angular/core';

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

const runHmAdminGuard = (loggedIn: boolean, role: string) => {
  const authSpy = makeAuth(loggedIn, role);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: authSpy },
    ],
  });
  return TestBed.runInInjectionContext(() => hiringManagerAdminGuard(fakeRoute, fakeState));
};

describe('hiringManagerAdminGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('allows hiring_manager', () => {
    expect(runHmAdminGuard(true, 'hiring_manager')).toBe(true);
  });

  it('allows admin', () => {
    expect(runHmAdminGuard(true, 'admin')).toBe(true);
  });

  it('does not allow interviewer', () => {
    expect(runHmAdminGuard(true, 'interviewer')).not.toBe(true);
  });

  it('does not allow candidate', () => {
    expect(runHmAdminGuard(true, 'candidate')).not.toBe(true);
  });

  it('sends unauthenticated users to login', () => {
    expect(runHmAdminGuard(false, '')).not.toBe(true);
  });
});

describe('candidateGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('allows candidates', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getCurrentUser: () => ({ role: 'candidate' }) } },
        { provide: Router, useValue: { createUrlTree: vi.fn() } },
      ],
    });
    const result = TestBed.runInInjectionContext(() => candidateGuard(fakeRoute, fakeState));
    expect(result).toBe(true);
  });

  it('redirects non-candidates to dashboard', () => {
    const tree = {} as UrlTree;
    const createUrlTree = vi.fn(() => tree);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getCurrentUser: () => ({ role: 'admin' }) } },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
    const result = TestBed.runInInjectionContext(() => candidateGuard(fakeRoute, fakeState));
    expect(createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe(tree);
  });
});
