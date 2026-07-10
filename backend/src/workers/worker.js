/**
 * Worker Service — Distributed Job Scheduler
 *
 * This is the heart of the system. Each worker process:
 *   1. Registers itself in the `workers` table on startup
 *   2. Sends heartbeats every 15 s
 *   3. Polls for jobs every 2 s, claiming them atomically with SELECT … FOR UPDATE SKIP LOCKED
 *   4. Executes claimed jobs (simulated), honouring per-queue concurrency limits
 *   5. Handles retries using the queue's retry policy (fixed / linear / exponential)
 *   6. Moves exhausted jobs to the dead-letter queue
 *   7. Processes cron-based scheduled_jobs every minute
 *   8. Recovers orphaned jobs from dead workers every 30 s
 *   9. Shuts down gracefully on SIGTERM / SIGINT
 */

const os = require('os');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
require('dotenv').config();

const db = require('../db');
const { emitEvent } = require('../services/emitHelper');
const { generateFailureSummary } = require('../services/aiSummaryService');

const emitWorkerEvent = async (eventName, data = {}) => {
  try {
    const payload = JSON.stringify({ event: eventName, data });
    await db.query(`SELECT pg_notify('socket_events', $1)`, [payload]);
  } catch (err) {
    // suppress to avoid flooding logs
  }
};

// ─── State ──────────────────────────────────────────────────────────────────────

let workerId = null;
const setWorkerId = (id) => { workerId = id; };
const getWorkerId = () => workerId;
let isShuttingDown = false;
let runningJobCount = 0;

// Track running job counts per queue so we can respect concurrency_limit
const queueRunningCounts = {}; // queueId → number
const queueLimits = {}; // queueId → limit (cached)

// Interval handles (so we can clear them on shutdown)
let pollInterval = null;
let heartbeatInterval = null;
let deadWorkerInterval = null;
let cronTask = null;

// ─── Logging helper ─────────────────────────────────────────────────────────────

const log = (msg, ...args) => {
  const ts = new Date().toISOString();
  console.log(`[Worker ${workerId ?? '??'}] [${ts}] ${msg}`, ...args);
};

// ─── 1. Worker Registration ─────────────────────────────────────────────────────

async function registerWorker() {
  const id = uuidv4();
  const hostname = os.hostname();

  await db.query(
    `INSERT INTO workers (id, hostname, status) VALUES ($1, $2, 'idle')`,
    [id, hostname]
  );

  workerId = id;
  log(`Registered — hostname=${hostname}`);
  await emitWorkerEvent('WORKER_REGISTERED', { workerId: id });
}

// ─── 2. Heartbeat (every 15 s) ─────────────────────────────────────────────────

async function sendHeartbeat() {
  try {
    const status = runningJobCount > 0 ? 'busy' : 'idle';

    await db.query(
      `INSERT INTO worker_heartbeats (id, worker_id, beat_at) VALUES ($1, $2, NOW())`,
      [uuidv4(), workerId]
    );

    await db.query(
      `UPDATE workers SET status = $1, current_job_count = $2 WHERE id = $3`,
      [status, runningJobCount, workerId]
    );

    await emitWorkerEvent('WORKER_HEARTBEAT', { workerId });
  } catch (err) {
    log('Heartbeat error:', err.message);
  }
}

// ─── 3. Atomic Job Claiming ─────────────────────────────────────────────────────

/**
 * Claims a single job atomically using SELECT … FOR UPDATE SKIP LOCKED inside a
 * transaction. Returns { job, execution } or null if nothing was available.
 */
