# HireFlow — Sprint 4 (Final Sprint)

## Overview

Sprint 4 delivers Google OAuth authentication, interview workflow (assignment → feedback → visibility), and final project hardening to make HireFlow demo-ready and production-minded.

---

## 1. Work Completed in Sprint 4

### Backend — Identity, Auth & Jobs

#### Google OAuth Authentication

- `POST /auth/google` — accepts Google ID token from frontend (Google Identity Services)
- Verifies token server-side using `go-oidc/v3`: validates audience, issuer, expiry, and cryptographic signature
- New user via Google → creates `candidate` role (consistent with Sprint 3 self-registration security rule)
- Existing email account → auto-merges by linking `google_sub` to existing user
- Deactivated users blocked from Google login (consistent with email login behavior)
- Returns same JWT shape as email/password login — no frontend changes needed
- `GOOGLE_CLIENT_ID` read from environment variable (development fallback documented)

#### User Model Updates (Social Auth Support)

- Added `Provider` field (`default: 'email'`) to distinguish auth method per user
- Added `GoogleSub` field (unique, nullable) to store Google's subject ID
- `GoogleSub` excluded from JSON responses (`json:"-"`) for security
- `PasswordHash` supports empty string for Google-only accounts
- Provider backfill migration: existing users automatically set to `provider = 'email'` on startup
- All 4 seed users explicitly set `Provider: "email"`

#### Role Filtering on GET /users

- `GET /users` — returns all users (existing behavior unchanged)
- `GET /users?role=interviewer` — returns only interviewers
- Required by FE-2 for interviewer assignment dropdown

#### Dashboard Stats Updates (Sprint 4 Interview Fields)

- `GET /dashboard/stats` now returns 3 new interview statistics:
  - `totalInterviews` — count of all scheduled interviews
  - `pendingInterviews` — interviews without feedback submitted yet
  - `completedInterviews` — interviews with feedback submitted (via INNER JOIN)

#### Seed Users (Complete Set)

All 4 seed users auto-created on first server startup:

| Role           | Email                      | Password           |
| -------------- | -------------------------- | ------------------ |
| Admin          | `admin@hireflow.com`       | `Admin@1234`       |
| Candidate      | `candidate@hireflow.com`   | `Candidate@1234`   |
| Hiring Manager | `manager@hireflow.com`     | `Manager@1234`     |
| Interviewer    | `interviewer@hireflow.com` | `Interviewer@1234` |

> ⚠️ Change all credentials in production!

#### Dependency Improvement

- Replaced heavy `google.golang.org/api` (~20 packages) with `github.com/coreos/go-oidc/v3` (3 packages)
- Purpose-built for OIDC/JWT token verification
- Industry standard for Go OIDC verification
- Supports Google, GitHub, Auth0 - future flexible

---

### Backend — Candidate APIs & Data Model (BE2)

#### Interview Models

- `Interview` struct: `id`, `application_id`, `interviewer_id`, `scheduled_date`, `interview_type`, `status`, foreign keys to `Application` and `User`
- `InterviewFeedback` struct: `id`, `interview_id` (uniqueIndex - write-once), `interviewer_id`, `rating`, `technical_score`, `communication`, `comments`, `recommendation`
- Both added to `AutoMigrate` in correct dependency order
- GORM table names: `interviews`, `interview_feedbacks`

#### Interview Assignment Endpoints

- `POST /interviews` — assign interviewer to application (hiring_manager/admin only)
- `GET /interviews` — list all interviews (hiring_manager/admin only)
- `PATCH /interviews/{id}` — update interview status
- `DELETE /interviews/{id}` — cancel interview

#### Interviewer Endpoints

- `GET /interviewer/assignments` — get interviews assigned to logged-in interviewer

#### Feedback Endpoints

- `POST /interviews/{id}/feedback` — submit feedback (interviewer only, must be assigned)
- `GET /interviews/{id}/feedback` — get feedback for interview (hiring_manager/admin)
- `GET /applications/{id}/feedback` — get all feedback for application (hiring_manager/admin)

---

## 2. Backend Unit Tests

### Backend — Identity, Auth & Jobs: 23 new Sprint 4 tests

#### Google Auth Handler — 10 tests

