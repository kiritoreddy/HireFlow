import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Blocks candidate-role users from accessing hiring-only routes
 * (e.g. the internal candidates pipeline, job management).
 * Redirects them home with an access-denied query param.
 */
export const hiringOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const role = auth.getCurrentUser()?.role ?? '';

  if (role === 'candidate') {
    return router.createUrlTree(['/'], { queryParams: { access: 'denied' } });
  }

  return true;
};

/** Only users with role `candidate` may activate the route. */
export const candidateGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();
  if (user?.role === 'candidate') {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};
