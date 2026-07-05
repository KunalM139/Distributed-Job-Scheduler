# Design Decisions

This document outlines the key architectural and design choices made while building the Distributed Job Scheduler.

## Decision 1: PostgreSQL as the Job Queue

**Context:** We needed a reliable datastore to hold jobs waiting to be executed, track their status, and manage the queue state.  
**Alternatives Considered:** Redis (Bull/BullMQ), RabbitMQ, Amazon SQS.  
**Choice:** Used PostgreSQL's `SELECT FOR UPDATE SKIP LOCKED` instead of a dedicated message broker.  
**Trade-offs:** We chose PostgreSQL because it eliminates an extra infrastructure dependency, provides strong ACID guarantees, and allows us to easily inspect the queue state using standard SQL queries. Keeping jobs and application data in a single system simplifies operations (no extra service to manage). The primary trade-off is lower peak throughput compared to in-memory brokers like Redis at massive scale, but this is entirely acceptable for this use case.

## Decision 2: Atomic Job Claiming with `SELECT FOR UPDATE SKIP LOCKED`

**Context:** Multiple worker processes need to concurrently pull jobs from the database without accidentally claiming the same job twice.  
**Alternatives Considered:** Optimistic locking (check-then-update), application-level locking mechanisms, distributed Redis locks.  
**Choice:** Workers claim jobs inside a database transaction using the `SELECT FOR UPDATE SKIP LOCKED` pattern.  
**Trade-offs:** This choice prevents duplicate execution with zero application-level coordination. The `SKIP LOCKED` clause means workers skip jobs that are already locked by other active workers instead of blocking and waiting. This maximizes worker throughput and ensures atomic claiming seamlessly.

## Decision 3: Worker Architecture and Concurrency Model

**Context:** How should workers process jobs efficiently?
**Alternatives Considered:** Single-threaded execution, one worker per job, thread pools.
**Choice:** A Node.js worker pool where each worker claims up to `N` jobs (respecting the queue's concurrency limit) and executes them asynchronously via `Promise.allSettled`.
**Trade-offs:** Node.js's event loop makes it highly efficient at handling I/O-bound jobs concurrently. CPU-bound jobs might block the event loop, but for a general-purpose async job scheduler, this model maximizes throughput per worker process while preventing memory exhaustion.

## Decision 4: Retry Strategies (Fixed, Linear, Exponential Backoff)

**Context:** Jobs often fail due to transient network issues or downstream service unavailability and need to be retried automatically.  
**Choice:** Three configurable retry strategies (fixed, linear, exponential) are available per queue.  
**Trade-offs:** Different job types require different retry behaviors. Exponential backoff is particularly critical to prevent the "thundering herd" problem; if a downstream service goes down, jobs will gradually back off, ensuring the system doesn't overwhelm the service with retry requests when it comes back online.

## Decision 5: Dead Worker Recovery via Heartbeat Timeout

**Context:** Worker processes can crash or get disconnected from the network abruptly while holding jobs in a "running" state, leaving those jobs stranded.  
**Choice:** Workers send heartbeats every 15s. A background process checks for workers with no heartbeat in 45s and automatically re-queues their stranded jobs.  
**Trade-offs:** This approach is simple, highly reliable, and works across network failures and silent process crashes. The 45-second window offers a solid balance between recovering jobs quickly and avoiding false positives caused by temporary network latency.

## Decision 6: Separate Dead Letter Queue (DLQ) Table

**Context:** When jobs exhaust all their configured retry attempts, they must be parked for manual intervention.  
**Choice:** Permanently failed jobs are moved to a separate DLQ table.  
**Trade-offs:** Separating dead jobs keeps the active `jobs` table clean and fast for high-throughput queries. DLQ entries can then be independently inspected, bulk-deleted, or replayed back into the active queue without impacting live job processing performance.

## Decision 7: Role-Based Access Control (RBAC) Design

**Context:** How should users access and share projects?
**Alternatives Considered:** Global admin roles, ownership-only models.
**Choice:** A `project_members` mapping table that links users to projects with specific roles: `owner`, `admin`, and `viewer`. All API endpoints enforce these roles via middleware.
**Trade-offs:** This allows granular control for team collaboration. It adds slight complexity to database queries (requiring joins on `project_members`), but provides a robust, multi-tenant environment.

## Decision 8: WebSockets for Real-Time Updates

**Context:** The dashboard needs to display live job status and worker health.
**Alternatives Considered:** HTTP Polling, Server-Sent Events (SSE).
**Choice:** Implemented Socket.IO combined with PostgreSQL `LISTEN/NOTIFY`. The database uses triggers to emit events to a channel, which the Node.js server listens to and broadcasts over WebSockets to the React frontend.
**Trade-offs:** WebSockets provide instant UI updates with far less overhead than polling every few seconds. It adds a slight operational overhead (managing WebSocket connections), but the user experience is drastically improved.

## Decision 9: Gemini AI Integration for Failure Summaries

**Context:** Users need help debugging jobs that land in the DLQ.
**Choice:** We integrated the Google Gemini AI API to automatically analyze job failure reasons and provide actionable summaries when a job is moved to the DLQ.
**Trade-offs:** Provides massive value by reducing debugging time. The trade-off is an external API dependency and potential latency during the DLQ transfer, handled gracefully by falling back to a default message if the API fails.

## Decision 10: Rate Limiting

**Context:** Protecting the API from abuse or misbehaving clients.
**Choice:** Implemented `express-rate-limit`. We use a strict limiter for `/api/auth` (10 req/15m), a job creation limiter (30 req/m), and a general limiter (100 req/15m) that intentionally exempts read-only GET requests used by the frontend.
**Trade-offs:** Prevents brute-force attacks and queue flooding while ensuring the frontend dashboard remains snappy and responsive.

## Decision 11: Database Indexing & Scalability Considerations

**Context:** How to ensure the system remains fast as millions of jobs are processed.
**Choice:** We indexed heavily queried columns: `(status, scheduled_at)` on `jobs`, `(worker_id, beat_at)` on `worker_heartbeats`, and foreign keys (`queue_id`, `project_id`).
**Trade-offs:** Indexes speed up `SELECT FOR UPDATE` and UI queries dramatically, at the cost of slightly slower `INSERT/UPDATE` operations. As the system scales, archiving or partitioning the `job_executions` and `job_logs` tables will be necessary to prevent unbounded disk growth.

## Future Improvements

- **Redis Caching:** Introduce Redis for caching high-traffic endpoints (e.g., dashboard stats) if PostgreSQL CPU load becomes a bottleneck.
- **Worker Auto-Scaling:** Deploy workers inside Kubernetes pods with Horizontal Pod Autoscaling (HPA) based on queue depth metrics.
- **Partitioning:** Implement PostgreSQL table partitioning for `jobs` and `job_executions` by date.
- **Alerting:** Integrate webhooks, Slack, or email notifications when a job enters the DLQ.
