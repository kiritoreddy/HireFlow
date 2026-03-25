# HireFlow Sprint 2 - Backend API Documentation

**Owner:** BE1 (Identity & Auth)  
**Backend:** Go + Gorilla Mux + GORM + SQLite  
**Base URL:** `http://localhost:8080`  
**Authentication:** Bearer JWT Token

---

## Sprint 2 Summary

### Completed in Sprint 2 (BE1):

- Added `candidateCount` to GET /jobs response
- Added role-based authentication protection to Job routes
- Added admin seed user for development/testing
- Implemented 38 backend unit tests (auth, users, jobs handlers)
- Wrote comprehensive API documentation

### Endpoints Completed or Improved:

- `POST /auth/login` - Stabilized with inactive user check
- `POST /auth/forgot-password` - Implemented with token generation
- `POST /auth/reset-password` - Implemented with token validation
- `GET /users` - Admin only, JWT protected
- `POST /users` - Admin only, JWT protected
- `PATCH /users/{id}` - Admin only, JWT protected
- `GET /jobs` - Now includes candidateCount, JWT protected
- `GET /jobs/{id}` - JWT protected
- `POST /jobs` - Restricted to hiring_manager/admin
- `PUT /jobs/{id}` - Restricted to hiring_manager/admin
- `DELETE /jobs/{id}` - Restricted to hiring_manager/admin

### Backend Unit Tests Added:

- Auth handler tests: 15 tests
- User handler tests: 11 tests
- Job handler tests: 12 tests
- **Total: 38 tests**

### Known Limitations:

- Password reset does not send real email (demo token returned in response)
- JWT tokens expire after 15 minutes (no refresh token yet)
- Resume upload handled by BE2

---

## Default Admin Credentials

For development and testing:

| Field    | Value                |
| -------- | -------------------- |
| Email    | `admin@hireflow.com` |
| Password | `Admin@1234`         |
| Role     | `admin`              |

> ⚠️ Change these credentials in production!

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Obtain a token via `POST /auth/login`.

---

## Endpoints

---

### 1. POST /auth/login

**Description:** Authenticate user and receive JWT token  
**Auth Required:** No  
**Role Required:** None

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200 OK):**

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "hiring_manager",
    "is_active": true
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

**Error Responses:**

| Status | Reason                                        |
| ------ | --------------------------------------------- |
| 400    | Missing email or password                     |
| 401    | Invalid credentials (wrong email or password) |
| 403    | Account deactivated                           |

---

### 2. POST /auth/register

**Description:** Register a new user account  
**Auth Required:** No  
**Role Required:** None

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "hiring_manager"
}
```

**Password Rules:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&\*)

**Valid Roles:** `admin`, `hiring_manager`, `interviewer`, `candidate`

**Success Response (201 Created):**

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "hiring_manager",
    "is_active": true
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

**Error Responses:**

| Status | Reason                   |
| ------ | ------------------------ |
| 400    | Missing required fields  |
| 400    | Invalid email format     |
| 400    | Weak password            |
| 400    | Invalid role             |
| 409    | Email already registered |

---

### 3. POST /auth/forgot-password

**Description:** Request a password reset token  
**Auth Required:** No  
**Role Required:** None  
**Note:** Demo mode - token returned in response (no email sent)

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Success Response (200 OK):**

```json
{
  "message": "If an account exists for that email, we've sent reset instructions.",
  "reset_token": "abc123...",
  "expires_in": 1800
}
```

**Error Responses:**

| Status | Reason        |
| ------ | ------------- |
| 400    | Missing email |

---

### 4. POST /auth/reset-password

**Description:** Reset password using token from forgot-password  
**Auth Required:** No  
**Role Required:** None

**Request Body:**

```json
{
  "token": "abc123...",
  "password": "NewSecurePass123!"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Password reset successful"
}
```

**Error Responses:**

| Status | Reason                    |
| ------ | ------------------------- |
| 400    | Missing token or password |
| 400    | Weak password             |
| 400    | Invalid or expired token  |

---

### 5. GET /users

**Description:** List all users  
**Auth Required:** Yes  
**Role Required:** `admin`

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "hiring_manager",
    "is_active": true,
    "created_at": "2026-02-09T19:19:56+00:00"
  }
]
```

**Error Responses:**

| Status | Reason                   |
| ------ | ------------------------ |
| 401    | Missing or invalid token |
| 403    | Not an admin             |

---

### 6. POST /users

**Description:** Create a new user (admin only)  
**Auth Required:** Yes  
**Role Required:** `admin`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "role": "interviewer"
}
```

**Success Response (201 Created):**

```json
{
  "id": 2,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "interviewer",
  "is_active": true,
  "created_at": "2026-02-09T19:19:56+00:00"
}
```

**Error Responses:**

| Status | Reason                         |
| ------ | ------------------------------ |
| 400    | Missing required fields        |
| 400    | Invalid email or weak password |
| 400    | Invalid role                   |
| 401    | Missing or invalid token       |
| 403    | Not an admin                   |
| 409    | Email already registered       |

---

### 7. PATCH /users/{id}

**Description:** Activate or deactivate a user  
**Auth Required:** Yes  
**Role Required:** `admin`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "is_active": false
}
```

**Success Response (200 OK):**

