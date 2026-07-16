# Distributed Job Scheduler
jgujyjurdf
## Project Overview
A production-ready distributed job scheduling platform that reliably executes async background jobs across multiple workers. Built to handle robust job queues with priority, concurrency limits, and dynamic retry policies, this system guarantees atomic job execution and handles worker failures gracefully.

## Key Features
- **Job Scheduling:** Immediate, delayed, scheduled (cron), and batch jobs.
- **Worker Pool:** Multiple worker processes running concurrently, claiming jobs atomically to prevent duplicates.
- **Robust Retry Policies:** Fixed, linear, and exponential backoff retry strategies for failing jobs.
- **Dead Letter Queue (DLQ):** Automatically quarantines permanently failed jobs for manual inspection and retry.
- **AI Failure Summaries:** Integrates with Gemini AI to provide actionable summaries of why jobs failed in the DLQ.
- **Role-Based Access Control (RBAC):** Projects support Owners, Admins, and Viewers with distinct permissions.
- **Rate Limiting:** Protects the API from abuse with global and auth-specific rate limiters.
- **Real-Time Dashboard:** A React-based frontend providing live queue health, worker status, job logs, and overall system metrics powered by WebSockets.

## Technology Stack
* **Backend**: Node.js, Express.js
* **Database**: PostgreSQL (serves as both datastore and job queue)
* **Frontend**: React, Vite, Tailwind CSS, Recharts
* **Real-time Updates**: Socket.IO
* **Auth**: JWT
* **Job scheduling**: node-cron
* **Testing**: Jest, Supertest

## System Architecture

The system follows a scalable distributed architecture: 
**Client** → **API Server** → **PostgreSQL (job queue)** → **Worker Pool** → **Dead Letter Queue**. 

![Architecture Diagram](./architecture-diagram.png)

Clients submit jobs to the API, which persists them in PostgreSQL. The worker pool continuously polls the database to claim and execute pending jobs atomically via `SELECT ... FOR UPDATE SKIP LOCKED`. Workers emit heartbeats to indicate health; crashed workers have their running jobs automatically recovered. Any jobs that exhaust their retry attempts are safely routed to a Dead Letter Queue (DLQ) for manual inspection and retry.

## Entity Relationship Diagram (Database Schema)

The PostgreSQL database relies on 11 core tables tightly coupled via foreign keys to ensure referential integrity.

![ER Diagram](./er-diagram.png)

## Prerequisites
* Node.js v18+
* PostgreSQL 14+
* npm

## Installation & Setup

**1. Clone and Install**
```bash
git clone <repo>
cd backend
npm install
cd ../frontend
npm install
```

**2. Environment Variables**
Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories.
- **Backend (`.env`)**:
  - `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://postgres:password@localhost:5432/job_scheduler`)
  - `JWT_SECRET`: Secret key for signing tokens
  - `PORT`: API server port (default 3000)
  - `GEMINI_API_KEY`: API key for Gemini AI failure summaries
- **Frontend (`.env`)**:
  - `VITE_API_URL`: Backend API base URL (default `http://localhost:3000`)

**3. Database Initialization**
```bash
psql -U postgres -d your_db -f src/db/schema.sql
```

## Running the Application

**Running Backend:**
```bash
cd backend
npm run dev
```

**Running Frontend:**
```bash
cd frontend
npm run dev
```

**Running Workers:**
Start one or more workers in separate terminal windows to process jobs:
```bash
cd backend
node src/workers/worker.js
```

**Running Tests:**
```bash
cd backend
npm test
```

## Folder Structure
```text
distributed-job-scheduler/
  /backend
    /src
      /routes         → API endpoints
      /controllers    → Business logic
      /middleware     → JWT, RBAC, Rate Limiting, Validation
      /models         → Database queries
      /workers        → Core job execution engine
      /services       → Retry logic, heartbeats, cron, AI summaries, websockets
      /db             → Connection pooling and schema
    /tests            → Jest test suites
    server.js
  /frontend
    /src
      /pages          → React views (Dashboard, Queues, Workers, DLQ)
      /components     → Modals, layouts
      /services       → Axios API client
      /context        → Auth & Socket contexts
      /hooks          → Live polling and socket event hooks
```

## API Overview
The REST API is secured with JWT authentication and RBAC. For full details, see `api-docs.md`.
- **Auth**: `/api/auth/register`, `/api/auth/login`
- **Projects**: `/api/projects`, `/api/projects/:id/members`
- **Queues**: `/api/projects/:projectId/queues`, `/api/queues/:id`
- **Jobs**: `/api/queues/:queueId/jobs`, `/api/jobs/:id`, `/api/jobs/:id/retry`
- **Workers**: `/api/workers`, `/api/workers/:id`
- **DLQ**: `/api/dlq`, `/api/dlq/:id/retry`
- **Stats**: `/api/stats`

## Bonus Features Implemented
- **Role-Based Access Control (RBAC):** Granular permissions for project Owners, Admins, and Viewers.
- **AI Failure Analysis:** Gemini AI automatically analyzes DLQ job failures and suggests fixes.
- **WebSocket Live Updates:** Instant UI updates when jobs complete or fail.
- **Rate Limiting:** Protects API routes from excessive polling and abuse.

## Key Design Decisions
* **Atomic Job Claiming:** Utilizes PostgreSQL's `SELECT FOR UPDATE SKIP LOCKED` for lock-free, atomic job claiming, ensuring no two concurrent workers ever pick the same job.
* **PostgreSQL as DB & Queue:** Eliminates the need for an external broker (like Redis or RabbitMQ) by using PostgreSQL as both the primary database and the job queue, maintaining transactional integrity.
* **Exponential Backoff:** Implements robust retry strategies (fixed, linear, exponential) for failing jobs before moving them to the Dead Letter Queue.
* **Dead Worker Recovery:** Workers emit periodic heartbeats; a background cron task automatically detects heartbeat timeouts to recover jobs from crashed or dead workers.
* **Cross-Process WebSockets:** Uses PostgreSQL's native `LISTEN/NOTIFY` to bridge isolated background worker terminal processes to the main Express Socket.IO server, providing a 60fps real-time monitoring experience without external brokers like Redis.
