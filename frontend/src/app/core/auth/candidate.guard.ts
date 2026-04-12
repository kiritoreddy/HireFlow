import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Blocks candidate-role users from accessing hiring-only routes
 * (e.g. the internal candidates pipeline, job management).
 * Redirects them to the dashboard with an access-denied param.
 */
export const hiringOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const role = auth.getCurrentUser()?.role ?? '';

  // candidates are not allowed to see the hiring pipeline
  if (role === 'candidate') {
    return router.createUrlTree(['/'], { queryParams: { access: 'denied' } });
  }

  return true;
};
