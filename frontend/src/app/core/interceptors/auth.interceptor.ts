import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL, AUTH_ENDPOINTS } from '../config/api.config';

function isPublicAuthRequest(url: string): boolean {
  return (
    url.startsWith(AUTH_ENDPOINTS.login) ||
    url.startsWith(AUTH_ENDPOINTS.register) ||
    url.startsWith(AUTH_ENDPOINTS.google) ||
    url.startsWith(AUTH_ENDPOINTS.forgotPassword) ||
    url.startsWith(AUTH_ENDPOINTS.resetPassword)
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const isApi = req.url.startsWith(API_BASE_URL);
  let out = req;
  const attachAuth = token && isApi && !isPublicAuthRequest(req.url) && !req.headers.has('Authorization');
  if (attachAuth) {
    out = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(out).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && isApi && !isPublicAuthRequest(req.url)) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
