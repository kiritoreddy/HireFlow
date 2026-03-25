/**
 * User roles. Extend when backend adds more.
 * RBAC / page access will use these later.
 */
export type UserRole = 'admin' | 'hiring_manager' | 'interviewer' | 'candidate';

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'hiring_manager', label: 'Hiring Manager' },
  { value: 'interviewer', label: 'Interviewer' },
  { value: 'candidate', label: 'Candidate' },
];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

/** For create/edit forms. No password – default derived from email (backend/app rule). */
export interface UserFormValue {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

/** Default password for new users: meets backend rules (8+ chars, upper, lower, number, special). Derived from email. */
export function getDefaultPasswordForEmail(email: string): string {
  const local = (email.split('@')[0] ?? 'user').slice(0, 4).toLowerCase();
  const prefix = local ? local[0].toUpperCase() + local.slice(1) : 'User';
  return `${prefix}@1234`;
}
