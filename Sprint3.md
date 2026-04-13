# HireFlow — Sprint 3

## Overview
Sprint 3 focused on completing unfinished Sprint 2 issues, improving authentication and **role-based access**, adding **candidate self-registration**, and delivering **FE1** (auth, shell, guards) and **FE2** (live jobs and pipeline UI, dashboard stats, **candidate portal** with apply and my applications) on the frontend—with new **Vitest** and **Cypress** coverage. The backend gained secured candidate APIs, application lifecycle endpoints, optional **resume file** storage for portal apply, and expanded tests.

---

## 1. Work Completed in Sprint 3

### Frontend — FE1 & FE2

Sprint 3 frontend scope is grouped by **FE1** (authentication, shell, navigation, and access control) and **FE2** (job visibility, hiring workflows, dashboard, and the **candidate portal**). Together they replace mock-only flows with live `http://localhost:8080` APIs where noted.

---

#### FE1 — Authentication, layout, navigation, and route protection

**Session & identity**

| Area | Implementation |
|------|------------------|
| **Login** (`/login`) | `AuthService.login` → `POST /auth/login`; stores JWT + user in `sessionStorage`. |
| **Register** (`/register`) | Candidate self-signup → `POST /auth/register`; validation (required fields, password match, length); success → `/login`. |
| **Forgot / reset password** | `/forgot-password`, `/reset-password` routed and wired to backend reset endpoints. |

**HTTP & API wiring**

- **`authInterceptor`** (`frontend/src/app/core/interceptors/auth.interceptor.ts`): attaches `Authorization: Bearer <token>` to same-origin API calls under `API_BASE_URL`; logs out on `401` from the API.
- **`API_BASE_URL`** and shared route constants in `frontend/src/app/core/config/api.config.ts`.

**Layout & role-based navigation** (`AppLayoutComponent`)

- Header: HireFlow branding, profile menu (display name, email, role), logout.
- **Candidate** sidebar: **Open roles** → `/portal/jobs`, **My applications** → `/portal/applications`; logo routes to portal jobs.
- **Hiring / admin** sidebar: Dashboard, Jobs, Candidates; **Users** for admin only; logo routes to dashboard.

**Route guards** (`app.routes.ts`)

| Guard | Role |
|-------|------|
| `authGuard` | All authenticated shell routes. |
| `hiringOnlyGuard` | Blocks `candidate` from `/dashboard`, `/jobs`, `/candidates`, `/jobs/:id/candidates` → home with `?access=denied`. |
| `candidateGuard` | Only `candidate` may access `/portal/*`; others → `/dashboard`. |
| `adminGuard` | Admin-only routes (e.g. `/users`). |

**Post-login entry**

- **`HomeRedirectComponent`**: `/` redirects candidates to `/portal/jobs` and other roles to `/dashboard`.

**Login UX (incremental)**

- Link to **Create an account** (`/register`), optional **Google Sign-In** placeholder (backend OAuth TBD), copy clarifying staff vs candidate paths.

---

#### FE2 — Jobs, hiring pipeline, dashboard, and candidate portal

**Hiring — jobs & pipeline (live API)**

| Route / feature | Description |
|-----------------|-------------|
| **`/jobs`** (`JobsComponent`) | List from `GET /jobs`; create/update via `JobsApiService`; **Delete job** from row menu → `DELETE /jobs/:id` with confirmation. |
| **`/candidates`** (`CandidatesOverviewComponent`) | Job cards with candidate counts from API. |
| **`/jobs/:id/candidates`** (`JobCandidatesComponent`) | Job header from `GET /jobs/:id`; applications from `GET /api/candidate/jobs/:jobId/applications`; search/filter; **stage** updates via `PATCH /api/candidate/applications/:id/stage`; **delete application** via `DELETE /api/candidate/applications/:id`; **add-candidate** dialog (client uses apply-shaped payload; server enforces JWT role on apply). |
| **Stage badges** | Color-coded chips: Applied (blue), Interview (amber), Selected (green), Rejected (red). |

**Dashboard** (`/dashboard`, `DashboardComponent`)

- Metrics from **`DashboardApiService.getStats()`** → `GET /dashboard/stats` when available.
- **Fallback**: aggregate stats from **`GET /jobs`** if dashboard stats fail or are empty.
- Hiring summary style breakdowns from job payloads; loading and error states in the UI.

**Candidate portal** (`/portal/...`, `candidateGuard`)

| Route | Component | Behaviour |
|-------|-----------|-----------|
| `/portal/jobs` | `CandidateJobsBrowseComponent` | Lists **Open** jobs via `GET /jobs`. |
| `/portal/jobs/:id` | `CandidateJobDetailComponent` | Job detail via `GET /jobs/:id`; **Already applied** when a non-withdrawn row exists for that job (from `GET /api/candidate/applications`); apply with name + email + **resume file** → `POST /api/candidate/apply` as **`multipart/form-data`** (`job_id`, `name`, `resume`). |
| `/portal/applications` | `CandidateMyApplicationsComponent` | Table: job, department, applied date, status; **Withdraw** → `PATCH /api/candidate/applications/:id/withdraw`; list refresh on navigation to the route. |

