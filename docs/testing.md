# Testing Documentation
sdfdsdfdsfdfdfdsfdfdfdffdf
This document outlines the testing strategy, automated test suites, and manual testing procedures used to verify the Distributed Job Scheduler.

## Automated Test Suites (Backend)

We use **Jest** and **Supertest** for automated integration and unit testing. The test suite spins up the Express application and interacts with a live (or isolated) PostgreSQL test database to ensure full end-to-end reliability.

### 1. Integration Tests
Integration tests cover the full lifecycle of entities via the REST API:
- **Projects (`projects.test.js`):** Creating, listing, and deleting projects.
- **Queues (`queue.test.js`):** Creating queues, enforcing retry policies, updating concurrency limits, and parsing stats.
- **Jobs (`jobs.test.js`):** Enqueueing immediate, delayed, and cron jobs. Validating batch insertions and input sanitization.

### 2. Role-Based Access Control (RBAC) Testing
Tested heavily via integration tests to ensure data isolation.
- **Owner Privileges:** Verified owners can delete projects and manage members.
- **Admin/Viewer Privileges:** Verified they can read/write to jobs and queues but cannot delete projects.
- **Unauthorized Access:** Ensured cross-tenant access is blocked (e.g., User A cannot read User B's queues).

### 3. Rate Limiting Testing
Rate limits were tested using artillery/supertest scripts (`test-rate-limit.js`) to ensure:
- Auth routes reject after 10 requests / 15m.
- Job creation rejects after 30 requests / 1m.
- General dashboard read endpoints bypass the limit to prevent UI freezing.

### 4. WebSocket Testing
WebSockets were tested via socket client scripts to verify:
- Clients connect and join specific user-scoped rooms.
- PostgreSQL `LISTEN/NOTIFY` triggers successfully emit `job:completed`, `job:failed`, and `queue:created` events.
- Disconnections are handled gracefully.

### 5. Gemini AI Summary Testing
Tested by forcing a job to exhaust retries and enter the DLQ. 
- Verified the `aiSummaryService.js` makes the external API call to Google Gemini.
- Verified parsing of the Markdown response.
- Tested fallback mechanisms (if Gemini API is down, a default summary is saved instead of throwing an error).

### 6. Worker Testing (`worker.test.js`)
Worker logic is isolated and tested extensively:
- **Atomic Claiming:** Spawning multiple concurrent worker instances and verifying no duplicate job executions occur.
- **Heartbeats:** Verifying workers successfully write their `beat_at` timestamp every 15 seconds.
- **Recovery:** Forcing a worker crash and verifying the background `recoverDeadJobs` cron picks up the stranded job.

### 7. Dead Letter Queue (DLQ) Testing (`dlq.test.js`)
- Verified jobs correctly decrement `attempt_count` and move to DLQ when exhausted.
- Verified the `POST /api/dlq/:id/retry` endpoint successfully moves the job back to the `jobs` table with reset attempt counters.

---

## Final Automated Test Results

The full suite was run before production deployment, resulting in a 100% pass rate.

```text
> distributed-job-scheduler@1.0.0 test
> jest --runInBand

PASS tests/queue.test.js
PASS tests/worker.test.js
PASS tests/projects.test.js
PASS tests/jobs.test.js
PASS tests/auth.test.js
PASS tests/dlq.test.js

Test Suites: 6 passed, 6 total
Tests:       31 passed, 31 total
Snapshots:   0 total
Time:        12.156 s, estimated 26 s
Ran all test suites.
```

---

## Manual Testing Steps

For exploratory testing and UI verification, the following manual steps were followed:

1. **Authentication Flow:**
   - Register a new account, login, and verify JWT is stored in `localStorage`.
   - Clear storage and verify automatic logout.
2. **Project Creation & RBAC:**
   - Create a project as User A.
   - Use the UI to add User B as an `admin` and User C as a `viewer`.
   - Log in as User B using an Incognito window and verify the project appears and queues can be created.
   - Log in as User C and verify the project is read-only.
3. **Job Lifecycle & WebSockets:**
   - Create a queue. Submit 5 immediate jobs.
   - Watch the Dashboard line chart and Queues summary table update in real-time (via WebSockets) as a background worker processes them.
4. **DLQ & AI Summaries:**
   - Submit a job designed to fail (e.g. invalid payload).
   - Wait for it to exhaust all retries.
   - Navigate to the Dead Letter Queue page, click the job, and read the Gemini AI-generated failure summary.
   - Click "Retry Job" and verify it re-enters the main queue.
