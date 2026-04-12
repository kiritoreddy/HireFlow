# HireFlow — Sprint 3

## Overview
Sprint 3 focused on completing unfinished Sprint 2 issues, improving the authentication and role-based access system, adding candidate self-registration, and strengthening the frontend with new unit tests. The backend continued to mature with additional API improvements and test coverage.

---

## 1. Work Completed in Sprint 3

### Frontend (Person 2 — Auth, Shell, Dashboard)

#### Candidate Registration
- Built a dedicated `/register` page for candidate self-signup
- Submits `POST /auth/register` with `role: "candidate"` to the backend
- Full client-side validation: required fields, password match, minimum length
- Redirects to `/login` with a success message after account creation
- Error states for duplicate email or backend failures

#### Login Page Improvements
- Added **"New candidate? Create an account"** link → `/register`
- Added **Google Sign-In button** (UI with OAuth redirect hook — backend OAuth configuration pending)
- Added visual divider between email/password and social login
- Clearer page copy distinguishing hiring staff vs. candidate login paths

#### Role-Based Navigation
- Sidebar now hides **Candidates** and **Jobs** links for `candidate` role users
- **Users** link already hidden for non-admin users (carried from Sprint 2)
- Candidates see only Dashboard on the sidebar — a clean, scoped experience

#### Candidate Guard (`hiringOnlyGuard`)
- New route guard blocks `candidate` role from accessing hiring-only routes:
  - `/jobs` — job management table
  - `/candidates` — hiring pipeline overview
  - `/jobs/:id/candidates` — per-job candidate pipeline
- Candidates are redirected to Dashboard with `?access=denied` query param
- Unauthenticated users are redirected to `/login`

#### Dashboard (API-Driven Stats)
- Replaced all static/hardcoded numbers with live API data from `GET /jobs`
- Stats cards: Total Jobs, Open Jobs, Closed Jobs, Total Candidates — all real
- Hiring Summary panel shows per-department open/closed counts from the API
- Loading state shown while data fetches; error handled gracefully

#### Delete Functionality
- **Delete Job** — action menu (⋯) on each job row with confirmation dialog; calls `DELETE /jobs/:id`; table refreshes automatically
- **Delete Candidate** — per-row action menu in job candidates view; calls `DELETE /api/candidate/applications/:id`

#### Stage Badges
- Color-coded stage chips on the candidates table:
  - Applied → blue
  - Interview → yellow/amber
  - Selected → green
  - Rejected → red

---

### Frontend (Person 1 — Jobs, Candidates)
> *(To be filled in by teammate)*

---

### Backend
> *(To be filled in by backend teammates)*

---

## 2. Frontend Unit Tests

### New Tests Added in Sprint 3

#### `candidate.guard.spec.ts` — 4 tests
- Allows admin users to access hiring routes
- Allows hiring_manager users to access hiring routes
- Redirects candidate users away from hiring routes
- Redirects unauthenticated users to /login

#### `register.component.spec.ts` — 6 tests
- Component creates successfully
- Shows error when required fields are empty
- Shows error when passwords do not match
- Shows error when password is too short (< 8 chars)
- Calls `auth.register()` with correct data on valid submit
- Shows success message on successful registration
- Shows error message on failed registration (e.g. duplicate email)

#### `dashboard.component.spec.ts` — 8 tests
- Component creates successfully
- Computes totalJobs from API response
- Computes openJobs correctly
- Computes closedJobs correctly
- Computes totalCandidates as sum of all stage counts
- Builds departmentSummary from API jobs
- Sets loading to false after successful fetch
- Sets loading to false even on API error

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

#### `job-candidates.component.spec.ts` — 13 tests
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

> *(To be filled in by backend teammates)*

Auth: ___ tests
Users: ___ tests
Jobs: ___ tests
Candidates: ___ tests
**Total: ___ tests**

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
| POST | `/api/candidate/apply` | Submit job application | Yes |
| GET | `/api/candidate/jobs/{jobId}/applications` | List applications for a job | Yes |
| PATCH | `/api/candidate/applications/{id}/stage` | Update application stage | Yes |
| DELETE | `/api/candidate/applications/{id}` | Remove application | Yes |
| GET | `/api/candidate/applications` | Get applications by candidate | Yes |
| PATCH | `/api/candidate/applications/{id}/withdraw` | Withdraw application | Yes |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health check |

---

## 5. Summary

### Frontend Completed
- Candidate registration page (`/register`) with validation
- Google Sign-In button on login page
- Role-based navigation (candidates see only Dashboard)
- `hiringOnlyGuard` blocking candidates from hiring routes
- Live API-driven dashboard stats
- Delete jobs and candidates with confirmation
- Stage badges with color coding
- 40+ unit tests across 7 spec files

### Backend Completed
> *(To be filled in by backend teammates)*

---

## Conclusion
Sprint 3 significantly improves the role-based access control system, adds candidate self-registration, and ensures the frontend is fully integrated with the live backend API for all key workflows.
