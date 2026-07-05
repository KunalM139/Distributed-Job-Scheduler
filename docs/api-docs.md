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

- **General API**: 100 requests / 15 minutes
- **Authentication** (`/api/auth/*`): 10 requests / 15 minutes
- **Job Creation** (`POST /api/queues/:id/jobs`): 30 requests / minute

---

## Auth

### Register
**Method:** `POST`  
**Path:** `/auth/register`  
**Description:** Create a new user account.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a1b2c3d4-...",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
}
```

### Login
**Method:** `POST`  
**Path:** `/auth/login`  
**Description:** Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a1b2c3d4-...",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
}
```

---

## Projects

### List Projects
**Method:** `GET`  
**Path:** `/projects`  
**Description:** Retrieve all projects owned by the authenticated user.

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "p1-uuid",
      "name": "Email Notifications",
      "description": "Handles all outgoing transactional emails",
      "created_at": "2026-07-04T10:00:00Z"
    }
  ]
}
```

### Create Project
**Method:** `POST`  
**Path:** `/projects`  
**Description:** Create a new project.

**Request Body:**
```json
{
  "name": "Data Processing",
  "description": "Background ETL tasks"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "p2-uuid",
    "name": "Data Processing",
    "description": "Background ETL tasks",
    "created_at": "2026-07-04T10:05:00Z"
  }
}
```

### Delete Project
**Method:** `DELETE`  
**Path:** `/projects/:id`  
**Description:** Delete a project and all its associated queues and jobs.

**Response Example:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

## Queues

### List Queues
**Method:** `GET`  
**Path:** `/projects/:projectId/queues`  
**Description:** Retrieve all queues belonging to a specific project.

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "q1-uuid",
      "name": "high-priority-emails",
      "priority": 10,
      "concurrency_limit": 5,
      "status": "active",
      "strategy": "exponential",
      "max_attempts": 5,
      "delay_seconds": 10
    }
  ]
}
```

### Create Queue
**Method:** `POST`  
**Path:** `/projects/:projectId/queues`  
**Description:** Create a new job queue in a project with a specific retry policy.

**Request Body:**
```json
{
  "name": "video-processing",
  "priority": 5,
  "concurrency_limit": 2,
  "retry_policy": {
    "strategy": "exponential",
    "max_attempts": 3,
    "delay_seconds": 60
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "q2-uuid",
    "name": "video-processing",
    "status": "active"
  }
}
```

### Update Queue
**Method:** `PATCH`  
**Path:** `/queues/:id`  
**Description:** Update a queue's configuration.

**Request Body:**
```json
{
  "priority": 8,
  "concurrency_limit": 10,
  "status": "active"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "q1-uuid",
    "priority": 8,
    "concurrency_limit": 10,
    "status": "active"
  }
}
```

### Pause Queue
**Method:** `POST`  
**Path:** `/queues/:id/pause`  
**Description:** Pauses job execution for the queue (status = `paused`).

**Response Example:**
```json
{
  "success": true,
  "message": "Queue paused successfully"
}
```

### Resume Queue
**Method:** `POST`  
**Path:** `/queues/:id/resume`  
**Description:** Resumes job execution for the queue (status = `active`).

**Response Example:**
```json
{
  "success": true,
  "message": "Queue resumed successfully"
}
```