- `TestGoogleAuth_MissingIDToken`: returns 400 when id_token absent
- `TestGoogleAuth_EmptyIDToken`: returns 400 for whitespace only token
- `TestGoogleAuth_InvalidRequestBody`: returns 400 for malformed JSON
- `TestGoogleAuth_InvalidToken`: returns 401 for fake/invalid token
- `TestGoogleAuth_NewUserCreation`: verifies candidate role for new Google user
- `TestGoogleAuth_ExistingUserMerge`: verifies google_sub linked to existing account
- `TestGoogleAuth_DeactivatedUserBlocked`: verifies deactivated users cannot sign in
- `TestGoogleAuth_ProviderFieldDefault`: verifies email users get provider=email
- `TestGoogleAuth_GoogleSubUniqueConstraint`: verifies duplicate google_sub rejected
- `TestGetGoogleClientID_ReturnsEnvVariable`: verifies env var reading

#### Dashboard Stats Handler — 3 new Sprint 4 tests

- `TestGetDashboardStats_TotalInterviewsCount`: verifies correct interview count
- `TestGetDashboardStats_PendingAndCompletedInterviews`: verifies pending/completed split
- `TestGetDashboardStats_InterviewFieldsInResponseShape`: verifies camelCase field names

**Sprint 4 new tests: 13**

---

## 3. Cumulative Backend Test Coverage

| Handler             | Sprint 2 | Sprint 3 | Sprint 4 | Total                  |
| ------------------- | -------- | -------- | -------- | ---------------------- |
| Auth Handler        | 15       | 3        | 0        | 18                     |
| User Handler        | 11       | 0        | 0        | 11                     |
| Job Handler         | 12       | 0        | 0        | 12                     |
| Dashboard Handler   | 0        | 7        | 3        | 10                     |
| Candidate Handler   | 0        | 21       | 0        | 21                     |
| Google Auth Handler | 0        | 0        | 10       | 10                     |
| **Total**           | **38**   | **31**   | **13**   | **75** (+ route tests) |

---

## 4. Backend API Documentation

**Base URL:** `http://localhost:8080`
**Authentication:** Bearer JWT Token

### Auth Endpoints

| Method | Endpoint                | Description                           | Auth Required |
| ------ | ----------------------- | ------------------------------------- | ------------- |
| POST   | `/auth/login`           | Login with email + password           | No            |
| POST   | `/auth/register`        | Self-register (always candidate role) | No            |
| POST   | `/auth/google`          | Login or register via Google ID token | No            |
| POST   | `/auth/forgot-password` | Request password reset token          | No            |
| POST   | `/auth/reset-password`  | Reset password with token             | No            |

#### POST /auth/google

**Request Body:**

