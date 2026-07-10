# Project Summary: Distributed Job Scheduler

This document serves as the living reference for the Distributed Job Scheduler project. It should be updated whenever major architectural, structural, or database changes are introduced.

## 1. Project Context
A full-stack, production-inspired platform that reliably executes asynchronous background jobs across multiple workers. Built initially as an internship assignment for Codity.ai.

**What it does:**
Users log in, create Projects, and manage Queues within those projects. Jobs are submitted to Queues via a REST API. Worker processes continuously poll the database, atomically claim jobs, execute them, and write back the results. A React dashboard provides live queue health, worker status, job logs, and overall system metrics.

## 2. Tech Stack
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (serves as both datastore and job queue)
* **Frontend:** React, Vite, Tailwind CSS, Recharts
* **Real-time Engine:** Socket.IO with PostgreSQL LISTEN/NOTIFY
* **Authentication:** JWT (JSON Web Tokens)
* **Job Scheduling:** `node-cron`
* **Testing:** Jest, Supertest

## 3. Folder Structure
```text
distributed-job-scheduler/
  /backend
    /src
      /routes         → auth.js, projects.js, queues.js, jobs.js, workers.js, dlq.js, stats.js
      /controllers    → business logic for each route
      /middleware     → auth.js (JWT verification)
      /models         → DB query functions
      /workers        → worker.js (the job execution engine)
      /services       → retry logic, heartbeat, cron scheduler
      /db             → index.js (pg Pool connection), schema.sql
    package.json
    server.js
    .env
  /frontend
    /src
      /pages          → DashboardPage, QueuesPage, QueueDetailPage, WorkersPage, DeadLetterPage, LoginPage, RegisterPage
      /components     → Layout, JobDetailModal
      /services       → api.js (axios instance)
      /context        → AuthContext.jsx
      /hooks          → usePolling.js
    package.json
    main.jsx
    App.jsx
  /docs
    README.md
    design-decisions.md
    api-docs.md
    PROJECT_SUMMARY.md
    architecture-diagram.png
    er-diagram.png
  /tests
    auth.test.js
    jobs.test.js
    queue.test.js
    worker.test.js
    setup.js
```

## 4. Database Schema (PostgreSQL)
The system operates on 11 core tables:
1. **`users`**: `id` (uuid PK), `email` (unique), `password_hash`, `name`, `created_at`
2. **`projects`**: `id`, `user_id` (FK), `name`, `description`, `created_at`
3. **`retry_policies`**: `id`, `strategy` ('fixed' | 'linear' | 'exponential'), `max_attempts`, `delay_seconds`, `backoff_multiplier`
4. **`queues`**: `id`, `project_id` (FK), `retry_policy_id` (FK), `name`, `priority`, `concurrency_limit`, `status`, `created_at`
5. **`jobs`**: (Core Table) `id`, `queue_id` (FK), `type`, `payload` (JSONB), `status` ('queued' | 'scheduled' | 'running' | 'completed' | 'failed'), `priority`, `attempt_count`, `scheduled_at`, `created_at`. *Indexes on (status, scheduled_at) and queue_id.*
6. **`scheduled_jobs`**: `id`, `queue_id` (FK), `cron_expression`, `job_type`, `payload`, `last_run_at`, `next_run_at`, `is_active`
7. **`job_executions`**: `id`, `job_id` (FK), `worker_id`, `status`, `attempt_number`, `started_at`, `finished_at`, `error_message`
8. **`job_logs`**: `id`, `job_id` (FK), `level` ('info' | 'warn' | 'error'), `message`, `created_at`
9. **`workers`**: `id`, `hostname`, `status` ('idle' | 'busy' | 'offline'), `current_job_count`, `registered_at`
10. **`worker_heartbeats`**: `id`, `worker_id` (FK), `beat_at`. *Index on (worker_id, beat_at).*
11. **`dead_letter_queue`**: `id`, `job_id` (FK), `queue_id` (FK), `failure_reason`, `total_attempts`, `failed_at`

