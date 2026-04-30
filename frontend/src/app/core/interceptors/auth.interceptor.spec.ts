import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL, AUTH_ENDPOINTS } from '../config/api.config';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: { getToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = {
      getToken: vi.fn(() => 'jwt-1'),
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds Authorization for same-origin API URLs', () => {
    http.get(`${API_BASE_URL}/jobs`).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/jobs`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-1');
    req.flush([]);
  });

  it('does not add Authorization for non-API URLs', () => {
    http.get('https://example.com/data').subscribe();
    const req = httpMock.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('skips Authorization for public auth endpoints including Google', () => {
    http.post(AUTH_ENDPOINTS.login, {}).subscribe();
    http.post(AUTH_ENDPOINTS.google, { id_token: 'x' }).subscribe();
    const rLogin = httpMock.expectOne(AUTH_ENDPOINTS.login);
    const rGoogle = httpMock.expectOne(AUTH_ENDPOINTS.google);
    expect(rLogin.request.headers.has('Authorization')).toBe(false);
    expect(rGoogle.request.headers.has('Authorization')).toBe(false);
    rLogin.flush({});
    rGoogle.flush({});
  });

  it('on 401 for protected API calls logout', () => {
    http.get(`${API_BASE_URL}/jobs`).subscribe({ error: () => {} });
    const req = httpMock.expectOne(`${API_BASE_URL}/jobs`);
    req.flush('nope', { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).toHaveBeenCalled();
  });

  it('on 401 for login does not logout', () => {
    http.post(AUTH_ENDPOINTS.login, {}).subscribe({ error: () => {} });
    const req = httpMock.expectOne(AUTH_ENDPOINTS.login);
    req.flush('nope', { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
