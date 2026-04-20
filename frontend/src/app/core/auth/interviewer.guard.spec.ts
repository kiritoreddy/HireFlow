import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { interviewerGuard } from './interviewer.guard';
import { AuthService } from './auth.service';

describe('interviewerGuard', () => {
  const treeLogin = {} as UrlTree;
  const treeDashboard = {} as UrlTree;

  function setup(auth: {
    isLoggedIn: () => boolean;
    getCurrentUser: () => ReturnType<AuthService['getCurrentUser']>;
  }) {
    const createUrlTree = vi.fn((commands: string[]) =>
      commands[0] === '/login' ? treeLogin : treeDashboard
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth as unknown as AuthService },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
    return createUrlTree;
  }

  it('allows interviewer role users', () => {
    setup({
      isLoggedIn: () => true,
      getCurrentUser: () => ({ displayName: 'Interviewer', email: 'i@b', role: 'interviewer' }),
    });
    const result = TestBed.runInInjectionContext(() => interviewerGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to /login', () => {
    const createUrlTree = setup({ isLoggedIn: () => false, getCurrentUser: () => null });
    const result = TestBed.runInInjectionContext(() => interviewerGuard({} as never, {} as never));
    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(treeLogin);
  });

  it('redirects admin to /dashboard', () => {
    const createUrlTree = setup({
      isLoggedIn: () => true,
      getCurrentUser: () => ({ displayName: 'Admin', email: 'a@b', role: 'admin' }),
    });
    const result = TestBed.runInInjectionContext(() => interviewerGuard({} as never, {} as never));
    expect(createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe(treeDashboard);
  });

  it('redirects candidate to /dashboard', () => {
    const createUrlTree = setup({
      isLoggedIn: () => true,
      getCurrentUser: () => ({ displayName: 'Candidate', email: 'c@b', role: 'candidate' }),
    });
    const result = TestBed.runInInjectionContext(() => interviewerGuard({} as never, {} as never));
    expect(createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe(treeDashboard);
  });

  it('redirects hiring manager to /dashboard', () => {
    const createUrlTree = setup({
      isLoggedIn: () => true,
      getCurrentUser: () => ({ displayName: 'HM', email: 'hm@b', role: 'hiring_manager' }),
    });
    const result = TestBed.runInInjectionContext(() => interviewerGuard({} as never, {} as never));
    expect(createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe(treeDashboard);
  });
});
