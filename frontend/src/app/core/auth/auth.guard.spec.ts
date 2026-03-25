import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

function mockAuth(partial: { isLoggedIn: () => boolean }): AuthService {
  return partial as unknown as AuthService;
}

describe('authGuard', () => {
  it('allows navigation when logged in', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth({ isLoggedIn: () => true }) },
        { provide: Router, useValue: { createUrlTree: vi.fn() } },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects to login when not logged in', () => {
    const tree = {} as UrlTree;
    const createUrlTree = vi.fn(() => tree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth({ isLoggedIn: () => false }) },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(tree);
  });
});
