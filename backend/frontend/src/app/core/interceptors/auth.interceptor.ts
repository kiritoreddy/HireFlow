import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../config/api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const isApi = req.url.startsWith(API_BASE_URL);
  let out = req;
  if (token && isApi && !req.headers.has('Authorization')) {
    out = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(out).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && isApi) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
