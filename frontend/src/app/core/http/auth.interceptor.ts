import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/** Public auth endpoints — do not attach Bearer token. */
function isPublicAuthUrl(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  let out = req;
  if (!isPublicAuthUrl(req.url)) {
    const token = auth.getToken();
    if (token) {
      out = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  return next(out).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isPublicAuthUrl(req.url)) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