### Queue Stats
**Method:** `GET`  
**Path:** `/queues/:id/stats`  
**Description:** Get current job count grouped by status for a specific queue.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "queued": 45,
      "running": 5,
      "completed": 1204,
      "failed": 12
    }
  }
}
```

---

## Jobs

### Create Job(s)
**Method:** `POST`  
**Path:** `/queues/:queueId/jobs`  
**Description:** Enqueue one or multiple jobs. Supports immediate execution, delayed execution, and cron schedules.

#### Example 1: Immediate Execution
```json
{
  "type": "send-email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome!"
  },
  "priority": 10
}
```

#### Example 2: Delayed Execution
```json
{
  "type": "generate-report",
  "payload": { "reportId": 123 },
  "scheduled_at": "2026-07-05T00:00:00Z"
}
```

#### Example 3: Cron Schedule
```json
{
  "type": "daily-cleanup",
  "payload": {},
  "cron_expression": "0 0 * * *"
}
```

#### Example 4: Batch Jobs (Array)
```json
[
  { "type": "process-image", "payload": { "id": 1 } },
  { "type": "process-image", "payload": { "id": 2 } },
  { "type": "process-image", "payload": { "id": 3 } }
]
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "j1-uuid",
    "type": "send-email",
    "status": "queued"
  }
}
```

### List Jobs
**Method:** `GET`  
**Path:** `/queues/:queueId/jobs`  
**Description:** List jobs in a queue with optional status filtering and pagination.
**Query Parameters:** `?page=1&limit=20&status=failed`

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "j1-uuid",
      "type": "send-email",
      "status": "failed",
      "priority": 10,
      "attempt_count": 3,
      "created_at": "2026-07-04T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Get Job Details
**Method:** `GET`  
**Path:** `/jobs/:id`  
**Description:** Fetch full details of a specific job, including its payload, execution history, and logs.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "j1-uuid",
    "type": "send-email",
    "status": "failed",
    "attempt_count": 3,
    "payload": { "to": "user@example.com" },
    "executions": [
      {
        "attempt_number": 1,
        "worker_id": "w1-uuid",
        "status": "failed",
        "started_at": "2026-07-04T10:01:00Z",
        "error_message": "Connection timeout"
      }
    ],
    "logs": [
      {
        "level": "error",
        "message": "Failed to connect to SMTP server",
        "created_at": "2026-07-04T10:01:05Z"
      }
    ]
  }
}
```

### Retry Job
**Method:** `POST`  
**Path:** `/jobs/:id/retry`  
**Description:** Manually reset a failed or dead job back to `queued` status to be processed again.

**Response Example:**
```json
{
  "success": true,
  "message": "Job re-queued successfully"
}
```

### Delete Job
**Method:** `DELETE`  
**Path:** `/jobs/:id`  
**Description:** Permanently delete a job.

**Response Example:**
```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

---

## Workers

### List Workers
**Method:** `GET`  
**Path:** `/workers`  
**Description:** Retrieve all active and offline workers, including their live status, heartbeat timestamps, and the number of jobs they are currently running.

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "w1-uuid",
      "hostname": "worker-node-01",
      "status": "busy",
      "current_job_count": 2,
      "last_heartbeat_at": "2026-07-04T10:15:30Z",
      "registered_at": "2026-07-04T08:00:00Z"
    }
  ]
}
```

### Get Worker Details
**Method:** `GET`  
**Path:** `/workers/:id`  
**Description:** Get detailed information about a worker, including an array of the specific jobs it is currently executing.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "w1-uuid",
    "hostname": "worker-node-01",
    "status": "busy",
    "current_jobs": [
      {
        "id": "j1-uuid",
        "type": "send-email",
        "status": "running"
      }
    ]
  }
}
```

---

## Dead Letter Queue (DLQ)

### List DLQ Entries
**Method:** `GET`  
**Path:** `/dlq`  
**Description:** List all jobs that have exhausted their retry attempts and have been permanently parked. Supports pagination via `?page=1&limit=20`.

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dlq1-uuid",
      "job_id": "j1-uuid",
      "job_type": "send-email",
      "queue_name": "high-priority-emails",
      "total_attempts": 5,
      "failure_reason": "SMTP Authentication Failed",
      "failed_at": "2026-07-04T10:10:00Z"
    }
  ],
  "total": 1
}
```

### Retry DLQ Job
**Method:** `POST`  
**Path:** `/dlq/:id/retry`  
**Description:** Remove a job from the DLQ and move it back into its original queue as `queued` for processing.

**Response Example:**
```json
{
  "success": true,
  "message": "Job re-queued successfully"
}
```

---

## Stats

### Global Dashboard Stats
**Method:** `GET`  
**Path:** `/stats`  
**Description:** Retrieve high-level aggregate statistics for the entire system, suitable for dashboard visualization.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "total_jobs": 1261,
    "jobs_by_status": {
      "queued": 45,
      "running": 5,
      "completed": 1204,
      "failed": 7
    },
    "active_workers": 3,
    "throughput_last_hour": 850,
    "failed_last_hour": 2,
    "queues_summary": [
      {
        "queue_name": "high-priority-emails",
        "total_jobs": 1000,
        "pending": 20,
        "running": 3,
        "failed": 2
      },
      {
        "queue_name": "video-processing",
        "total_jobs": 261,
        "pending": 25,
        "running": 2,
        "failed": 5
      }
    ]
  }
}
```
