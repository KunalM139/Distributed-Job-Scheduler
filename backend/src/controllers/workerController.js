const db = require('../db');
const { errorResponse } = require('../middleware/validate');

/**
 * GET /api/workers
 * List all workers with their last heartbeat time and current status.
 */
const listWorkers = async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT
         w.id,
         w.hostname,
         w.status,
         w.current_job_count,
         w.registered_at,
         (
           SELECT wh.beat_at
           FROM worker_heartbeats wh
           WHERE wh.worker_id = w.id
           ORDER BY wh.beat_at DESC
           LIMIT 1
         ) AS last_heartbeat_at
       FROM workers w
       ORDER BY w.registered_at DESC`
    );

    return res.json({ data: result.rows });
  } catch (err) {
    console.error('listWorkers error:', err);
    return errorResponse(res, 500, 'Failed to list workers');
  }
};

/**
 * GET /api/workers/:id
 * Get a single worker's details and the job(s) it is currently running.
 */
const getWorker = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch worker
    const workerResult = await db.query(
      `SELECT
         w.*,
         (
           SELECT wh.beat_at
           FROM worker_heartbeats wh
           WHERE wh.worker_id = w.id
           ORDER BY wh.beat_at DESC
           LIMIT 1
         ) AS last_heartbeat_at
       FROM workers w
       WHERE w.id = $1`,
      [id]
    );

    if (workerResult.rows.length === 0) {
      return errorResponse(res, 404, 'Worker not found');
    }

    // Fetch jobs currently being executed by this worker
    const jobsResult = await db.query(
      `SELECT j.*
       FROM jobs j
       JOIN job_executions je ON je.job_id = j.id
       WHERE je.worker_id = $1
         AND je.status = 'running'
       ORDER BY je.started_at DESC`,
      [id]
    );

    return res.json({
      data: {
        ...workerResult.rows[0],
        current_jobs: jobsResult.rows,
      },
    });
  } catch (err) {
    console.error('getWorker error:', err);
    return errorResponse(res, 500, 'Failed to get worker');
  }
};

module.exports = { listWorkers, getWorker };
