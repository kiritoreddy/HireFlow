# HireFlow – ATS Lite

## Project Setup (Local Development)

### Prerequisites
Ensure the following are installed:
- Git
- Node.js (v20 LTS recommended)
- Angular CLI
- Go (v1.22+)

Verify installation:
node -v
npm -v
ng version
go version

## Clone Repository
git clone <repository-url>
cd hireflow-ats-lite

## Frontend Setup (Angular)
cd frontend/hireflow-frontend
npm install
ng serve

Frontend runs at:
http://localhost:4200

## Backend Setup (Go)
cd backend
go mod tidy
go run main.go

Or with live reload:
air

Backend runs at:
http://localhost:8080

## Google Sign-In
- Frontend uses Google Identity Services on the **login** and **register** pages. The client ID is shared from `frontend/src/app/core/config/google-client.config.ts` (override there for your OAuth client).
- Backend verifies ID tokens with the same audience. Set `GOOGLE_CLIENT_ID` to override the default, for example:
  - macOS/Linux: `export GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"`
  - Then run `go run main.go` or `air`.
- In Google Cloud Console, add **Authorized JavaScript origins**: `http://localhost:4200` (and your production URL).

## Database
SQLite database (hireflow.db) is created automatically on first run. No manual setup required.

## API notes (Sprint 4)
- **Hiring pipeline** (JWT + `hiring_manager` or `admin`): `GET /api/jobs/{jobId}/applications`, `PATCH /api/applications/{id}/stage` with body `{"stage":"..."}`.
- **Interviewer assignments** (JWT + `interviewer`): `GET /interviewer/assignments` (same data as `GET /interviews` for that role).
- **Cancel interview**: `PATCH /interviews/{id}/cancel` (not `DELETE`).
- **Feedback for hiring view**: `GET /api/applications/{id}/feedback` (consolidated); per-interview: `GET /interviews/{id}/feedback`.

## Health Check
http://localhost:8080/health

Expected response:
{"status":"ok","db":"sqlite","service":"hireflow-backend"}

## Development Notes
Run frontend and backend in separate terminals. Frontend auto-reloads using Angular CLI. Backend auto-restarts when using Air. Default ports: frontend 4200, backend 8080.

## Ready to Develop
The project is now set up and ready for development.