## 5. API Endpoints
*All routes (except `/auth/*`) require `Authorization: Bearer <token>`.*

* **Auth:** `POST /api/auth/register`, `POST /api/auth/login`
* **Projects:** `GET /api/projects`, `POST /api/projects`, `DELETE /api/projects/:id`
* **Queues:** `GET /api/projects/:projectId/queues`, `POST /api/projects/:projectId/queues`, `PATCH /api/queues/:id`, `POST /api/queues/:id/pause`, `POST /api/queues/:id/resume`, `GET /api/queues/:id/stats`
* **Jobs:** `POST /api/queues/:queueId/jobs` (immediate, delayed, cron, batch), `GET /api/queues/:queueId/jobs`, `GET /api/jobs/:id`, `POST /api/jobs/:id/retry`, `DELETE /api/jobs/:id`
* **Workers:** `GET /api/workers`, `GET /api/workers/:id`
* **DLQ:** `GET /api/dlq`, `POST /api/dlq/:id/retry`
* **Stats:** `GET /api/stats`

## 6. Job Lifecycle
`Queued` → `Claimed` → `Running` → `Completed`
*If failed and retries remain:* `Queued` (with backoff delay)
*If failed and max retries exceeded:* `Failed` → `Dead Letter Queue`

## 7. How the Worker Works (The Core Engine)
Located in `/backend/src/workers/worker.js`.
1. **Registration:** Registers itself in the `workers` table on startup.
2. **Heartbeats:** Emits a heartbeat every 15 seconds into `worker_heartbeats`.
3. **Atomic Claiming:** Polls every 2 seconds using `SELECT ... FOR UPDATE SKIP LOCKED` inside a transaction. This ensures no two workers can claim the same job, and prevents blocking.
4. **Execution:** Calls `executeJob()`. On success, updates job to `completed` and logs it.
5. **Retries:** On failure, if `attempt_count < max_attempts`, re-queues the job with a new `scheduled_at` based on the queue's retry strategy (fixed, linear, exponential). Otherwise, moves it to the DLQ.
6. **Recovery:** Every 30 seconds, a cleanup task sweeps for jobs marked `running` assigned to a worker that hasn't emitted a heartbeat in >45 seconds. It resets them to `queued`.
7. **Cron:** Checks `scheduled_jobs` every minute to spawn new recurring jobs.

## 8. Frontend Pages
* **DashboardPage:** Stat cards, Bar chart (jobs by status), live polling (10s) line chart for throughput, queues summary table.
* **QueuesPage:** Configurable table of all queues (pause/resume). Create modal supports retry policy config.
* **QueueDetailPage:** Tabbed interface for listing jobs (paginated, filterable) and creating jobs (JSON payload, cron strings, delays).
* **JobDetailModal:** Extensive modal showing execution history, scrollable colored logs, and raw payload.
* **WorkersPage:** Live tracking of worker fleet, stale heartbeat detection, status badges.
* **DeadLetterPage:** Inspection and retry interface for permanently failed jobs.

## 9. Environment Variables
* **Backend (`.env`)**: `DATABASE_URL`, `JWT_SECRET`, `PORT`
* **Frontend (`.env`)**: `VITE_API_URL`

## 10. Key Design Decisions
1. **PostgreSQL as Queue:** Avoids managing extra infrastructure (Redis/RabbitMQ).
2. **`SKIP LOCKED`:** Enables high-throughput, lock-free distributed polling.
3. **Retry Strategies:** Exponential backoff mitigates thundering herd scenarios.
4. **Heartbeat Recovery:** Robustly handles silent worker crashes.
5. **Separate DLQ / Executions Tables:** Keeps the hot `jobs` table fast while preserving deep audit logs.
6. **WebSockets with Polling Fallback:** Uses PostgreSQL `LISTEN/NOTIFY` to bridge separate worker processes to the Express Socket.IO server for real-time dashboard updates, falling back to 10s HTTP polling for maximum resilience.
