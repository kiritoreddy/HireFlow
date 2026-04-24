import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Only allows users with role `interviewer` to activate the route.
 * Redirects unauthenticated users to /login and others to /dashboard.
 */
export const interviewerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const role = auth.getCurrentUser()?.role ?? '';

  if (role === 'interviewer') {
    return true;
  }

  // Non-interviewers get redirected to their home
  return router.createUrlTree(['/dashboard']);
};
