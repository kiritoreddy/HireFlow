# HireFlow — Sprint 4

## Overview

Sprint 4 completed the end-to-end interview workflow and production-readiness work across frontend and backend. The sprint is organized by FE1, FE2, BE1, and BE2 with role-based UX, secure API enforcement, interview scheduling/feedback, Google auth integration, and expanded automated tests.

---

## FE1 — Frontend Auth, Guards, Role Routing

### Completed Work

- Implemented Google Sign-In support on login/register (GIS integration) and shared Google client config.
- Updated auth interceptor behavior:
  - skips bearer token on public auth endpoints,
  - avoids incorrect forced logout for auth endpoint 401s,
  - preserves protected-route enforcement for real API failures.
- Added/updated role-aware redirects after login:
  - candidate -> `/portal/jobs`
  - interviewer -> `/interviewer/interviews`
  - hiring/admin -> `/dashboard`
- Strengthened route protection:
  - interviewer-only portal guard,
  - hiring-manager/admin-only guard for hiring pipeline pages,
  - candidate-only guard for portal routes.
- Updated app shell/navigation to reflect role-specific entry points and links.

### FE1 Frontend Unit Tests (Vitest)

- `frontend/src/app/core/auth/auth.guard.spec.ts`
- `frontend/src/app/core/auth/admin.guard.spec.ts`
- `frontend/src/app/core/auth/interviewer.guard.spec.ts`
- `frontend/src/app/core/auth/candidate.guard.spec.ts`
- `frontend/src/app/core/auth/staff.guard.spec.ts`
- `frontend/src/app/core/auth/auth.service.spec.ts`
- `frontend/src/app/core/interceptors/auth.interceptor.spec.ts`

### FE1 Cypress Coverage

- `frontend/cypress/e2e/login.cy.ts`
- `frontend/cypress/e2e/unauthenticated-redirect.cy.js`
- `frontend/cypress/e2e/interviewer-portal.cy.ts` (guard + route behavior)

---

## FE2 — Frontend Hiring + Candidate + Interviewer Workflows

### Completed Work

#### Candidate portal
- Browse open roles and job details.
- Detect "already applied" state from non-withdrawn applications.
- My Applications page backed by `/api/candidate/my-applications`.

#### Hiring pipeline
- Job candidates table improvements (actions/menu behavior, stage UX, feedback visibility logic).
- Interview assignment flow from candidates page.
- Assign dialog upgraded to slot-based scheduling:
  - date picker,
  - local working hours (9:00-17:00),
  - 1-hour slots,
  - occupied slots disabled/greyed for selected interviewer.

#### Interviewer portal
- Dashboard loads assigned interviews from `/interviewer/assignments`.
- Added candidate context on interview cards (name/email/job title when available).
- Added secure resume download buttons (attachment download only, no inline preview).
- Feedback form enhanced with candidate summary and resume download action.

#### Frontend reliability fixes
- Fixed API mapping issue where backend `ID` vs `id` casing could break assignment flow.
- Improved error messaging for assignment and interviewer loading.
- Updated Cypress intercepts to match current API paths.

### FE2 Frontend Unit Tests (Vitest)

- `frontend/src/app/pages/jobs/jobs.component.spec.ts`
- `frontend/src/app/pages/candidates/candidates-overview.component.spec.ts`
- `frontend/src/app/pages/job-candidates/job-candidates.component.spec.ts`
- `frontend/src/app/pages/dashboard/dashboard.component.spec.ts`
- `frontend/src/app/core/services/jobs-api.service.spec.ts`
- `frontend/src/app/core/services/interviews-api.service.spec.ts`
- `frontend/src/app/core/services/job-data.service.spec.ts`
- `frontend/src/app/core/services/user.service.spec.ts`
- `frontend/src/app/pages/register/register.component.spec.ts`
- `frontend/src/app/app.spec.ts`

### FE2 Cypress Tests

- `frontend/cypress/e2e/candidate-portal.cy.ts`
- `frontend/cypress/e2e/candidates-overview.cy.ts`
- `frontend/cypress/e2e/job-candidates-page.cy.ts`
- `frontend/cypress/e2e/interviewer-portal.cy.ts`
- `frontend/cypress/e2e/jobs-render.cy.ts`
- `frontend/cypress/e2e/jobs-search-filter.cy.ts`
- `frontend/cypress/e2e/jobs-status-filter.cy.ts`
- `frontend/cypress/e2e/jobs-sorting.cy.ts`
- `frontend/cypress/e2e/jobs-clear-filters.cy.ts`
- `frontend/cypress/e2e/users-page.cy.ts`

---

## BE1 — Backend Auth, User, Role/Route Hardening

### Completed Work

- Added Google OAuth endpoint:
  - `POST /auth/google`
  - verifies Google ID token server-side,
  - returns standard JWT auth response.
- Extended user model for provider-aware auth (`provider`, `google_sub` behavior) and maintained compatibility for email users.
- Hardened user listing for interviewer assignment use case:
  - `GET /users?role=interviewer`
  - HM/admin role enforcement.
- Added explicit route authorization tests for key protected endpoints.

### BE1 Unit Tests

