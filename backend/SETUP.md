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

## Database
SQLite database (hireflow.db) is created automatically on first run. No manual setup required.

## Health Check
http://localhost:8080/health

Expected response:
{"status":"ok","db":"sqlite","service":"hireflow-backend"}

## Development Notes
Run frontend and backend in separate terminals. Frontend auto-reloads using Angular CLI. Backend auto-restarts when using Air. Default ports: frontend 4200, backend 8080.

## Ready to Develop
The project is now set up and ready for development.