```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Success Response (200 OK):**

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@gmail.com",
    "role": "candidate",
    "is_active": true
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

**Error Responses:**

| Status | Reason                                  |
| ------ | --------------------------------------- |
| 400    | Missing or empty id_token               |
| 401    | Invalid or expired Google token         |
| 401    | Google account email not verified       |
| 403    | Account deactivated                     |
| 500    | Failed to create user or generate token |

**Behavior:**

- New Google user → creates `candidate` account automatically
- Existing email account → links `google_sub` (auto-merge)
- Returns identical JWT shape as email/password login

---

### User Endpoints (Admin Only)

| Method | Endpoint                  | Description                   | Auth Required |
| ------ | ------------------------- | ----------------------------- | ------------- |
| GET    | `/users`                  | List all users                | Admin         |
| GET    | `/users?role=interviewer` | List users filtered by role   | Admin         |
| POST   | `/users`                  | Create new user with any role | Admin         |
| PATCH  | `/users/{id}`             | Activate or deactivate user   | Admin         |

---

### Job Endpoints

| Method | Endpoint     | Description                       | Auth Required          |
| ------ | ------------ | --------------------------------- | ---------------------- |
| GET    | `/jobs`      | List all jobs with candidateCount | Any authenticated      |
| GET    | `/jobs/{id}` | Get job details                   | Any authenticated      |
| POST   | `/jobs`      | Create new job                    | Admin / Hiring Manager |
| PUT    | `/jobs/{id}` | Update job                        | Admin / Hiring Manager |
| DELETE | `/jobs/{id}` | Delete job                        | Admin / Hiring Manager |

---

### Dashboard Endpoints

| Method | Endpoint           | Description                         | Auth Required                        |
| ------ | ------------------ | ----------------------------------- | ------------------------------------ |
| GET    | `/dashboard/stats` | Aggregated hiring + interview stats | Admin / Hiring Manager / Interviewer |

#### Dashboard Stats Response Shape (Sprint 4 Updated)

```json
{
  "totalJobs": 6,
  "openJobs": 5,
  "closedJobs": 1,
  "totalCandidates": 22,
  "totalUsers": 10,
  "departmentSummary": [
    { "department": "Engineering", "openCount": 3, "closedCount": 0 }
  ],
  "totalInterviews": 8,
  "pendingInterviews": 5,
  "completedInterviews": 3
}
```

---

### Candidate / Application Endpoints

| Method | Endpoint                                    | Description                 | Auth Required           |
| ------ | ------------------------------------------- | --------------------------- | ----------------------- |
| POST   | `/api/candidate/apply`                      | Submit job application      | Candidate only          |
| GET    | `/api/candidate/applications`               | Get own applications        | Candidate only          |
| PATCH  | `/api/candidate/applications/{id}/withdraw` | Withdraw own application    | Candidate only          |
| DELETE | `/api/candidate/applications/{id}`          | Delete application          | Candidate (own) / Admin |
| GET    | `/api/candidate/jobs/{jobId}/applications`  | List applications for a job | Hiring Manager / Admin  |
| PATCH  | `/api/candidate/applications/{id}/stage`    | Update application stage    | Hiring Manager / Admin  |

---

### Interview Endpoints (BE2)

| Method | Endpoint                      | Description                       | Auth Required               |
| ------ | ----------------------------- | --------------------------------- | --------------------------- |
| POST   | `/interviews`                 | Assign interviewer to application | Hiring Manager / Admin      |
| GET    | `/interviews`                 | List all interviews               | Hiring Manager / Admin      |
| PATCH  | `/interviews/{id}`            | Update interview status           | Hiring Manager / Admin      |
| DELETE | `/interviews/{id}`            | Cancel interview                  | Hiring Manager / Admin      |
| GET    | `/interviewer/assignments`    | Get my assigned interviews        | Interviewer only            |
| POST   | `/interviews/{id}/feedback`   | Submit interview feedback         | Interviewer (assigned only) |
| GET    | `/interviews/{id}/feedback`   | Get feedback for interview        | Hiring Manager / Admin      |
| GET    | `/applications/{id}/feedback` | Get all feedback for application  | Hiring Manager / Admin      |

---

### Health

| Method | Endpoint  | Description         | Auth Required |
| ------ | --------- | ------------------- | ------------- |
| GET    | `/health` | System health check | No            |

---

## 5. Security Improvements in Sprint 4

| Issue                                          | Status         | Fix                                                     |
| ---------------------------------------------- | -------------- | ------------------------------------------------------- |
| No Google OAuth support                        | ✅ Implemented | `POST /auth/google` with server-side token verification |
| Google token audience not validated            | ✅ Fixed       | `go-oidc/v3` validates `aud`, `iss`, `exp`, signature   |
| Deactivated users could use Google login       | ✅ Fixed       | IsActive check before issuing JWT                       |
| Privilege escalation via Google signup         | ✅ Fixed       | Google signups always get candidate role                |
| No interviewer in seed data                    | ✅ Fixed       | `SeedInterviewer` added to seeder package               |
| Role filtering not available on users endpoint | ✅ Fixed       | `GET /users?role=interviewer` added                     |

---

## 6. Developer Setup

**Prerequisites:** Go 1.21+ · No GCC required (Pure Go SQLite driver)

**Environment Variables:**

```bash
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

**Running the Backend:**

```bash
cd backend
go run main.go
```

**Auto-created seed users on first startup:**

```
✅ Admin:           admin@hireflow.com        / Admin@1234
✅ Candidate:       candidate@hireflow.com    / Candidate@1234
✅ Hiring Manager:  manager@hireflow.com      / Manager@1234
✅ Interviewer:     interviewer@hireflow.com  / Interviewer@1234
```

**Running backend tests:**

```bash
cd backend
go test ./handlers/ -v        # all handler tests (75 tests)
go test ./... -v              # all tests including route tests
go test ./handlers/ -run TestGoogleAuth -v    # Google Auth tests only
go test ./handlers/ -run TestGetDashboardStats -v  # Dashboard tests only
```

---

## 7. Known Limitations

- Google OAuth requires `GOOGLE_CLIENT_ID` environment variable set in production
- No email sending for password reset (demo token returned in response)
- Resume files stored locally under `uploads/resumes/` (no cloud storage)
- JWT tokens expire after 15 minutes (no refresh token implemented)
- Interview assignment and feedback APIs implemented by BE2

---

## 8. Definition of Done ✅

- ✅ `POST /auth/google` implemented with server-side token verification
- ✅ User model updated for social auth (provider, google_sub)
- ✅ Role filtering on `GET /users?role=interviewer` for assignment dropdown
- ✅ Dashboard stats updated with interview statistics (totalInterviews, pendingInterviews, completedInterviews)
- ✅ Interviewer seed user added for E2E testing
- ✅ 13 new unit tests (75 total backend tests passing)
- ✅ All Sprint 1-3 critical flows verified (auth, jobs, candidates, dashboard)
- ✅ API documentation updated in Sprint4.md
