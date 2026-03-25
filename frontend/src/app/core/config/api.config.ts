/** Backend API base URL. Change for production. */
export const API_BASE_URL = 'http://localhost:8080';

export const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  resetPassword: `${API_BASE_URL}/auth/reset-password`,
} as const;

export const USERS_ENDPOINTS = {
  list: `${API_BASE_URL}/users`,
  create: `${API_BASE_URL}/users`,
  patch: (id: string) => `${API_BASE_URL}/users/${id}`,
} as const;

export const JOBS_ENDPOINTS = {
  list: `${API_BASE_URL}/jobs`,
  detail: (id: number) => `${API_BASE_URL}/jobs/${id}`,
  applications: (jobId: number) => `${API_BASE_URL}/jobs/${jobId}/applications`,
} as const;

export const APPLICATIONS_ENDPOINTS = {
  patch: (applicationId: string) => `${API_BASE_URL}/applications/${applicationId}`,
} as const;
