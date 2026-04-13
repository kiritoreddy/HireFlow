import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../config/api.config';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: { getToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    auth = {
      getToken: vi.fn(() => 'jwt-1'),
      logout: vi.fn(),
    };
    navigate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: { navigate } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds Authorization for protected URLs', () => {
    http.get(`${API_BASE_URL}/jobs`).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/jobs`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-1');
    req.flush([]);
  });

  it('skips Authorization for auth login', () => {
    http.post(`${API_BASE_URL}/auth/login`, {}).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('on 401 calls logout and navigates to login', () => {
    http.get(`${API_BASE_URL}/jobs`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${API_BASE_URL}/jobs`);
    req.flush('nope', { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