async function claimJob() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Pre-calculate queues that have reached their concurrency limit
    const fullQueueIds = [];
    for (const [qId, count] of Object.entries(queueRunningCounts)) {
      if (count >= (queueLimits[qId] ?? 5)) {
        fullQueueIds.push(qId);
      }
    }

    let excludeClause = '';
    const queryParams = [];
    if (fullQueueIds.length > 0) {
      excludeClause = `AND j.queue_id != ALL($1::uuid[])`;
      queryParams.push(fullQueueIds);
    }

    // Find one eligible job, locking the row and skipping rows already locked
    // by other workers
    const jobResult = await client.query(
      `SELECT j.* FROM jobs j
       WHERE j.status = 'queued'
         AND (j.scheduled_at IS NULL OR j.scheduled_at <= NOW())
         AND j.queue_id IN (SELECT id FROM queues WHERE status = 'active')
         ${excludeClause}
       ORDER BY j.priority DESC, j.created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
      queryParams
    );

    if (jobResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const job = jobResult.rows[0];

    // ── Concurrency check ────────────────────────────────────────────────
    // Fetch queue's concurrency_limit and compare against our in-memory counter
    const queueResult = await client.query(
      `SELECT concurrency_limit FROM queues WHERE id = $1`,
      [job.queue_id]
    );

    const concurrencyLimit = queueResult.rows[0]?.concurrency_limit ?? 5;
    queueLimits[job.queue_id] = concurrencyLimit; // cache it for future exclusions
    const currentCount = queueRunningCounts[job.queue_id] || 0;

    if (currentCount >= concurrencyLimit) {
      // We can't run any more jobs in this queue right now
      await client.query('ROLLBACK');
      return null;
    }

    // ── Claim the job ────────────────────────────────────────────────────
    const newAttempt = job.attempt_count + 1;

    await client.query(
      `UPDATE jobs SET status = 'running', attempt_count = $1 WHERE id = $2`,
      [newAttempt, job.id]
    );

    const executionId = uuidv4();
    await client.query(
      `INSERT INTO job_executions (id, job_id, worker_id, status, attempt_number, started_at)
       VALUES ($1, $2, $3, 'running', $4, NOW())`,
      [executionId, job.id, workerId, newAttempt]
    );

    await client.query('COMMIT');

    job.attempt_count = newAttempt;
    await emitWorkerEvent('JOB_CLAIMED', { jobId: job.id, workerId });
    return { job, executionId };
  } catch (err) {
    await client.query('ROLLBACK');
    log('claimJob error:', err.message);
    return null;
  } finally {
    client.release();
  }
}

// ─── 4. Job Execution (simulated) ───────────────────────────────────────────────

/**
 * Simulates job work with a random 1–3 s delay and an 80 % success rate.
 */
function simulateWork() {
  return new Promise((resolve) => {
    const delay = 1000 + Math.random() * 2000; // 1–3 seconds
    setTimeout(() => {
      const success = Math.random() < 0.8;// 80 % success
      resolve(success);
    }, delay);
  });
}

async function executeJob(job, executionId) {
  const queueId = job.queue_id;

  // Bump per-queue running counter
  queueRunningCounts[queueId] = (queueRunningCounts[queueId] || 0) + 1;
  runningJobCount++;

  log(`Executing job ${job.id} (type=${job.type}, attempt=${job.attempt_count})`);
  await emitWorkerEvent('JOB_STARTED', { jobId: job.id });

  try {
    const success = await simulateWork();

    if (success) {
      await onJobSuccess(job, executionId);
    } else {
      await onJobFailure(job, executionId);
    }
  } catch (err) {
    log(`Unhandled execution error for job ${job.id}:`, err.message);
    try {
      await onJobFailure(job, executionId, err.message);
    } catch (innerErr) {
      log(`CRITICAL: Error in onJobFailure for job ${job.id}:`, innerErr.message);
    }
  } finally {
    // Decrement counters
    queueRunningCounts[queueId] = Math.max((queueRunningCounts[queueId] || 1) - 1, 0);
    runningJobCount--;
  }
}

// ─── 4a. Success handler ────────────────────────────────────────────────────────

async function onJobSuccess(job, executionId) {
  log(`Job ${job.id} completed successfully`);

  await db.query(
    `UPDATE jobs SET status = 'completed' WHERE id = $1`,
    [job.id]
  );

  await db.query(
    `UPDATE job_executions SET status = 'completed', finished_at = NOW() WHERE id = $1`,
    [executionId]
  );

  await db.query(
    `INSERT INTO job_logs (id, job_id, level, message)
     VALUES ($1, $2, 'info', $3)`,
    [uuidv4(), job.id, `Job completed successfully on attempt ${job.attempt_count}`]
  );

  await emitWorkerEvent('JOB_COMPLETED', { jobId: job.id, queueId: job.queue_id });
  await emitWorkerEvent('DASHBOARD_STATS_UPDATED');
}

// ─── 4b. Failure handler (with retry logic) ─────────────────────────────────────

async function onJobFailure(job, executionId, errorMsg) {
  const failureMessage = errorMsg || 'Simulated random failure';
  log(`Job ${job.id} failed: ${failureMessage}`);

  // Update the execution record
  await db.query(
    `UPDATE job_executions SET status = 'failed', finished_at = NOW(), error_message = $1 WHERE id = $2`,
    [failureMessage, executionId]
  );

  // Fetch the queue's retry policy
  const rpResult = await db.query(
    `SELECT rp.* FROM retry_policies rp
     JOIN queues q ON q.retry_policy_id = rp.id
     WHERE q.id = $1`,
    [job.queue_id]
  );

  const retryPolicy = rpResult.rows[0] || null;
  const maxAttempts = retryPolicy?.max_attempts ?? 3;

  if (job.attempt_count < maxAttempts) {
    // ── Retry ──────────────────────────────────────────────────────────
    const delaySeconds = computeRetryDelay(retryPolicy, job.attempt_count);
    const nextRunAt = new Date(Date.now() + delaySeconds * 1000);

    log(`Retrying job ${job.id} in ${delaySeconds}s (attempt ${job.attempt_count}/${maxAttempts})`);

    await db.query(
      `UPDATE jobs SET status = 'queued', scheduled_at = $1 WHERE id = $2`,
      [nextRunAt.toISOString(), job.id]
    );

    await db.query(
      `INSERT INTO job_logs (id, job_id, level, message)
       VALUES ($1, $2, 'warn', $3)`,
      [uuidv4(), job.id, `Attempt ${job.attempt_count} failed. Retrying in ${delaySeconds}s. Error: ${failureMessage}`]
    );

    await emitWorkerEvent('JOB_FAILED', { jobId: job.id, queueId: job.queue_id });
    await emitWorkerEvent('JOB_RETRIED', { jobId: job.id, queueId: job.queue_id });
    await emitWorkerEvent('DASHBOARD_STATS_UPDATED');
  } else {
    // ── Max retries exhausted → dead letter ──────────────────────────
    log(`Job ${job.id} exhausted all ${maxAttempts} attempts → dead-letter queue`);

    await db.query(
      `UPDATE jobs SET status = 'failed' WHERE id = $1`,
      [job.id]
    );

    // Generate AI Summary for the permanently failed job
    const aiSummary = await generateFailureSummary(job, failureMessage, job.attempt_count);

    await db.query(
      `INSERT INTO dead_letter_queue (id, job_id, queue_id, failure_reason, total_attempts, ai_summary)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), job.id, job.queue_id, failureMessage, job.attempt_count, JSON.stringify(aiSummary)]
    );

    await db.query(
      `INSERT INTO job_logs (id, job_id, level, message)
       VALUES ($1, $2, 'error', $3)`,
      [uuidv4(), job.id, `Job failed permanently after ${job.attempt_count} attempts. Moved to dead-letter queue. Error: ${failureMessage}`]
    );

    await emitWorkerEvent('JOB_FAILED', { jobId: job.id, queueId: job.queue_id });
    await emitWorkerEvent('JOB_MOVED_TO_DLQ', { jobId: job.id, queueId: job.queue_id });
    await emitWorkerEvent('DASHBOARD_STATS_UPDATED');
  }
}

