# Backend auth and users

## User table (database)

Backend uses **GORM** with **SQLite** (`hireflow.db`). The `users` table is created by AutoMigrate in `main.go`.

### Structure (`backend/models/user.go`)

| Column        | Type      | Notes                                      |
|---------------|-----------|--------------------------------------------|
| `id`          | uint      | Primary key, auto-increment                |
| `email`       | string    | Unique, not null, indexed                   |
| `password_hash` | string  | Not null, never returned in JSON          |
| `name`        | string    | Not null                                   |
| `role`        | string    | Not null, default `'candidate'`. Values: `admin`, `hiring_manager`, `interviewer`, `candidate` |
| `is_active`   | bool      | Default true                               |
| `created_at`  | time      | Auto-set                                   |
| `updated_at`  | time      | Auto-set                                   |

**Note:** Backend uses **email** for login, not username. There is no `username` column.

### When is data stored?

- **Users** are stored when someone registers via **POST /auth/register** (name, email, password, role). Passwords are hashed with bcrypt before saving.
- **Login** does **not** create users; it only looks up by email and checks password.
- There is **no seed user**. To have a user in the DB you must either:
  1. Call **POST /auth/register** once (e.g. from Postman or the frontend), or  
  2. Add a seed in the backend (e.g. in `main.go` or a migration).

### Checking if data is in the DB

1. **Run the backend** (e.g. `go run main.go`).
2. **Register a user** (e.g. with curl or Postman):
   ```bash
   curl -X POST http://localhost:8080/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Admin User","email":"admin@example.com","password":"Admin@123","role":"admin"}'
   ```
3. **Inspect SQLite** (optional):
   ```bash
   sqlite3 backend/hireflow.db "SELECT id, email, name, role, is_active FROM users;"
   ```

---

## Auth endpoints

| Method | Path             | Body / purpose                          |
|--------|------------------|-----------------------------------------|
| POST   | `/auth/register` | `{ "name", "email", "password", "role" }` – create user, returns user + JWT |
| POST   | `/auth/login`    | `{ "email", "password" }` – returns user + JWT |

## Admin user management (JWT + admin role required)

| Method | Path      | Auth        | Body / purpose |
|--------|-----------|-------------|----------------|
| GET    | `/users`  | Bearer JWT, role `admin` | List all users (id, name, email, role, is_active, created_at). |
| POST   | `/users`  | Bearer JWT, role `admin` | Create user: `{ "name", "email", "password", "role" }`. Same validation as register; returns created user (no token). |

The Users page in the frontend uses these endpoints when an admin is logged in: it loads the list via GET `/users` and creates users via POST `/users` with a default password derived from the form (first 4 chars of username, capitalized + `@1234`).

Login response shape:

```json
{
  "user": { "id", "name", "email", "role", "is_active" },
  "access_token": "<JWT>",
  "expires_in": 900
}
```

JWT expiry is 15 minutes. Frontend stores `access_token` and user in sessionStorage and sends the token in the `Authorization` header for protected API calls (when you add an HTTP interceptor).

---

## Frontend–backend connection

- **Login:** Frontend sends **POST /auth/login** with `email` and `password`. On success it stores the JWT and user in sessionStorage and uses them for session and profile.
- **Register:** Use **POST /auth/register** (e.g. curl/Postman) to create the first user, or log in as admin and create users from the **Users** page.
- **Admin create user:** The Users page calls **GET /users** and **POST /users** with the stored JWT. Only users with role `admin` can list and create users; new users can log in with the default password (first 4 chars of username, capitalized + `@1234`).
- **Password reset:** Backend has no reset endpoint yet. Frontend reset flow is a stub (no-op) until backend supports it.