- `backend/handlers/auth_handler_test.go`
- `backend/handlers/google_auth_handler_test.go`
- `backend/handlers/user_handler_test.go`
- `backend/handlers/dashboard_handler_test.go`
- `backend/routes/routes_pipeline_auth_test.go` (route-level auth/role tests)

---

## BE2 — Backend Candidate, Interview, Feedback APIs

### Completed Work

#### Candidate/application APIs
- `POST /api/candidate/apply`
- `GET /api/candidate/my-applications`
- `PATCH /api/candidate/applications/{id}/withdraw`
- `DELETE /api/candidate/applications/{id}`
- `GET /api/jobs/{jobId}/applications` (hiring/admin)
- `PATCH /api/applications/{id}/stage` (hiring/admin)

#### Interview APIs
- `POST /interviews` (assign interviewer)
- `GET /interviews` (role-aware listing)
- `GET /interviewer/assignments` (interviewer alias)
- `GET /interviews/{id}`
- `PATCH /interviews/{id}`
- `PATCH /interviews/{id}/cancel`

#### Feedback APIs
- `POST /interviews/{id}/feedback` (assigned interviewer only)
- `GET /interviews/{id}/feedback`
- `GET /api/applications/{id}/feedback` (consolidated for hiring/admin)

#### Sprint 4 business rules and enhancements
- Duplicate assignment prevention for same interviewer + application.
- Automatic stage transition `APPLIED -> INTERVIEW` on first successful interview assignment.
- Candidate summary fields added in interview responses for interviewer UX (`candidate_name`, `candidate_email`, `job_title`, `has_resume`).
- Secure resume download endpoint:
  - `GET /interviews/{id}/resume`
  - allowed only for assigned interviewer/hiring_manager/admin,
  - path safety checks,
  - attachment download response.

### BE2 Unit Tests

- `backend/handlers/candidate_handler_test.go`
- `backend/handlers/interview_handler_test.go`
- `backend/handlers/interview_feedback_handler_test.go`
- `backend/handlers/job_handler_test.go`

---

## Backend API Documentation (Updated Sprint 4)

Base URL: `http://localhost:8080`

Authentication: `Authorization: Bearer <jwt>` for protected endpoints.

### 1) Auth

| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/google` | Public |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public |

### 2) Users / Admin / Dashboard

| Method | Endpoint | Access |
|---|---|---|
| GET | `/users` | Admin; HM allowed with `?role=interviewer` filtering |
| POST | `/users` | Admin |
| PATCH | `/users/{id}` | Admin |
| GET | `/dashboard/stats` | Admin, Hiring Manager, Interviewer |

### 3) Jobs

| Method | Endpoint | Access |
|---|---|---|
| GET | `/jobs` | Authenticated |
| GET | `/jobs/{id}` | Authenticated |
| POST | `/jobs` | Admin, Hiring Manager |
| PUT | `/jobs/{id}` | Admin, Hiring Manager |
| DELETE | `/jobs/{id}` | Admin, Hiring Manager |

### 4) Candidate / Application

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/candidate/apply` | Candidate |
| GET | `/api/candidate/my-applications` | Candidate |
| PATCH | `/api/candidate/applications/{id}/withdraw` | Candidate owner |
| DELETE | `/api/candidate/applications/{id}` | Candidate owner or Admin |
| GET | `/api/jobs/{jobId}/applications` | Hiring Manager, Admin |
| PATCH | `/api/applications/{id}/stage` | Hiring Manager, Admin |

### 5) Interview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/interviews` | Hiring Manager, Admin |
| GET | `/interviews` | Hiring Manager, Admin, Interviewer (own only for interviewer role) |
| GET | `/interviewer/assignments` | Interviewer |
| GET | `/interviews/{id}` | Hiring Manager, Admin, Assigned Interviewer |
| PATCH | `/interviews/{id}` | Hiring Manager, Admin |
| PATCH | `/interviews/{id}/cancel` | Hiring Manager, Admin |
| GET | `/interviews/{id}/resume` | Hiring Manager, Admin, Assigned Interviewer |

### 6) Feedback

| Method | Endpoint | Access |
|---|---|---|
| POST | `/interviews/{id}/feedback` | Assigned Interviewer |
| GET | `/interviews/{id}/feedback` | Hiring Manager, Admin, Assigned Interviewer |
| GET | `/api/applications/{id}/feedback` | Hiring Manager, Admin |

### 7) Health

| Method | Endpoint | Access |
|---|---|---|
| GET | `/health` | Public |

---

## Test Summary Snapshot

- Frontend unit tests: **17 spec files**, all passing in latest local run.
- Cypress E2E specs: **12 specs** maintained.
- Backend handler tests: auth/user/job/candidate/interview/feedback/google/dashboard suites passing.
- Additional backend route auth tests: `backend/routes/routes_pipeline_auth_test.go`.

---

## Sprint 4 Outcome

Sprint 4 completed the final integrated flow:

1. Candidate applies with resume.
2. Hiring manager manages pipeline and schedules interviewer with slot constraints.
3. Application transitions to interview stage automatically.
4. Interviewer sees assigned candidates, downloads resume securely, and submits feedback.
5. Hiring/admin can review consolidated feedback for decision-making.

