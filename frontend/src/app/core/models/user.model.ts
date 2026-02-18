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
  username: string;
  role: UserRole;
}

/** For create/edit forms. No password – default is first 4 chars of username + @1234 (backend/app rule). */
export interface UserFormValue {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: UserRole;
}

/** Default password rule: not stored or displayed. Computed when needed (e.g. backend). */
export function getDefaultPasswordForUsername(username: string): string {
  const prefix = username.slice(0, 4).toLowerCase();
  return `${prefix}@1234`;
}
