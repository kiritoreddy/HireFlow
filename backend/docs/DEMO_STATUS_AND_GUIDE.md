# HireFlow — Task Status & Demo Guide

## 1. FE1 — Auth, Layout, Navigation — Status

| Task | Status | Notes |
|------|--------|-------|
| Create base application layout | Done | Header (app name + profile/logout), main content outlet, `AppLayoutComponent` |
| Login page | Done | Email + password form, calls `/auth/login` |
| Handle error states | Done | Invalid credentials, deactivated account, server unreachable |
| Store token + role | Done | sessionStorage (access_token, user, logged_in) |
| Reset password UI | Done | **Full flow** — forgot-password → reset-password wired to backend |
| Forgot password screen | Done | Email form, backend returns demo token (no email sending) |
| New password + confirm | Done | Validation aligned with backend (8+ chars, upper, lower, number, special) |
| Call reset-password API | Done | `POST /auth/reset-password` with token + password |
| Admin Users page | Done | `/users` — list users, create user, edit, deactivate/activate; admin only |
| Role-based navigation | Done | Admin → Users; sidebar shows Dashboard, Candidates, Jobs; Users link only for admin |
| Hide unauthorized links | Done | Users link shown only when `role === 'admin'` |
| Frontend route guards | Done | `authGuard` (redirect to login if not authenticated), `adminGuard` (Users page) |
| Redirect to login if not authenticated | Done | All protected routes use `authGuard` |

**FE1 Done When:** User can log in — yes. Menu changes by role — yes. Unauthorized routes blocked — yes. Reset password flow works end-to-end — yes.

---

## 2. FE2 — Job Visibility UI — Status

| Task | Status | Notes |
|------|--------|-------|
| Hiring Manager dashboard | Partial | Page `/` (Dashboard) exists; no `/manager/dashboard`; uses generic text, no job list from API |
| Fetch jobs from /api/manager/jobs | Not done | No API call; spec expected `/api/manager/jobs` |
| Display: job title, status, candidate count | Not done | Dashboard shows static welcome text |
| Empty state if no jobs | Not done | N/A until API integrated |
| Candidate job listings page | Partial | Page `/jobs` exists; **mock data**, does not fetch from API |
| Fetch open jobs from /api/jobs | Not done | Jobs component has hardcoded list |
| Display job title + short description | Partial | Jobs list shows title; no description from API |
| No apply button yet | Done | No apply button on jobs page |
| API integration | Not done | Jobs and dashboard do not call backend |
| Handle loading + error states | Not done | No loading/error handling for jobs |
| Basic UI polish (tables/cards) | Partial | Simple list; candidates overview has table-like structure |

**FE2 Done When:** Hiring Manager sees job list — no (mock). Candidate sees job list — no (mock). Pages don’t crash on empty data — yes.

---

## 3. BE1 — Auth & Users — Status

| Task | Status | Notes |
|------|--------|-------|
| User entity | Done | `id, email, password_hash, name, role, is_active` (spec: `active` → `is_active`) |
| Login API | Done | `POST /auth/login` (spec: `/api/auth/login` — no `/api` prefix) |
| Return token + role | Done | JWT + user object |
| Reset password API | Done | `POST /auth/forgot-password` + `POST /auth/reset-password` (full flow with tokens; spec said “mock”) |
| Accept email + new password | Done | Forgot-password returns token; reset-password accepts token + password |
| Admin create user | Done | `POST /users` (spec: `/api/admin/users` — we use `/users`) |
| Admin assign role | Done | Body includes `role` |
| Default password | Done | Frontend derives from email (first 4 chars + @1234) |
| Admin list users | Done | `GET /users` |
| Admin deactivate users | Done | `PATCH /users/{id}` with `{ "is_active": false }` (spec: PATCH /api/admin/users/{id}/deactivate) |
| Deactivated users can’t log in | Done | Login handler checks `IsActive` and returns 403 |

**BE1 Done When:** Users can log in — yes. Admin can create users — yes. Deactivated users can’t log in — yes. Reset password updates password — yes.

---

## 4. BE2 — Jobs (Read-Only) — Status

| Task | Status | Notes |
|------|--------|-------|
| Job entity | Done | `id, title, description, department, location, status` (status: Open/Closed) |
| Seed job data | Not done | No seed in main or migration; DB starts empty |
| Jobs API (candidate) | Partial | `GET /jobs` returns all jobs; spec: `GET /api/jobs` (OPEN only) |
| Jobs API (hiring manager) | Partial | Same `GET /jobs`; spec: `GET /api/manager/jobs` (all jobs) |
| Basic DTOs | Done | JSON responses with job shape |

**BE2 Done When:** Jobs can be fetched — yes (GET /jobs). Candidate sees open jobs — backend returns all; no OPEN filter. Hiring Manager sees all jobs — same endpoint.

---

# Postman / cURL URLs for Backend Demo

Base URL: `http://localhost:8080`

## Auth (no token)

