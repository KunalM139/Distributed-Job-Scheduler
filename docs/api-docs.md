# Distributed Job Scheduler API Documentation

**Base URL**: `http://localhost:3000/api`

## Authentication
All endpoints except those under `/auth` require a valid JWT token in the `Authorization` header.

```http
Authorization: Bearer <your_jwt_token>
```

---

## Rate Limiting
The API enforces rate limits to prevent abuse. If you exceed a limit, you will receive an HTTP `429 Too Many Requests` response containing an `error: true` and a `message` explaining the limit.

- **General API**: 100 requests / 15 minutes (Exempts GET requests for Dashboard/Polling)
- **Authentication** (`/api/auth/*`): 10 requests / 15 minutes
- **Job Creation** (`POST /api/queues/:id/jobs`): 30 requests / minute

---

## Auth

### Register
**Method:** `POST`  
**Path:** `/auth/register`  
**Description:** Create a new user account.  
**Permissions:** Public

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

### Login
**Method:** `POST`  
**Path:** `/auth/login`  
**Description:** Authenticate a user and receive a JWT token.  
**Permissions:** Public

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

---

## Projects

### List Projects
**Method:** `GET`  
**Path:** `/projects`  
**Description:** Retrieve all projects the authenticated user is a member of.  
**Permissions:** Authenticated User

### Create Project
**Method:** `POST`  
**Path:** `/projects`  
**Description:** Create a new project. The creator is automatically assigned the `owner` role.  
**Permissions:** Authenticated User

### Delete Project
**Method:** `DELETE`  
**Path:** `/projects/:id`  
**Description:** Delete a project and all its associated queues and jobs.  
**Permissions:** Owner only

---

## Project Members (RBAC)

### List Members
**Method:** `GET`  
**Path:** `/projects/:projectId/members`  
**Description:** List all members and their roles for a project.  
**Permissions:** Owner, Admin, Viewer

### Add Member
**Method:** `POST`  
**Path:** `/projects/:projectId/members`  
**Description:** Add a user to the project.  
**Permissions:** Owner, Admin

**Request Body:**
```json
{
  "email": "teammate@example.com",
  "role": "viewer" // owner, admin, viewer
}
```

### Update Member Role
**Method:** `PATCH`  
**Path:** `/projects/:projectId/members/:userId`  
**Description:** Change a member's role.  
**Permissions:** Owner only

### Remove Member
**Method:** `DELETE`  
**Path:** `/projects/:projectId/members/:userId`  
**Description:** Remove a member from the project.  
**Permissions:** Owner, Admin (Admins cannot remove Owners)

---

## Queues

### List Queues
**Method:** `GET`  
**Path:** `/projects/:projectId/queues`  
**Description:** Retrieve all queues belonging to a specific project.  
**Permissions:** Owner, Admin, Viewer

### Create Queue
**Method:** `POST`  
**Path:** `/projects/:projectId/queues`  
**Description:** Create a new job queue in a project with a specific retry policy.  
**Permissions:** Owner, Admin

### Update Queue
**Method:** `PATCH`  
**Path:** `/queues/:id`  
**Description:** Update a queue's configuration (priority, concurrency, status).  
**Permissions:** Owner, Admin

### Pause Queue / Resume Queue
**Method:** `POST`  
**Path:** `/queues/:id/pause` | `/queues/:id/resume`  
**Description:** Pauses or resumes job execution for the queue.  
**Permissions:** Owner, Admin

### Queue Stats
**Method:** `GET`  
**Path:** `/queues/:id/stats`  
**Description:** Get current job count grouped by status for a specific queue.  
**Permissions:** Owner, Admin, Viewer

---

## Jobs

### Create Job(s)
**Method:** `POST`  
**Path:** `/queues/:queueId/jobs`  
**Description:** Enqueue one or multiple jobs.  
**Permissions:** Owner, Admin

**Immediate Jobs:**
```json
{ "type": "send-email", "payload": { "to": "user@example.com" }, "priority": 10 }
```

**Delayed Jobs:**
```json
{ "type": "generate-report", "payload": { "id": 123 }, "scheduled_at": "2026-07-05T00:00:00Z" }
```

**Cron Jobs:**
```json
{ "type": "daily-cleanup", "payload": {}, "cron_expression": "0 0 * * *" }
```

**Batch Jobs (Array):**
```json
[
  { "type": "process-image", "payload": { "id": 1 } },
  { "type": "process-image", "payload": { "id": 2 } }
]
```

### List Jobs
**Method:** `GET`  
**Path:** `/queues/:queueId/jobs`  
**Description:** List jobs in a queue with optional status filtering and pagination.  
**Permissions:** Owner, Admin, Viewer

### Get Job Details
**Method:** `GET`  
**Path:** `/jobs/:id`  
**Description:** Fetch full details of a specific job, including its payload, execution history, and logs.  
**Permissions:** Owner, Admin, Viewer

### Retry Job
**Method:** `POST`  
**Path:** `/jobs/:id/retry`  
**Description:** Manually reset a failed job back to `queued` status to be processed again.  
**Permissions:** Owner, Admin

### Delete Job
**Method:** `DELETE`  
**Path:** `/jobs/:id`  
**Description:** Permanently delete a job.  
**Permissions:** Owner, Admin

---

## Scheduled / Cron Jobs

### List Scheduled Jobs
**Method:** `GET`  
**Path:** `/queues/:queueId/scheduled-jobs` (or embedded in job listing depending on implementation)  
**Description:** Managed via the cron expression on the jobs endpoint. The backend daemon translates these into discrete job executions automatically.

---

## Workers

### List Workers
**Method:** `GET`  
**Path:** `/workers`  
**Description:** Retrieve all active and offline workers globally.  
**Permissions:** Authenticated User

### Get Worker Details
**Method:** `GET`  
**Path:** `/workers/:id`  
**Description:** Get detailed information about a worker and its current executing jobs.  
**Permissions:** Authenticated User

---

## Dead Letter Queue (DLQ)

### List DLQ Entries
**Method:** `GET`  
**Path:** `/dlq`  
**Description:** List all jobs that have exhausted their retry attempts. Includes Gemini AI generated failure summaries.  
**Permissions:** Authenticated User (Filtered by project membership)

**Response Example Payload Snippet:**
```json
{
  "id": "dlq-uuid",
  "job_id": "job-uuid",
  "failure_reason": "SMTP timeout",
  "ai_summary": "The SMTP server timed out. Check network connectivity or credentials.",
  "total_attempts": 3
}
```

### Retry DLQ Job
**Method:** `POST`  
**Path:** `/dlq/:id/retry`  
**Description:** Remove a job from the DLQ and move it back into its original queue as `queued`.  
**Permissions:** Owner, Admin

---

## Statistics

### Global Dashboard Stats
**Method:** `GET`  
**Path:** `/stats`  
**Description:** Retrieve high-level aggregate statistics for the entire system scoped to the user's projects.  
**Permissions:** Authenticated User