/**
 * Compute delay in seconds based on the retry strategy.
 *
 *   fixed:       delay_seconds (constant)
 *   linear:      delay_seconds × attempt
 *   exponential: delay_seconds × (backoff_multiplier ^ (attempt - 1))
 */
function computeRetryDelay(policy, attempt) {
  if (!policy) return 5; // sane default

  const base = policy.delay_seconds ?? 5;
  const multiplier = policy.backoff_multiplier ?? 2.0;

  switch (policy.strategy) {
    case 'linear':
      return base * attempt;
    case 'exponential':
      return Math.round(base * Math.pow(multiplier, attempt - 1));
    case 'fixed':
    default:
      return base;
  }
}

// ─── 5. Polling Loop ────────────────────────────────────────────────────────────

async function poll() {
  if (isShuttingDown) return;

  try {
    let claimed = true;
    while (claimed && !isShuttingDown) {
      const result = await claimJob();
      if (result) {
        // Fire-and-forget — executeJob runs concurrently while we keep polling
        executeJob(result.job, result.executionId);
      } else {
        claimed = false;
      }
    }
  } catch (err) {
    log('Poll error:', err.message);
  }
}

// ─── 6. Scheduled Jobs (cron — every minute) ────────────────────────────────────

async function processScheduledJobs() {
  try {
    const result = await db.query(
      `SELECT * FROM scheduled_jobs
       WHERE is_active = true
         AND (next_run_at IS NULL OR next_run_at <= NOW())`
    );

    for (const sj of result.rows) {
      const jobId = uuidv4();

      await db.query(
        `INSERT INTO jobs (id, queue_id, type, payload, status, priority)
         VALUES ($1, $2, $3, $4, 'queued', 0)`,
        [jobId, sj.queue_id, sj.job_type, sj.payload ? JSON.stringify(sj.payload) : null]
      );

      // Compute next run from cron expression
      const nextRun = computeNextCronRun(sj.cron_expression);

      await db.query(
        `UPDATE scheduled_jobs SET last_run_at = NOW(), next_run_at = $1 WHERE id = $2`,
        [nextRun, sj.id]
      );

      log(`Scheduled job ${sj.id} fired → created job ${jobId} (next run: ${nextRun?.toISOString() ?? 'N/A'})`);
      await emitWorkerEvent('JOB_CREATED', { queueId: sj.queue_id });
      await emitWorkerEvent('DASHBOARD_STATS_UPDATED');
    }
  } catch (err) {
    log('processScheduledJobs error:', err.message);
  }
}

/**
 * Use node-cron's internal parser to figure out the next fire time.
 * Falls back to +60 s if parsing fails.
 */
