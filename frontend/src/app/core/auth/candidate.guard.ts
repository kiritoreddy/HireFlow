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

/**
 * Jobs and hiring pipeline (list jobs, job candidates, candidates overview).
 * Only hiring_manager and admin may call supporting APIs such as GET /users?role=interviewer.
 */
export const hiringManagerAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const role = auth.getCurrentUser()?.role ?? '';

  if (role === 'hiring_manager' || role === 'admin') {
    return true;
  }

  if (role === 'interviewer') {
    return router.createUrlTree(['/interviewer/interviews']);
  }

  if (role === 'candidate') {
    return router.createUrlTree(['/portal/jobs'], { queryParams: { access: 'denied' } });
  }

  return router.createUrlTree(['/login']);
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
