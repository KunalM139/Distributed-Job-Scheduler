const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { errorResponse } = require('../middleware/validate');
const { emitEvent } = require('../services/socket');

/**
 * GET /api/dlq
 * List all dead-letter queue entries with pagination.
 * Query params: ?page=1&limit=20
 */
const listDLQ = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const [countResult, dataResult] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS total FROM dead_letter_queue'),
      db.query(
        `SELECT
           dlq.id,
           dlq.job_id,
           dlq.queue_id,
           dlq.failure_reason,
           dlq.total_attempts,
           dlq.failed_at,
           j.type   AS job_type,
           j.payload AS job_payload,
           q.name   AS queue_name
         FROM dead_letter_queue dlq
         JOIN jobs j   ON j.id = dlq.job_id
         JOIN queues q ON q.id = dlq.queue_id
         ORDER BY dlq.failed_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);

    return res.json({
      data: dataResult.rows,
      total: countResult.rows[0].total,
      page,
      limit,
    });
  } catch (err) {
    console.error('listDLQ error:', err);
    return errorResponse(res, 500, 'Failed to list dead-letter queue');
  }
};

/**
 * POST /api/dlq/:id/retry
 * Move the job back to 'queued' status, reset attempt_count, and remove
 * the entry from the dead-letter queue.
 */
const retryDLQ = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the DLQ entry
    const dlqResult = await db.query(
      'SELECT * FROM dead_letter_queue WHERE id = $1',
      [id]
    );

    if (dlqResult.rows.length === 0) {
      return errorResponse(res, 404, 'Dead-letter queue entry not found');
    }

    const dlqEntry = dlqResult.rows[0];

    // Re-queue the job
    await db.query(
      `UPDATE jobs
       SET status = 'queued', attempt_count = 0, scheduled_at = NULL
       WHERE id = $1`,
      [dlqEntry.job_id]
    );

    // Remove from DLQ
    await db.query('DELETE FROM dead_letter_queue WHERE id = $1', [id]);

    // Log the retry
    await db.query(
      `INSERT INTO job_logs (id, job_id, level, message)
       VALUES ($1, $2, 'info', 'Job retried from dead-letter queue')`,
      [uuidv4(), dlqEntry.job_id]
    );

    emitEvent('JOB_REQUEUED', { jobId: dlqEntry.job_id });
    emitEvent('DASHBOARD_STATS_UPDATED');

    return res.json({
      data: { job_id: dlqEntry.job_id },
      message: 'Job moved back to queued from dead-letter queue',
    });
  } catch (err) {
    console.error('retryDLQ error:', err);
    return errorResponse(res, 500, 'Failed to retry dead-letter queue entry');
  }
};

module.exports = { listDLQ, retryDLQ };