| Method | URL | Body | Description |
|--------|-----|------|-------------|
| POST | `http://localhost:8080/auth/register` | `{"name":"Admin User","email":"admin@example.com","password":"Admin@123","role":"admin"}` | Create first user |
| POST | `http://localhost:8080/auth/login` | `{"email":"admin@example.com","password":"Admin@123"}` | Get JWT |
| POST | `http://localhost:8080/auth/forgot-password` | `{"email":"admin@example.com"}` | Get reset token (demo) |
| POST | `http://localhost:8080/auth/reset-password` | `{"token":"<from forgot>","password":"NewPass@123"}` | Reset password |
| GET | `http://localhost:8080/health` | — | Health check |

## Admin Users (need JWT)

Header: `Authorization: Bearer <access_token>`

| Method | URL | Body | Description |
|--------|-----|------|-------------|
| GET | `http://localhost:8080/users` | — | List all users |
| POST | `http://localhost:8080/users` | `{"name":"Jane Doe","email":"jane@example.com","password":"Jane@1234","role":"hiring_manager"}` | Create user |
| PATCH | `http://localhost:8080/users/2` | `{"is_active":false}` | Deactivate user |
| PATCH | `http://localhost:8080/users/2` | `{"is_active":true}` | Activate user |

## Jobs (no auth)

| Method | URL | Body | Description |
|--------|-----|------|-------------|
| GET | `http://localhost:8080/jobs` | — | List all jobs |
| GET | `http://localhost:8080/jobs/1` | — | Get job by ID |
| POST | `http://localhost:8080/jobs` | `{"title":"Engineer","description":"...","department":"Eng","location":"Remote","status":"Open"}` | Create job |

---

# Demo Talking Points

## FE1 (Auth & Layout)

1. **Layout & shell**
   - Reusable `AppLayoutComponent` with header (logo, profile menu) and sidebar.
   - Profile menu shows display name, email, role; logout clears session and redirects to login.

2. **Login**
   - Email + password form; calls `POST /auth/login`.
   - Error handling: wrong credentials, deactivated account, server unreachable.
   - On success: stores JWT and user in sessionStorage, redirects to dashboard.

3. **Reset password**
   - Forgot-password page: enter email → backend returns demo token.
   - Demo flow: “Continue to set new password” → reset-password page → set new password.
   - Works end-to-end with backend.

4. **Admin Users page**
   - `/users` — list all users (name, email, role, status), create user, edit user, deactivate/activate; restricted to admin role via `adminGuard`.

5. **Role-based UI & guards**
   - Users link only for admins.
   - `authGuard` protects all authenticated routes.
   - `adminGuard` restricts `/users` to admins; non-admins redirected to home.

---

## FE2 (Jobs UI)

1. **Current state**
   - Jobs page (`/jobs`) and candidates overview show mock data; no backend integration.
   - Dashboard is generic, not HM-specific; no job list from API.

2. **Planned**
   - Integrate jobs and dashboard with BE2 APIs (`/jobs`, `/manager/jobs` when available).
   - Add loading and error handling.
   - HM dashboard: job list with status and candidate count.

---

## BE1 (Auth & Users)

1. **User entity**
   - `id, email, password_hash, name, role, is_active`; roles: admin, hiring_manager, interviewer, candidate.

2. **Auth APIs**
   - `POST /auth/register` — public, used to create first user (e.g. via curl).
   - `POST /auth/login` — returns JWT + user.
   - `POST /auth/forgot-password` — returns reset token (no email sending yet).
   - `POST /auth/reset-password` — accepts token + new password, updates user.

3. **Admin user management**
   - `GET /users` — list users (JWT + admin).
   - `POST /users` — create user (JWT + admin).
   - `PATCH /users/{id}` — deactivate/reactivate via `is_active` (JWT + admin).

4. **Deactivated users**
   - Login checks `IsActive`; deactivated users receive 403 and cannot log in.

---

## BE2 (Jobs)

1. **Job entity**
   - `id, title, description, department, location, status`; status Open/Closed.

2. **APIs**
   - `GET /jobs` — list all jobs.
   - `GET /jobs/{id}` — get one job.
   - `POST /jobs`, `PUT /jobs/{id}`, `DELETE /jobs/{id}` — full CRUD.

3. **Spec vs implementation**
   - Spec: separate `GET /api/jobs` (OPEN only) and `GET /api/manager/jobs` (all).
   - Current: single `GET /jobs` returns all jobs; no role-based filtering.

4. **Seed data**
   - No seed; DB starts empty; jobs can be created via `POST /jobs` or UI.

---

# Quick Reference: Path Differences vs Spec

| Spec | Current |
|------|---------|
| `/api/auth/login` | `/auth/login` |
| `/api/auth/reset-password` | `/auth/forgot-password` + `/auth/reset-password` |
| `/api/admin/users` | `/users` |
| `/api/admin/users/{id}/deactivate` | `PATCH /users/{id}` with `{"is_active":false}` |
| `/api/jobs` (OPEN only) | `GET /jobs` (all) |
| `/api/manager/jobs` | Same as above (`GET /jobs`) |
