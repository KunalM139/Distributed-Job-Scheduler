const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { errorResponse } = require('../middleware/validate');
const { emitEvent } = require('../services/emitHelper');

// ─── Helpers ─────────────────────────────────────────────

/**
 * Verify that the queue exists AND that the current user owns its parent project.
 * Returns the queue row or null.
 */
const getAccessibleQueue = async (queueId, userId) => {
  const result = await db.query(
    `SELECT q.* FROM queues q
     WHERE q.id = $1 AND (
       EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = q.project_id AND pm.user_id = $2)
       OR EXISTS (SELECT 1 FROM projects p WHERE p.id = q.project_id AND p.user_id = $2)
     )`,
    [queueId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Verify the project belongs to the current user.
 */
const verifyProjectAccess = async (projectId, userId) => {
  const mRes = await db.query(
    'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (mRes.rows.length > 0) return true;

  const result = await db.query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows.length > 0;
};

// ─── Controllers ─────────────────────────────────────────

/**
 * GET /api/projects/:projectId/queues
 */
const listQueues = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!(await verifyProjectAccess(projectId, req.user.id))) {
      return errorResponse(res, 404, 'Project not found or you lack access');
    }

    const result = await db.query(
      `SELECT q.*, rp.strategy, rp.max_attempts, rp.delay_seconds, rp.backoff_multiplier
       FROM queues q
       LEFT JOIN retry_policies rp ON rp.id = q.retry_policy_id
       WHERE q.project_id = $1
       ORDER BY q.created_at DESC`,
      [projectId]
    );

    return res.json({ data: result.rows });
  } catch (err) {
    console.error('listQueues error:', err);
    return errorResponse(res, 500, 'Failed to list queues');
  }
};

/**
 * POST /api/projects/:projectId/queues
 * Body: { name, priority?, concurrency_limit?, retry_policy? }
 * retry_policy is an object: { strategy, max_attempts?, delay_seconds?, backoff_multiplier? }
 */
const createQueue = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!(await verifyProjectAccess(projectId, req.user.id))) {
      return errorResponse(res, 404, 'Project not found or you lack access');
    }

    const { name, priority, concurrency_limit, retry_policy } = req.body;

    let retryPolicyId = null;

    // Create an embedded retry policy if provided
    if (retry_policy) {
      const rpId = uuidv4();
      await db.query(
        `INSERT INTO retry_policies (id, strategy, max_attempts, delay_seconds, backoff_multiplier)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          rpId,
          retry_policy.strategy,
          retry_policy.max_attempts ?? 3,
          retry_policy.delay_seconds ?? 5,
          retry_policy.backoff_multiplier ?? 2.0,
        ]
      );
      retryPolicyId = rpId;
    }

    const queueId = uuidv4();
    const result = await db.query(
      `INSERT INTO queues (id, project_id, retry_policy_id, name, priority, concurrency_limit)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [queueId, projectId, retryPolicyId, name, priority ?? 0, concurrency_limit ?? 5]
    );

    emitEvent('queue:created', { queue: result.rows[0] });
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('createQueue error:', err);
    return errorResponse(res, 500, 'Failed to create queue');
  }
};

/**
 * PATCH /api/queues/:id
 * Body: { priority?, concurrency_limit?, status? }
 */
const updateQueue = async (req, res) => {
  try {
    const { id } = req.params;

    const queue = await getAccessibleQueue(id, req.user.id);
    if (!queue) {
      return errorResponse(res, 404, 'Queue not found or you lack access');
    }

    const { priority, concurrency_limit, status } = req.body;

    const result = await db.query(
      `UPDATE queues
       SET priority          = COALESCE($1, priority),
           concurrency_limit = COALESCE($2, concurrency_limit),
           status            = COALESCE($3, status)
       WHERE id = $4
       RETURNING *`,
      [priority ?? null, concurrency_limit ?? null, status ?? null, id]
    );

    emitEvent('queue:updated', { queue: result.rows[0] });
    return res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('updateQueue error:', err);
    return errorResponse(res, 500, 'Failed to update queue');
  }
};

/**
 * POST /api/queues/:id/pause
 */
const pauseQueue = async (req, res) => {
  try {
    const { id } = req.params;

    const queue = await getAccessibleQueue(id, req.user.id);
    if (!queue) {
      return errorResponse(res, 404, 'Queue not found or you lack access');
    }

    const result = await db.query(
      "UPDATE queues SET status = 'paused' WHERE id = $1 RETURNING *",
      [id]
    );

    emitEvent('queue:updated', { queue: result.rows[0] });
    return res.json({ data: result.rows[0], message: 'Queue paused' });
  } catch (err) {
    console.error('pauseQueue error:', err);
    return errorResponse(res, 500, 'Failed to pause queue');
  }
};

/**
 * POST /api/queues/:id/resume
 */
const resumeQueue = async (req, res) => {
  try {
    const { id } = req.params;

    const queue = await getAccessibleQueue(id, req.user.id);
    if (!queue) {
      return errorResponse(res, 404, 'Queue not found or you lack access');
    }

    const result = await db.query(
      "UPDATE queues SET status = 'active' WHERE id = $1 RETURNING *",
      [id]
    );

    emitEvent('queue:updated', { queue: result.rows[0] });
    return res.json({ data: result.rows[0], message: 'Queue resumed' });
  } catch (err) {
    console.error('resumeQueue error:', err);
    return errorResponse(res, 500, 'Failed to resume queue');
  }
};

/**
 * GET /api/queues/:id/stats
 * Returns job counts grouped by status for the given queue.
 */
const getQueueStats = async (req, res) => {
  try {
    const { id } = req.params;

    const queue = await getAccessibleQueue(id, req.user.id);
    if (!queue) {
      return errorResponse(res, 404, 'Queue not found or you lack access');
    }

    const result = await db.query(
      `SELECT status, COUNT(*)::int AS count
       FROM jobs
       WHERE queue_id = $1
       GROUP BY status`,
      [id]
    );

    // Convert rows into { queued: 5, running: 2, ... }
    const stats = {};
    for (const row of result.rows) {
      stats[row.status] = row.count;
    }

    return res.json({ data: { queue_id: id, stats } });
  } catch (err) {
    console.error('getQueueStats error:', err);
    return errorResponse(res, 500, 'Failed to get queue stats');
  }
};

module.exports = {
  listQueues,
  createQueue,
  updateQueue,
  pauseQueue,
  resumeQueue,
  getQueueStats,
};
