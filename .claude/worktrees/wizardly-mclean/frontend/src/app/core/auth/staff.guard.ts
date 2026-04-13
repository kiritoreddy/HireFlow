import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

const STAFF_ROLES = new Set(['admin', 'hiring_manager', 'interviewer']);

/** Hiring staff routes: not for role `candidate`. */
export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.getCurrentUser()?.role ?? '';
  if (STAFF_ROLES.has(role)) {
    return true;
  }
  return router.createUrlTree(['/portal/jobs']);
};
