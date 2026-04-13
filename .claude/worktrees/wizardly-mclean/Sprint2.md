# HireFlow — Sprint 2

## Overview
Sprint 2 focused on integrating backend and frontend functionality, expanding candidate and job workflows, adding automated testing, and documenting backend APIs. This sprint builds on Sprint 1 by delivering core system features and improving system reliability.

---

## 1. Work Completed in Sprint 2

### Backend

#### Authentication
Implemented a complete authentication system using JWT:
- User registration (`/auth/register`) with validation for email, password strength, and role
- Login (`/auth/login`) with token generation and inactive-user handling
- Forgot password (`/auth/forgot-password`) to generate reset tokens
- Reset password (`/auth/reset-password`) to update user credentials securely
- Middleware to protect routes and enforce authentication

#### User Management (Admin Only)
Developed admin-controlled user management APIs:
- `GET /users` to retrieve all users
- `POST /users` to create new users with roles
- `PATCH /users/{id}` to activate or deactivate users
- Enforced role-based access control so only admins can perform these actions

#### Job Management
Implemented full CRUD functionality for job postings:
- `GET /jobs` returns job listings along with candidate counts
- `GET /jobs/{id}` retrieves detailed job information
- `POST /jobs` allows creation of new job postings
- `PUT /jobs/{id}` updates job details
- `DELETE /jobs/{id}` removes a job
- Restricted modification operations to admin and hiring manager roles

#### Candidate and Application Workflow
Implemented core recruitment pipeline functionality:
- `POST /api/candidate/apply` allows candidates to apply to jobs
- `GET /api/candidate/jobs/{jobId}/applications` lists all applications for a job
- `PATCH /api/candidate/applications/{id}/stage` updates application stage
- `GET /api/candidate/applications` retrieves applications by candidate
- `PATCH /api/candidate/applications/{id}/withdraw` allows withdrawal
- Supported pipeline stages: APPLIED, INTERVIEW, SELECTED, REJECTED, WITHDRAWN

#### System and Data Setup
- Added `GET /health` endpoint for system monitoring
- Implemented automatic database migrations for all models
- Seeded default admin user and sample data for testing and development

---

### Frontend

#### Dashboard and Layout
- Implemented a dashboard page with summary cards and quick actions
- Created a reusable layout with sidebar navigation and header
- Enabled role-based navigation (admin-specific sections)

#### Authentication UI
- Built login, forgot-password, and reset-password pages
- Implemented route guards to protect authenticated routes
- Added admin guard for role-based access
- Implemented HTTP interceptor to attach JWT tokens to requests and handle 401 errors

#### Jobs Module
- Integrated frontend with backend jobs API
- Implemented jobs table with:
  - Search functionality
  - Status filtering (open/closed)
  - Sorting and pagination
- Added create/edit job dialog forms
- Displayed candidate counts per job

#### Candidates Module
- Built candidates overview page showing job cards with pipeline counts
- Implemented job-specific candidate page
- Added:
  - Search by name/email
  - Stage filtering
  - Stage update functionality
- Integrated candidate application APIs

#### Users Module
- Implemented admin-only users page
- Added:
  - User creation functionality
  - Activate/deactivate users
  - Search and filtering
- Connected UI with backend user APIs

---

## 2. Frontend Unit Tests and Cypress Tests

### Angular Unit Tests
- auth.service.spec.ts
- auth.guard.spec.ts
- admin.guard.spec.ts
- auth.interceptor.spec.ts
- jobs-api.service.spec.ts
- user.service.spec.ts
- jobs.component.spec.ts
- app.spec.ts

### Cypress Tests
- login.cy.ts
- unauthenticated-redirect.cy.js
- jobs-render.cy.ts
- jobs-search-filter.cy.ts
- jobs-status-filter.cy.ts
- jobs-sorting.cy.ts
- jobs-clear-filters.cy.ts
- jobs-add-job-dialog.cy.ts
- candidates-overview.cy.ts
- job-candidates-page.cy.ts
- job-candidates-update-stage.cy.ts
- users-page.cy.ts

##Angular Unit Tests

### auth.service.spec.ts
Tests authentication logic:
- Verifies login stores JWT token and updates login state
- Handles login failure scenarios
- Ensures logout clears session and redirects user

---

### auth.guard.spec.ts
Tests route protection:
- Allows navigation for authenticated users
- Redirects unauthenticated users to login page

---

### admin.guard.spec.ts
Tests role-based access:
- Allows admin users to access protected routes
- Blocks non-admin users
- Redirects unauthenticated users

---

### auth.interceptor.spec.ts
Tests HTTP request handling:
- Adds Authorization header to protected API calls
- Skips adding header for auth endpoints
- Handles 401 errors by logging out and redirecting

---

### jobs-api.service.spec.ts
Tests jobs API integration:
- Fetches jobs correctly from backend
- Sends correct payload for job creation
- Maps API response to frontend model

---

### user.service.spec.ts
Tests user API integration:
- Loads users from backend
- Handles empty or error responses
- Maps response data correctly

---

### jobs.component.spec.ts
Tests jobs UI behavior:
- Component initializes correctly
- Loads jobs on initialization
- Filters jobs by search input
- Filters jobs by status (open/closed)
- Combines search and filter logic
- Calculates candidate count correctly

---

### app.spec.ts
Tests root component:
- Ensures app component is created successfully

---

##Cypress End-to-End Tests

### login.cy.ts
- Tests user login flow
- Validates input fields
- Verifies password visibility toggle
- Ensures redirect to dashboard after login

---

### unauthenticated-redirect.cy.js
- Ensures protected routes redirect to login for unauthenticated users

---

### jobs-render.cy.ts
- Verifies jobs table renders correctly with data

---

### jobs-search-filter.cy.ts
- Tests search functionality in jobs page

---

### jobs-status-filter.cy.ts
- Tests filtering jobs by status

---

### jobs-sorting.cy.ts
- Verifies sorting functionality (ascending/descending)

---

### jobs-clear-filters.cy.ts
- Ensures filters can be cleared and reset

---

### jobs-add-job-dialog.cy.ts
- Tests job creation using dialog form

---

### candidates-overview.cy.ts
- Verifies candidates overview page displays job cards

---

### job-candidates-page.cy.ts
- Tests candidate list display for a selected job

---

### job-candidates-update-stage.cy.ts
- Verifies updating candidate stage sends correct API request

---

### users-page.cy.ts
- Tests users page loads and displays data correctly

---

---

## 3. Backend Unit Tests

Auth: 15 tests  
Users: 11 tests  
Jobs: 12 tests  

---

## 4. Backend API Documentation

Base URL: http://localhost:8080

Endpoints:
- Auth: /auth/*
- Users: /users
- Jobs: /jobs
- Candidates: /api/candidate/*

---

## 5. Summary

Completed:
- Backend APIs
- Frontend integration
- Angular tests (~23)
- Cypress tests (~13)
- Backend tests (38)
- API documentation

---

## Conclusion
Sprint 2 successfully delivers a fully integrated system with core hiring workflows, testing, and documentation.
