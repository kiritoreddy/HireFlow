import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { staffGuard } from './staff.guard';
import { AuthService } from './auth.service';

describe('staffGuard', () => {
  it.each(['admin', 'hiring_manager', 'interviewer'] as const)('allows role %s', (role) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getCurrentUser: () => ({ role }) } },
        { provide: Router, useValue: { createUrlTree: vi.fn() } },
      ],
    });
    const result = TestBed.runInInjectionContext(() => staffGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects candidates to portal jobs', () => {
    const tree = {} as UrlTree;
    const createUrlTree = vi.fn(() => tree);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getCurrentUser: () => ({ role: 'candidate' }) } },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
    const result = TestBed.runInInjectionContext(() => staffGuard({} as never, {} as never));
    expect(createUrlTree).toHaveBeenCalledWith(['/portal/jobs']);
    expect(result).toBe(tree);
  });
});