**Shared services**

- **`JobsApiService`**: list, get by id, create, update, delete.
- **`CandidatesApiService`**: `apply` (multipart `File` **or** JSON for tests/legacy), `listMyApplications`, `withdraw`, `deleteApplication`, job-scoped list and stage update for hiring views.
- **`DashboardApiService`**: `GET /dashboard/stats`.

**E2E (Cypress)**

- `frontend/cypress/e2e/candidate-portal.cy.ts` — portal flows with HTTP intercepts (open roles, job detail, already-applied, my applications).

---

### Backend (Person 2 — Candidate APIs & Data Model)

#### Secured Candidate Routes
- `POST /api/candidate/apply` — requires JWT (`candidate` role only); email is forced from token claims, preventing spoofing; duplicate apply is blocked unless previous application was `WITHDRAWN`
- `GET /api/candidate/applications` — JWT secured; returns only applications belonging to the authenticated candidate, looked up by email from token claims
- `PATCH /api/candidate/applications/{id}/withdraw` — JWT required + ownership check; returns 403 if the application does not belong to the caller
- `DELETE /api/candidate/applications/{id}` — candidates can delete their own applications; `hiring_manager` and `admin` can delete any

#### Role Enforcement on Existing Routes
- `GET /api/candidate/jobs/{jobId}/applications` — restricted to `hiring_manager` and `admin` only
- `PATCH /api/candidate/applications/{id}/stage` — restricted to `hiring_manager` and `admin` only
- Removed the old insecure `GET /api/candidate/applications?candidate_id=...` route that had no auth

#### Resume Handling
- **`resume_path`** on `Candidate` still stores a string path for compatibility and hiring JSON flows
- **Candidate portal apply**: `POST /api/candidate/apply` also accepts **`multipart/form-data`** with a **`resume`** file (PDF/Word, size limit); files stored under `uploads/resumes/` (see `HF_UPLOAD_ROOT`); JSON apply remains for tests/legacy callers
- Optional future work: authenticated download URLs, cloud storage (e.g. S3)

#### Duplicate Apply Protection
- Re-applying to the same job is blocked if an active application exists
- Re-apply is allowed if the previous application has `WITHDRAWN` status

---

### Backend (Person 1)
> *(To be filled in by teammate)*

---

## 2. Frontend Unit Tests

### New Tests Added in Sprint 3

#### `candidate.guard.spec.ts` — 6 tests
- `hiringOnlyGuard`: allows hiring roles to hiring routes; blocks `candidate` with redirect; sends unauthenticated users to login
- `candidateGuard`: allows `candidate` to portal routes; redirects non-candidates to dashboard

#### `register.component.spec.ts` — 6 tests
- Component creates successfully
- Shows error when required fields are empty
- Shows error when passwords do not match
- Shows error when password is too short (< 8 chars)
- Calls `auth.register()` with correct data on valid submit
- Shows success message on successful registration
- Shows error message on failed registration (e.g. duplicate email)

#### `dashboard.component.spec.ts` — 9 tests
- Mocks `DashboardApiService.getStats()` primary path; validates fallback aggregation from `JobsApiService.getJobs()` when stats missing or empty; double-failure handling; department summary and loading/error behaviour

#### `jobs-api.service.spec.ts` (formerly job-data.service.spec.ts) — 5 tests
- Service creates successfully
- `getJobs()` sends GET to jobs list endpoint
- `getJobById()` sends GET to job by-id endpoint
- `createJob()` sends POST with correct payload
- `updateJob()` sends PUT to job by-id endpoint
- `deleteJob()` sends DELETE to job by-id endpoint

#### `candidates-overview.component.spec.ts` — 7 tests
- Component creates successfully
- Loads jobs with candidate counts on init
- Computes total candidate count per job
- Shows zero counts for jobs with no candidates
- Includes job status in each entry
- Sets loading to false after successful fetch
- Sets loading to false and empties array on error

#### `job-candidates.component.spec.ts` — 17 tests
- Component creates successfully
- Loads correct job title from API
- Loads correct department from API
- Loads candidates from API on init
- Populates dataSource with all candidates initially
- Filters candidates by name when searchTerm is set
- Filters candidates by email
- Shows all candidates when search is cleared
- Filters candidates by stage
- Shows all stages when filter is All
- Calls `updateStage` on stage change
- Calls `deleteApplication` after user confirms deletion
- Does NOT call `deleteApplication` if user cancels
- Sets loading to false after candidates load
- Handles API error gracefully

#### Cypress (candidate portal)

- `frontend/cypress/e2e/candidate-portal.cy.ts` — open roles → job detail, already-applied state, my applications table

### Tests Carried from Sprint 2
- `auth.service.spec.ts`
- `auth.guard.spec.ts`
- `admin.guard.spec.ts`
- `auth.interceptor.spec.ts`
- `jobs-api.service.spec.ts`
- `user.service.spec.ts`
- `jobs.component.spec.ts`
- `app.spec.ts`

---

## 3. Backend Unit Tests

