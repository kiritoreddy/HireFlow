# HireFlow Sprint 3 - Backend API Documentation

**Owner:** BE1 (Identity & Auth)  
**Backend:** Go + Gorilla Mux + GORM + SQLite  
**Base URL:** `http://localhost:8080`  
**Authentication:** Bearer JWT Token

---

## Sprint 3 Summary

### Completed in Sprint 3 (BE1):
- Fixed self-registration to always create candidate role (security fix)
- Implemented GET /dashboard/stats endpoint for hiring dashboard
- Added role-based protection to dashboard endpoint
- Fixed candidate route references to match BE2's updated method names
- Extended seeder with test candidate and hiring manager users
- Implemented 7 unit tests for dashboard stats handler
- Updated Sprint2.md to reflect self-registration change

### Endpoints Completed or Improved:
- `POST /auth/register` - Now enforces candidate role (security fix)
- `GET /dashboard/stats` - New endpoint for hiring dashboard stats

### Backend Unit Tests Added:
- Dashboard stats handler: 7 tests
- Self-registration role enforcement: 3 new tests added to auth handler
- **Sprint 3 total: 10 new tests**
- **Cumulative total: 48 tests**

### Known Limitations:
- Google OAuth implementation handled separately by team lead
- Resume upload handled by BE2
- Dashboard stats uses SQLite GROUP BY (adequate for demo scale)

---

## Default Test Credentials

For development and E2E testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hireflow.com` | `Admin@1234` |
| Candidate | `candidate@hireflow.com` | `Candidate@1234` |
| Hiring Manager | `manager@hireflow.com` | `Manager@1234` |

> ⚠️ Change all credentials in production!

---

## New Endpoints

---

### 1. GET /dashboard/stats

**Description:** Returns aggregated hiring statistics for the dashboard  
**Auth Required:** Yes  
**Role Required:** `admin`, `hiring_manager`, `interviewer` (candidates excluded)

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "totalJobs": 6,
  "openJobs": 5,
  "closedJobs": 1,
  "totalCandidates": 22,
  "totalUsers": 10,
  "departmentSummary": [
    { "department": "Engineering", "openCount": 3, "closedCount": 0 },
    { "department": "Design", "openCount": 1, "closedCount": 0 },
    { "department": "Marketing", "openCount": 1, "closedCount": 1 }
  ]
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `totalJobs` | int | Total number of job postings |
| `openJobs` | int | Jobs with status = "Open" |
| `closedJobs` | int | Jobs with status = "Closed" |
| `totalCandidates` | int | Total applications excluding WITHDRAWN |
| `totalUsers` | int | Total system users (all roles) |
| `departmentSummary` | array | Job counts grouped by department |

**Error Responses:**

| Status | Reason |
|--------|--------|
| 401 | Missing or invalid token |
| 403 | Candidate role not permitted |
| 500 | Database error |

---

## Modified Endpoints

---

### POST /auth/register (Security Fix)

**What changed:** Self-registration now **always** creates a user with `candidate` role regardless of what role is passed in the request body.

**Before (Sprint 2):**
```json
{
  "name": "Sneaky User",
  "email": "sneaky@example.com",
  "password": "SecurePass123!",
  "role": "admin"  // Was accepted - security vulnerability!
}
```

**After (Sprint 3):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "admin"  // Ignored - always becomes "candidate"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "candidate",  // Always candidate regardless of input
    "is_active": true
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

**Why:** Prevents privilege escalation where users could self-assign admin or hiring_manager roles. Admins must use `POST /users` to create non-candidate users.

---

## Running Backend Tests

```bash
# Run all tests
cd backend
go test ./... -v

# Run specific Sprint 3 tests
go test ./handlers/ -run TestGetDashboardStats -v
go test ./handlers/ -run TestRegister -v

# Run all handler tests
go test ./handlers/ -v
```

---

## Developer Setup

### Prerequisites
- Go 1.21+
- No GCC required (Pure Go SQLite driver)

### Running the Backend
```bash
cd backend
go run main.go
```

### Auto-Created Seed Users
On first startup, the backend automatically creates these test users:

```
✅ Admin:           admin@hireflow.com     / Admin@1234
✅ Candidate:       candidate@hireflow.com / Candidate@1234
✅ Hiring Manager:  manager@hireflow.com   / Manager@1234
```

---

## Complete Test Coverage (Cumulative)

| Handler | Sprint 2 Tests | Sprint 3 Tests | Total |
|---------|---------------|----------------|-------|
| Auth Handler | 15 | 3 (role enforcement) | 18 |
| User Handler | 11 | 0 | 11 |
| Job Handler | 12 | 0 | 12 |
| Dashboard Handler | 0 | 7 | 7 |
| **Total** | **38** | **10** | **48** |

---

## Security Improvements in Sprint 3

| Issue | Status | Fix |
|-------|--------|-----|
| Self-registration privilege escalation | ✅ Fixed | Force candidate role on /auth/register |
| Dashboard accessible to candidates | ✅ Fixed | RequireRole middleware excludes candidates |
| Job routes unprotected | ✅ Already fixed in Sprint 2 | RequireAuth + RequireRole |