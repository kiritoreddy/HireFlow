import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { vi } from 'vitest';
import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
  const treeLogin = {} as UrlTree;
  const treeHome = {} as UrlTree;

  function setup(auth: {
    isLoggedIn: () => boolean;
    getCurrentUser: () => ReturnType<AuthService['getCurrentUser']>;
  }) {
    const createUrlTree = vi.fn((commands: string[]) =>
      commands[0] === '/login' ? treeLogin : treeHome
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth as unknown as AuthService },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
    return createUrlTree;
  }

  it('allows admin users', () => {
    setup({
      isLoggedIn: () => true,
      getCurrentUser: () => ({ displayName: 'A', email: 'a@b', role: 'admin' }),
    });
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('sends non-admin to home', () => {
    const createUrlTree = setup({
      isLoggedIn: () => true,
      getCurrentUser: () => ({ displayName: 'H', email: 'h@b', role: 'hiring_manager' }),
    });
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe(treeHome);
  });

  it('sends anonymous users to login', () => {
    const createUrlTree = setup({ isLoggedIn: () => false, getCurrentUser: () => null });
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(treeLogin);
  });
});