### Backend Person 2 — Candidate Handler Tests: 21 tests

#### Apply (`TestApplyWithCandidate_*`) — 8 tests
- Returns 401 when no JWT token provided
- Returns 403 when caller is not a candidate role
- Returns 400 when job_id is missing or zero
- Returns 404 when job does not exist
- Returns 201 on successful application (JSON body)
- Returns 201 on successful application with **multipart** resume file and persists `resume_path` under `uploads/resumes/`
- Returns 409 when candidate has already applied to the same job
- Returns 201 when re-applying after a previous withdrawal

#### List My Applications (`TestListMyApplications_*`) — 3 tests
- Returns 401 when no JWT token provided
- Returns 200 with empty list for unknown candidate
- Returns only the authenticated candidate's own applications

#### Withdraw (`TestWithdrawApplication_*`) — 4 tests
- Returns 401 when no JWT token provided
- Returns 404 when application does not exist
- Returns 403 when candidate tries to withdraw another candidate's application
- Returns 200 and sets status to WITHDRAWN on success

#### Delete (`TestDeleteApplication_*`) — 4 tests
- Returns 401 when no JWT token provided
- Returns 204 when candidate deletes their own application
- Returns 403 when candidate tries to delete another candidate's application
- Returns 204 when admin deletes any application

#### Update Stage (`TestUpdateApplicationStage_*`) — 2 tests  (carried from BE1 work, extended by BE2)
- Returns 400 for invalid stage value
- Returns 200 and updates status correctly for valid stage

### Backend Person 1 — Tests
> *(To be filled in by teammate)*

Auth: ___ tests
Users: ___ tests
Jobs: ___ tests
**Total BE1: ___ tests**

**Total Backend:** 21 candidate-handler tests plus `backend/routes/routes_candidate_flow_test.go` (HTTP apply → list)

---

## 4. Backend API Documentation

Base URL: `http://localhost:8080`
Authentication: Bearer JWT Token

### Auth Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login and receive JWT token | No |
| POST | `/auth/register` | Register new user (candidate self-signup) | No |
| POST | `/auth/forgot-password` | Request password reset token | No |
| POST | `/auth/reset-password` | Reset password with token | No |

### User Endpoints (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List all users | Admin |
| POST | `/users` | Create new user | Admin |
| PATCH | `/users/{id}` | Activate/deactivate user | Admin |

### Job Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/jobs` | List all jobs with candidate counts | Yes |
| GET | `/jobs/{id}` | Get job details | Yes |
| POST | `/jobs` | Create new job | Admin/Hiring Manager |
| PUT | `/jobs/{id}` | Update job | Admin/Hiring Manager |
| DELETE | `/jobs/{id}` | Delete job | Admin/Hiring Manager |

### Candidate/Application Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/candidate/apply` | Submit job application (JSON **or** `multipart/form-data` with `job_id`, `name`, `resume` file for portal) | Candidate only |
| GET | `/api/candidate/jobs/{jobId}/applications` | List applications for a job | Hiring Manager/Admin |
| PATCH | `/api/candidate/applications/{id}/stage` | Update application stage | Hiring Manager/Admin |
| DELETE | `/api/candidate/applications/{id}` | Remove application | Candidate (own) / Admin |
| GET | `/api/candidate/applications` | Get own applications | Candidate only |
| PATCH | `/api/candidate/applications/{id}/withdraw` | Withdraw application | Candidate (own only) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health check |

---

## 5. Summary

### Frontend Completed (FE1 & FE2)
- **FE1:** Login/register/forgot/reset flows; JWT session; `authInterceptor`; role-aware layout and sidebar; `authGuard`, `hiringOnlyGuard`, `candidateGuard`, `adminGuard`; home redirect by role
- **FE2:** Live jobs CRUD and delete; candidates overview and per-job pipeline (search, filters, stage updates, delete application, badges); dashboard stats with `/dashboard/stats` + jobs fallback; **candidate portal** (browse open roles, job detail, multipart resume apply, my applications, withdraw); shared API config and services; Cypress portal smoke tests; Vitest coverage including dashboard + guard specs above

### Backend Completed (Person 2)
- All candidate API endpoints secured with JWT authentication
- Ownership enforcement on withdraw and delete operations
- Role-based access control: candidates vs hiring_manager/admin on all routes
- Duplicate application protection with re-apply after withdraw support
- New `DELETE /api/candidate/applications/{id}` endpoint added
- Removed insecure unauthenticated candidate applications route
- Resume handling: `resume_path` string; portal multipart upload saves files under `uploads/resumes/`
- 21 unit tests covering candidate handler flows (including multipart resume) plus an HTTP-level apply→list route test
- `ContextWithClaims` helper added to middleware for test injection

### Backend Completed (Person 1)
> *(To be filled in by teammate)*

---

## Conclusion
Sprint 3 tightens **role-based access** end-to-end, ships **FE1** (auth, shell, guards) and **FE2** (jobs, pipeline, dashboard, candidate portal) against the live API, and backs candidate workflows with secured backend endpoints, optional **resume uploads**, and automated tests (Vitest + Cypress + Go).
