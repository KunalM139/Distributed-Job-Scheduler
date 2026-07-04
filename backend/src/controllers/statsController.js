const db = require('../db');
const { errorResponse } = require('../middleware/validate');

/**
 * GET /api/stats
 * Dashboard stats — returns a single JSON object with aggregate metrics.
 */
const getDashboardStats = async (_req, res) => {
  try {
    // Run all aggregation queries in parallel
    const [
      totalJobsResult,
      jobsByStatusResult,
      activeWorkersResult,
      throughputResult,
      failedResult,
      queuesSummaryResult,
    ] = await Promise.all([
      // 1. Total jobs
      db.query('SELECT COUNT(*)::int AS count FROM jobs'),

      // 2. Jobs grouped by status
      db.query(
        `SELECT status, COUNT(*)::int AS count
         FROM jobs
         GROUP BY status`
      ),

      // 3. Active workers (heartbeat within last 30 seconds)
      db.query(
        `SELECT COUNT(DISTINCT w.id)::int AS count
         FROM workers w
         WHERE EXISTS (
           SELECT 1 FROM worker_heartbeats wh
           WHERE wh.worker_id = w.id
             AND wh.beat_at > NOW() - INTERVAL '30 seconds'
         )`
      ),

      // 4. Jobs completed in the last 60 minutes
      db.query(
        `SELECT COUNT(*)::int AS count
         FROM job_executions
         WHERE status = 'completed'
           AND finished_at > NOW() - INTERVAL '60 minutes'`
      ),

      // 5. Jobs failed in the last 60 minutes
      db.query(
        `SELECT COUNT(*)::int AS count
         FROM job_executions
         WHERE status = 'failed'
           AND finished_at > NOW() - INTERVAL '60 minutes'`
      ),

      // 6. Per-queue summary
      db.query(
        `SELECT
           q.name AS queue_name,
           COUNT(j.id)::int AS total_jobs,
           COUNT(j.id) FILTER (WHERE j.status = 'queued')::int    AS pending,
           COUNT(j.id) FILTER (WHERE j.status = 'running')::int   AS running,
           COUNT(j.id) FILTER (WHERE j.status = 'failed')::int    AS failed
         FROM queues q
         LEFT JOIN jobs j ON j.queue_id = q.id
         GROUP BY q.id, q.name
         ORDER BY q.name`
      ),
    ]);

    // Build jobs_by_status object from rows
    const jobsByStatus = {};
    for (const row of jobsByStatusResult.rows) {
      jobsByStatus[row.status] = row.count;
    }

    return res.json({
      data: {
        total_jobs: totalJobsResult.rows[0].count,
        jobs_by_status: jobsByStatus,
        active_workers: activeWorkersResult.rows[0].count,
        throughput_last_hour: throughputResult.rows[0].count,
        failed_last_hour: failedResult.rows[0].count,
        queues_summary: queuesSummaryResult.rows,
      },
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return errorResponse(res, 500, 'Failed to get dashboard stats');
  }
};

module.exports = { getDashboardStats };
