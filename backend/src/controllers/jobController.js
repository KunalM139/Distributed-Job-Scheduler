const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { errorResponse } = require('../middleware/validate');

// ─── Helpers ─────────────────────────────────────────────

/**
 * Verify the queue exists AND the user owns the parent project.
 */
const verifyQueueAccess = async (queueId, userId) => {
  const result = await db.query(
    `SELECT q.id FROM queues q
     JOIN projects p ON p.id = q.project_id
     WHERE q.id = $1 AND p.user_id = $2`,
    [queueId, userId]
  );
  return result.rows.length > 0;
};

/**
 * Verify a job exists AND belongs to a queue the user owns.
 */
const verifyJobAccess = async (jobId, userId) => {
  const result = await db.query(
    `SELECT j.id FROM jobs j
     JOIN queues q  ON q.id = j.queue_id
     JOIN projects p ON p.id = q.project_id
     WHERE j.id = $1 AND p.user_id = $2`,
    [jobId, userId]
  );
  return result.rows.length > 0;
};

// ─── Controllers ─────────────────────────────────────────

/**
 * POST /api/queues/:queueId/jobs
 *
 * Accepts:
 *   type            (string)                   — required (unless batch)
 *   payload         (object)                   — optional
 *   priority        (number, default 0)
 *   scheduled_at    (ISO datetime, optional)   — if set → status = 'scheduled'
 *   cron_expression (string, optional)         — if set → creates a scheduled_job instead
 *   batch           (array of payloads)        — if set → bulk-insert multiple jobs
 */
const createJob = async (req, res) => {
  try {
    const { queueId } = req.params;

    if (!(await verifyQueueAccess(queueId, req.user.id))) {
      return errorResponse(res, 404, 'Queue not found or not owned by you');
    }

    const { type, payload, priority, scheduled_at, cron_expression, batch } = req.body;

    // ── Cron-based scheduled job ──────────────────────────
    if (cron_expression) {
      const id = uuidv4();
      const result = await db.query(
        `INSERT INTO scheduled_jobs (id, queue_id, cron_expression, job_type, payload)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [id, queueId, cron_expression, type, payload ? JSON.stringify(payload) : null]
      );

      return res.status(201).json({ data: result.rows[0], scheduled: true });
    }

    // ── Batch insert ─────────────────────────────────────
    if (batch && Array.isArray(batch) && batch.length > 0) {
      const values = [];
      const params = [];
      let paramIdx = 1;

      for (const item of batch) {
        const id = uuidv4();
        const jobPayload = item.payload ?? item;
        const jobType = item.type ?? type;
        const jobPriority = item.priority ?? priority ?? 0;
        const jobScheduledAt = item.scheduled_at ?? scheduled_at ?? null;
        const jobStatus = jobScheduledAt ? 'scheduled' : 'queued';

        values.push(
          `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6})`
        );
        params.push(id, queueId, jobType, JSON.stringify(jobPayload), jobStatus, jobPriority, jobScheduledAt);
        paramIdx += 7;
      }

      const result = await db.query(
        `INSERT INTO jobs (id, queue_id, type, payload, status, priority, scheduled_at)
         VALUES ${values.join(', ')} RETURNING *`,
        params
      );

      return res.status(201).json({ data: result.rows, count: result.rows.length });
    }

    // ── Single job ───────────────────────────────────────
    const id = uuidv4();
    const status = scheduled_at ? 'scheduled' : 'queued';

    const result = await db.query(
      `INSERT INTO jobs (id, queue_id, type, payload, status, priority, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, queueId, type, payload ? JSON.stringify(payload) : null, status, priority ?? 0, scheduled_at ?? null]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('createJob error:', err);
    return errorResponse(res, 500, 'Failed to create job');
  }
};

/**
 * GET /api/queues/:queueId/jobs
 * Query params: ?page=1&limit=20&status=failed
 */
const listJobs = async (req, res) => {
  try {
    const { queueId } = req.params;

    if (!(await verifyQueueAccess(queueId, req.user.id))) {
      return errorResponse(res, 404, 'Queue not found or not owned by you');
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status || null;

    let countQuery = 'SELECT COUNT(*)::int AS total FROM jobs WHERE queue_id = $1';
    let dataQuery = 'SELECT * FROM jobs WHERE queue_id = $1';
    const countParams = [queueId];
    const dataParams = [queueId];

    if (statusFilter) {
      countQuery += ' AND status = $2';
      dataQuery += ' AND status = $2';
      countParams.push(statusFilter);
      dataParams.push(statusFilter);
    }

    dataQuery += ` ORDER BY priority DESC, created_at ASC LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}`;
    dataParams.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
      db.query(countQuery, countParams),
      db.query(dataQuery, dataParams),
    ]);

    return res.json({
      data: dataResult.rows,
      total: countResult.rows[0].total,
      page,
      limit,
    });
  } catch (err) {
    console.error('listJobs error:', err);
    return errorResponse(res, 500, 'Failed to list jobs');
  }
};

/**
 * GET /api/jobs/:id
 * Returns the job together with its executions and logs.
 */
const getJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await verifyJobAccess(id, req.user.id))) {
      return errorResponse(res, 404, 'Job not found or not owned by you');
    }

    const [jobResult, executionsResult, logsResult] = await Promise.all([
      db.query('SELECT * FROM jobs WHERE id = $1', [id]),
      db.query('SELECT * FROM job_executions WHERE job_id = $1 ORDER BY attempt_number ASC', [id]),
      db.query('SELECT * FROM job_logs WHERE job_id = $1 ORDER BY created_at ASC', [id]),
    ]);

    if (jobResult.rows.length === 0) {
      return errorResponse(res, 404, 'Job not found');
    }

    return res.json({
      data: {
        ...jobResult.rows[0],
        executions: executionsResult.rows,
        logs: logsResult.rows,
      },
    });
  } catch (err) {
    console.error('getJob error:', err);
    return errorResponse(res, 500, 'Failed to get job');
  }
};

/**
 * POST /api/jobs/:id/retry
 * Move a failed/dead job back to 'queued' and reset attempt_count.
 */
const retryJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await verifyJobAccess(id, req.user.id))) {
      return errorResponse(res, 404, 'Job not found or not owned by you');
    }

    // Only allow retrying failed or dead jobs
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);
    const job = jobResult.rows[0];

    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (!['failed', 'dead'].includes(job.status)) {
      return errorResponse(res, 400, `Cannot retry a job with status '${job.status}'. Only failed or dead jobs can be retried.`);
    }

    const result = await db.query(
      "UPDATE jobs SET status = 'queued', attempt_count = 0 WHERE id = $1 RETURNING *",
      [id]
    );

    return res.json({ data: result.rows[0], message: 'Job re-queued for retry' });
  } catch (err) {
    console.error('retryJob error:', err);
    return errorResponse(res, 500, 'Failed to retry job');
  }
};

/**
 * DELETE /api/jobs/:id
 */
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await verifyJobAccess(id, req.user.id))) {
      return errorResponse(res, 404, 'Job not found or not owned by you');
    }

    await db.query('DELETE FROM jobs WHERE id = $1', [id]);

    return res.json({ data: { id }, message: 'Job deleted' });
  } catch (err) {
    console.error('deleteJob error:', err);
    return errorResponse(res, 500, 'Failed to delete job');
  }
};

module.exports = { createJob, listJobs, getJob, retryJob, deleteJob };
