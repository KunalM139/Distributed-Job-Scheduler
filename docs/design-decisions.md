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

## Decision 3: Retry Strategies (Fixed, Linear, Exponential Backoff)

**Context:** Jobs often fail due to transient network issues or downstream service unavailability and need to be retried automatically.  
**Alternatives Considered:** Fixed delay only, immediate retry, or no built-in retry mechanism.  
**Choice:** Three configurable retry strategies (fixed, linear, exponential) are available per queue.  
**Trade-offs:** Different job types require different retry behaviors. Exponential backoff is particularly critical to prevent the "thundering herd" problem; if a downstream service goes down, jobs will gradually back off, ensuring the system doesn't overwhelm the service with retry requests when it comes back online.

## Decision 4: Dead Worker Recovery via Heartbeat Timeout

**Context:** Worker processes can crash or get disconnected from the network abruptly while holding jobs in a "running" state, leaving those jobs stranded.  
**Alternatives Considered:** TCP connection monitoring at the database level, lease-based locking mechanisms.  
**Choice:** Workers send heartbeats every 15s. A background process checks for workers with no heartbeat in 45s and automatically re-queues their stranded jobs.  
**Trade-offs:** This approach is simple, highly reliable, and works across network failures and silent process crashes. The 45-second window offers a solid balance between recovering jobs quickly and avoiding false positives caused by temporary network latency.

## Decision 5: Separate Dead Letter Queue (DLQ) Table

**Context:** When jobs exhaust all their configured retry attempts, they must be parked for manual intervention without cluttering the active system.  
**Alternatives Considered:** Keeping dead jobs in the main `jobs` table with `status='dead'`, or simply deleting permanently failed jobs.  
**Choice:** Permanently failed jobs are moved to a separate DLQ table.  
**Trade-offs:** Separating dead jobs keeps the active `jobs` table clean and fast for high-throughput queries. DLQ entries can then be independently inspected, bulk-deleted, or replayed back into the active queue without impacting live job processing performance.

## Decision 6: Job Execution History in a Separate Table

**Context:** We need to keep a historical record of job attempts to understand failures and track execution trends.  
**Alternatives Considered:** Storing attempt history as a JSON array on the job row itself, or overwriting error metadata on each retry (losing past history).  
**Choice:** Every attempt is logged as a distinct row in a `job_executions` table.  
**Trade-offs:** This provides a comprehensive audit trail. Administrators can see exactly which worker ran which attempt, the exact timestamps for start/finish, and the precise error message. While this uses more database storage, it is critical for debugging production issues and providing clear observability.

## Decision 7: WebSockets with Polling Fallback for Frontend Dashboard

**Context:** The React dashboard needs to display near real-time statistics and live worker statuses.  
**Alternatives Considered:** HTTP Long-Polling, Server-Sent Events (SSE).  
**Choice:** The dashboard maintains a persistent Socket.IO connection. The backend uses PostgreSQL `LISTEN/NOTIFY` to instantly bridge isolated background worker events to the Express Socket server. Crucially, the frontend retains an HTTP polling `setInterval` as an automatic fallback.  
**Trade-offs:** Implementing WebSockets requires stateful connection management and a pub/sub bridge (achieved cleanly via Postgres) to connect external worker processes. However, it provides a superior 60fps real-time UX without spamming the database with HTTP polling requests. Retaining the 10-second polling mechanism as a graceful fallback ensures that if the WebSocket drops, the UI remains highly resilient and perfectly synchronized.
