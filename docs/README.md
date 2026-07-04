# Distributed Job Scheduler

## Project Overview
A production-inspired distributed job scheduling platform that reliably executes async background jobs across multiple workers. Built to handle robust job queues with priority, concurrency limits, and retry policies, this system guarantees atomic job execution and handles worker failures gracefully.

## Tech Stack
* **Backend**: Node.js, Express.js
* **Database**: PostgreSQL
* **Frontend**: React, Vite, Tailwind CSS, Recharts
* **Auth**: JWT
* **Job scheduling**: node-cron

## Architecture Overview
The system follows a standard distributed architecture: 
**Client** → **API Server** → **PostgreSQL (job queue)** → **Worker Pool** → **Dead Letter Queue**. 

Clients submit jobs to the API, which persists them in PostgreSQL. The worker pool continuously polls the database to claim and execute pending jobs atomically. Any jobs that exhaust their retry attempts are safely routed to a Dead Letter Queue (DLQ) for manual inspection and retry.

## Prerequisites
* Node.js v18+
* PostgreSQL 14+
* npm

## Setup Instructions

**Backend:**
```bash
git clone <repo>
cd backend
npm install
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET in .env
psql -U postgres -d your_db -f src/db/schema.sql
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:3000
npm run dev
```

**Worker:**
```bash
cd backend
node src/workers/worker.js
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `PORT` | No | API server port (default 3000) |
| `VITE_API_URL` | Yes (frontend) | Backend API base URL |

## API Endpoints Summary

| Category | Method | Endpoint |
|----------|--------|----------|
| **Auth** | POST | `/api/auth/register` |
| | POST | `/api/auth/login` |
| **Projects** | GET | `/api/projects` |
| | POST | `/api/projects` |
| | DELETE | `/api/projects/:id` |
| **Queues** | GET | `/api/projects/:projectId/queues` |
| | POST | `/api/projects/:projectId/queues` |
| | PATCH | `/api/queues/:id` |
| | POST | `/api/queues/:id/pause` |
| | POST | `/api/queues/:id/resume` |
| | GET | `/api/queues/:id/stats` |
| **Jobs** | POST | `/api/queues/:queueId/jobs` |
| | GET | `/api/queues/:queueId/jobs` |
| | GET | `/api/jobs/:id` |
| | DELETE | `/api/jobs/:id` |
| | POST | `/api/jobs/:id/retry` |
| **Workers** | GET | `/api/workers` |
| | GET | `/api/workers/:id` |
| **DLQ** | GET | `/api/dlq` |
| | POST | `/api/dlq/:id/retry` |
| **Stats** | GET | `/api/stats` |

## Key Design Decisions
* **Atomic Job Claiming:** Utilizes PostgreSQL's `SELECT FOR UPDATE SKIP LOCKED` for lock-free, atomic job claiming, ensuring no two concurrent workers ever pick the same job.
* **PostgreSQL as DB & Queue:** Eliminates the need for an external broker (like Redis or RabbitMQ) by using PostgreSQL as both the primary database and the job queue, maintaining transactional integrity.
* **Exponential Backoff:** Implements robust retry strategies (fixed, linear, exponential) for failing jobs before moving them to the Dead Letter Queue.
* **Dead Worker Recovery:** Workers emit periodic heartbeats; a background cron task automatically detects heartbeat timeouts to recover jobs from crashed or dead workers.
