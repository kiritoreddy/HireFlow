import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AUTH_ENDPOINTS } from '../config/api.config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigate = vi.fn();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: { navigate } },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('login stores token and sets logged in', async () => {
    const promise = firstValueFrom(service.login('a@b.com', 'secret'));
    const req = httpMock.expectOne(AUTH_ENDPOINTS.login);
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'secret' });
    req.flush({
      user: { id: 1, name: 'A', email: 'a@b.com', role: 'admin', is_active: true },
      access_token: 'tok',
      expires_in: 3600,
    });
    const ok = await promise;
    expect(ok).toBe(true);
    expect(sessionStorage.getItem('hireflow_access_token')).toBe('tok');
    expect(sessionStorage.getItem('hireflow_logged_in')).toBe('true');
  });

  it('login returns error object on failure', async () => {
    const promise = firstValueFrom(service.login('x', 'y'));
    const req = httpMock.expectOne(AUTH_ENDPOINTS.login);
    req.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    const res = await promise;
    expect(res).toEqual({ success: false, error: 'Invalid credentials' });
  });

  it('logout clears session and navigates', () => {
    sessionStorage.setItem('hireflow_logged_in', 'true');
    sessionStorage.setItem('hireflow_access_token', 't');
    sessionStorage.setItem('hireflow_user', '{}');

    service.logout();

    expect(sessionStorage.getItem('hireflow_access_token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
