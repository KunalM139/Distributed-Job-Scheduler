# Security Documentation

This document outlines the security measures and best practices implemented in the Distributed Job Scheduler.

## 1. Authentication & Password Hashing
- **Password Hashing:** User passwords are encrypted using `bcryptjs` with a secure salt round before being stored in the database. Plaintext passwords are never logged or stored.
- **JWT Authentication:** The system uses JSON Web Tokens (JWT) for stateless authentication. 
  - Tokens are signed using a secure `JWT_SECRET` environment variable.
  - The authentication middleware (`requireAuth`) verifies the token's signature and expiration on every protected request.
  - Furthermore, the middleware performs a live database lookup (`SELECT id FROM users`) to ensure the user hasn't been deleted since the token was issued, preventing disabled accounts from continuing to access the API.

## 2. Authorization & Role-Based Access Control (RBAC)
- Data isolation is strictly enforced at the database query level. The `projects` and `project_members` tables are used to authorize every request.
- **Role Hierarchy:**
  - `owner`: Full control. Can delete projects and modify member roles.
  - `admin`: Can create/modify/delete queues and jobs, and add viewers. Cannot delete projects.
  - `viewer`: Read-only access to dashboard stats, queues, and job logs.
- The `requireRole()` middleware dynamically intercepts requests, queries the `project_members` table for the authenticated user, and blocks the request (`403 Forbidden`) if their role is insufficient.

## 3. Rate Limiting
To protect against brute-force attacks and Denial of Service (DoS):
- **General Limiter:** `100 requests / 15 minutes` for standard API routes.
- **Auth Limiter:** `10 requests / 15 minutes` specifically protecting `/api/auth/login` and `/auth/register` to prevent credential stuffing.
- **Job Creation Limiter:** `30 requests / 1 minute` to prevent malicious actors from flooding the job queue.
- Dashboard polling endpoints (`GET /api/stats`, `GET /api/projects`) are strategically exempted from the general limiter to allow the frontend to remain responsive during heavy monitoring.

## 4. Input Validation
- All incoming HTTP requests are validated using `express-validator`.
- Payloads are checked for correct data types (e.g., UUIDs, integers, JSON structures).
- Extraneous spaces are trimmed, and string lengths are bounded to prevent buffer overflow or excessively large database inserts.
- If validation fails, the API immediately returns a `400 Bad Request` with an array of specific field errors before reaching the business logic layer.

## 5. SQL Injection Protection
- The application uses the `pg` (node-postgres) library for all database interactions.
- **Parameterized Queries:** All user input is passed as parameterized arguments (e.g., `$1, $2`). String concatenation is NEVER used for SQL queries, rendering SQL injection attacks impossible.

## 6. Error Handling
- The backend utilizes a global error-handling middleware.
- Internal server errors (`500`) are logged to the console for debugging but are sanitized before being sent to the client. Stack traces and raw database errors are never exposed in API responses to prevent information leakage.
- `401 Unauthorized`, `403 Forbidden`, and `404 Not Found` errors provide generic, safe error messages.

## 7. Cross-Origin Resource Sharing (CORS)
- The API uses the `cors` middleware to restrict which domains can access the API. In production, this can be configured to only accept requests from the specific domain hosting the React frontend.

## 8. Environment Variables
- Sensitive configuration is entirely decoupled from the source code.
- Passwords, API keys (e.g., `GEMINI_API_KEY`), database connection strings (`DATABASE_URL`), and secrets (`JWT_SECRET`) are loaded exclusively from the `.env` file via `dotenv`.
- `.env` files are added to `.gitignore` to prevent accidental commits to version control.