function computeNextCronRun(cronExpression) {
  try {
    const task = cron.schedule(cronExpression, () => {}, { scheduled: false });

    // node-cron v4 exposes nextDate() which returns a Luxon DateTime
    if (typeof task.nextDate === 'function') {
      const nextDate = task.nextDate();
      task.stop();
      return nextDate.toJSDate ? nextDate.toJSDate() : new Date(nextDate);
    }

    task.stop();
  } catch (_) {
    // ignore parse errors
  }

  // Fallback: 60 seconds from now
  return new Date(Date.now() + 60_000);
}

// ─── 7. Dead Worker Recovery (every 30 s) ───────────────────────────────────────

/**
 * Finds any jobs still marked 'running' whose assigned worker hasn't sent a
 * heartbeat in the last 45 seconds, and re-queues them.
 */
async function recoverDeadWorkerJobs() {
  try {
    const result = await db.query(
      `UPDATE jobs SET status = 'queued'
       WHERE status = 'running'
         AND id IN (
           SELECT je.job_id
           FROM job_executions je
           WHERE je.status = 'running'
             AND je.worker_id IS NOT NULL
             AND je.worker_id != $1
             AND NOT EXISTS (
               SELECT 1 FROM worker_heartbeats wh
               WHERE wh.worker_id = je.worker_id
                 AND wh.beat_at > NOW() - INTERVAL '45 seconds'
             )
         )
       RETURNING id`,
      [workerId]
    );

    if (result.rows.length > 0) {
      const ids = result.rows.map((r) => r.id);
      log(`Recovered ${ids.length} orphaned job(s) from dead workers: ${ids.join(', ')}`);

      // Also mark the corresponding executions as failed
      await db.query(
        `UPDATE job_executions
         SET status = 'failed', finished_at = NOW(), error_message = 'Worker died — job recovered'
         WHERE job_id = ANY($1) AND status = 'running'`,
        [ids]
      );
      await emitWorkerEvent('JOB_REQUEUED', { jobIds: ids });
      await emitWorkerEvent('DASHBOARD_STATS_UPDATED');
    }
  } catch (err) {
    log('recoverDeadWorkerJobs error:', err.message);
  }
}

// ─── 8. Graceful Shutdown ───────────────────────────────────────────────────────

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  log(`Received ${signal} — shutting down gracefully…`);

  // Stop all intervals/cron
  if (pollInterval) clearInterval(pollInterval);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (deadWorkerInterval) clearInterval(deadWorkerInterval);
  if (cronTask) cronTask.stop();

  // Wait for in-flight jobs to finish (poll every 500 ms, up to 30 s)
  const maxWait = 30_000;
  const start = Date.now();

  while (runningJobCount > 0 && Date.now() - start < maxWait) {
    log(`Waiting for ${runningJobCount} running job(s) to finish…`);
    await new Promise((r) => setTimeout(r, 500));
  }

  if (runningJobCount > 0) {
    log(`Timed out waiting — ${runningJobCount} job(s) still running`);
  }

  // Mark worker as offline
  try {
    await db.query(
      `UPDATE workers SET status = 'offline', current_job_count = 0 WHERE id = $1`,
      [workerId]
    );
    log('Worker marked offline');
    await emitWorkerEvent('WORKER_OFFLINE', { workerId });
  } catch (err) {
    log('Error updating worker status on shutdown:', err.message);
  }

  // Close the pool
  try {
    await db.pool.end();
  } catch (_) {
    // ignore
  }

  log('Goodbye.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── 9. Bootstrap ───────────────────────────────────────────────────────────────

async function start() {
  console.log('─────────────────────────────────────────');
  console.log('  Distributed Job Scheduler — Worker');
  console.log('─────────────────────────────────────────');

  // 1. Register this worker
  await registerWorker();

  // 2. Send an initial heartbeat
  await sendHeartbeat();

  // 3. Start heartbeat interval (every 15 s)
  heartbeatInterval = setInterval(sendHeartbeat, 15_000);

  // 4. Start polling interval (every 2 s)
  pollInterval = setInterval(poll, 2_000);

  // 5. Start cron scheduler — check scheduled_jobs every minute
  cronTask = cron.schedule('* * * * *', processScheduledJobs);

  // 6. Start dead-worker recovery (every 30 s)
  deadWorkerInterval = setInterval(recoverDeadWorkerJobs, 30_000);

  log('All systems online. Polling for jobs…');
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Fatal error during worker startup:', err);
    process.exit(1);
  });
}

module.exports = {
  start,
  shutdown,
  registerWorker,
  sendHeartbeat,
  claimJob,
  executeJob,
  onJobSuccess,
  onJobFailure,
  poll,
  processScheduledJobs,
  recoverDeadWorkerJobs,
  setWorkerId,
  getWorkerId
};
