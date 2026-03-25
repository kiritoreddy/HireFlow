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
  byId: (id: number) => `${API_BASE_URL}/jobs/${id}`,
} as const;

export const CANDIDATE_ENDPOINTS = {
  apply: `${API_BASE_URL}/api/candidate/apply`,
  byJob: (jobId: number) => `${API_BASE_URL}/api/candidate/jobs/${jobId}/applications`,
  stage: (applicationId: string) => `${API_BASE_URL}/api/candidate/applications/${applicationId}/stage`,
} as const;