```json
{
  "id": 2,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "interviewer",
  "is_active": false,
  "created_at": "2026-02-09T19:19:56+00:00"
}
```

**Error Responses:**

| Status | Reason                   |
| ------ | ------------------------ |
| 400    | Missing is_active field  |
| 401    | Missing or invalid token |
| 403    | Not an admin             |
| 404    | User not found           |

---

### 8. GET /jobs

**Description:** Get all job postings with candidate count  
**Auth Required:** Yes  
**Role Required:** Any authenticated user

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "title": "Senior Software Engineer",
    "description": "Build scalable systems",
    "department": "Engineering",
    "location": "Remote",
    "status": "Open",
    "created_at": "2026-02-09T19:19:56+00:00",
    "updated_at": "2026-02-09T19:19:56+00:00",
    "candidateCount": 5
  }
]
```

**Error Responses:**

| Status | Reason                   |
| ------ | ------------------------ |
| 401    | Missing or invalid token |

---

### 9. GET /jobs/{id}

**Description:** Get a specific job by ID  
**Auth Required:** Yes  
**Role Required:** Any authenticated user

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "title": "Senior Software Engineer",
  "description": "Build scalable systems",
  "department": "Engineering",
  "location": "Remote",
  "status": "Open",
  "created_at": "2026-02-09T19:19:56+00:00",
  "updated_at": "2026-02-09T19:19:56+00:00"
}
```

**Error Responses:**

| Status | Reason                   |
| ------ | ------------------------ |
| 400    | Invalid job ID           |
| 401    | Missing or invalid token |
| 404    | Job not found            |

---

### 10. POST /jobs

**Description:** Create a new job posting  
**Auth Required:** Yes  
**Role Required:** `hiring_manager`, `admin`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Senior Software Engineer",
  "description": "Build scalable systems",
  "department": "Engineering",
  "location": "Remote",
  "status": "Open"
}
```

**Success Response (201 Created):**

```json
{
  "id": 1,
  "title": "Senior Software Engineer",
  "description": "Build scalable systems",
  "department": "Engineering",
  "location": "Remote",
  "status": "Open",
  "created_at": "2026-02-09T19:19:56+00:00",
  "updated_at": "2026-02-09T19:19:56+00:00"
}
```

**Error Responses:**

| Status | Reason                   |
| ------ | ------------------------ |
| 400    | Invalid request body     |
| 401    | Missing or invalid token |
| 403    | Insufficient permissions |

---

### 11. PUT /jobs/{id}

**Description:** Update an existing job posting  
**Auth Required:** Yes  
**Role Required:** `hiring_manager`, `admin`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Lead Software Engineer",
  "description": "Build and lead scalable systems",
  "department": "Engineering",
  "location": "Hybrid",
  "status": "Open"
}
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "title": "Lead Software Engineer",
  "description": "Build and lead scalable systems",
  "department": "Engineering",
  "location": "Hybrid",
  "status": "Open",
  "created_at": "2026-02-09T19:19:56+00:00",
  "updated_at": "2026-02-09T20:45:30+00:00"
}
```

**Error Responses:**

| Status | Reason                         |
| ------ | ------------------------------ |
| 400    | Invalid job ID or request body |
| 401    | Missing or invalid token       |
| 403    | Insufficient permissions       |
| 404    | Job not found                  |

---

### 12. DELETE /jobs/{id}

**Description:** Delete a job posting  
**Auth Required:** Yes  
**Role Required:** `hiring_manager`, `admin`

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (204 No Content):**

```
(empty body)
```

**Error Responses:**

| Status | Reason                   |
| ------ | ------------------------ |
| 400    | Invalid job ID           |
| 401    | Missing or invalid token |
| 403    | Insufficient permissions |
| 404    | Job not found            |

---

## Running Backend Tests

```bash
# Run all tests
go test ./...

# Run specific handler tests
go test ./handlers/ -run TestRegister -v
go test ./handlers/ -run TestLogin -v
go test ./handlers/ -run TestForgotPassword -v
go test ./handlers/ -run TestResetPassword -v
go test ./handlers/ -run TestListUsers -v
go test ./handlers/ -run TestCreateUser -v
go test ./handlers/ -run TestSetUserActive -v
go test ./handlers/ -run TestGetAllJobs -v
go test ./handlers/ -run TestCreateJob -v
go test ./handlers/ -run TestGetJobByID -v
go test ./handlers/ -run TestUpdateJob -v
go test ./handlers/ -run TestDeleteJob -v
```

---

## Developer Setup

### Prerequisites

- Go 1.21+
- No additional dependencies (Pure Go SQLite - no GCC required)

### Running the Backend

```bash
cd backend
go run main.go
```

### First Time Setup

On first startup, the backend automatically creates a default admin user:

- **Email:** `admin@hireflow.com`
- **Password:** `Admin@1234`

Use these credentials to login and create additional users via `POST /users`.

---

## Test Coverage Summary

| Handler      | Tests  | Coverage                                                |
| ------------ | ------ | ------------------------------------------------------- |
| Auth Handler | 15     | Register, Login, ForgotPassword, ResetPassword          |
| User Handler | 11     | ListUsers, CreateUser, SetUserActive                    |
| Job Handler  | 12     | GetAllJobs, CreateJob, GetJobByID, UpdateJob, DeleteJob |
| **Total**    | **38** | **All BE1 handlers**                                    |
