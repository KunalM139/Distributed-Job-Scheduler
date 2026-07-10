-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'VIEWER')),
  created_at  TIMESTAMP DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS retry_policies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy            VARCHAR(20) NOT NULL CHECK (strategy IN ('fixed', 'linear', 'exponential')),
  max_attempts        INT DEFAULT 3,
  delay_seconds       INT DEFAULT 5,
  backoff_multiplier  FLOAT DEFAULT 2.0
);

CREATE TABLE IF NOT EXISTS queues (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  retry_policy_id   UUID REFERENCES retry_policies(id) ON DELETE SET NULL,
  name              VARCHAR(255) NOT NULL,
  priority          INT DEFAULT 0,
  concurrency_limit INT DEFAULT 5,
  status            VARCHAR(20) DEFAULT 'active',
  created_at        TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_id      UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  type          VARCHAR(255) NOT NULL,
  payload       JSONB,
  status        VARCHAR(20) DEFAULT 'queued',
  priority      INT DEFAULT 0,
  attempt_count INT DEFAULT 0,
  scheduled_at  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_id        UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  cron_expression VARCHAR(100) NOT NULL,
  job_type        VARCHAR(255) NOT NULL,
  payload         JSONB,
  last_run_at     TIMESTAMP,
  next_run_at     TIMESTAMP,
  is_active       BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS job_executions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id         UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id      UUID,
  status         VARCHAR(20) NOT NULL,
  attempt_number INT NOT NULL,
  started_at     TIMESTAMP,
  finished_at    TIMESTAMP,
  error_message  TEXT
);

CREATE TABLE IF NOT EXISTS job_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  level      VARCHAR(20) NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostname          VARCHAR(255) NOT NULL,
  status            VARCHAR(20) DEFAULT 'idle',
  current_job_count INT DEFAULT 0,
  registered_at     TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS worker_heartbeats (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  beat_at   TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id         UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  queue_id       UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  failure_reason TEXT,
  total_attempts INT NOT NULL,
  failed_at      TIMESTAMP DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_jobs_status_scheduled_at
  ON jobs (status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_jobs_queue_id
  ON jobs (queue_id);

CREATE INDEX IF NOT EXISTS idx_worker_heartbeats_worker_beat
  ON worker_heartbeats (worker_id, beat_at);
