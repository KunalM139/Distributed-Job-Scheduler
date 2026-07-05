const db = require('../db');

/**
 * Role-Based Access Control Middleware
 * Requires the user to have one of the allowed roles for the inferred project.
 * 
 * Lookup Chains:
 * - Queue -> Project
 * - Job -> Queue -> Project
 * - DLQ -> Job -> Queue -> Project
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      let projectId = req.params.projectId;

      // 1. queueId param
      if (!projectId && req.params.queueId) {
        const qRes = await db.query('SELECT project_id FROM queues WHERE id = $1', [req.params.queueId]);
        if (qRes.rows.length > 0) projectId = qRes.rows[0].project_id;
      }

      // 2. id param (resource specific)
      if (!projectId && req.params.id) {
        const url = req.originalUrl || req.url;
        
        if (url.includes('/projects/')) {
          projectId = req.params.id;
        } 
        else if (url.includes('/queues/')) {
          // Queue -> Project
          const qRes = await db.query('SELECT project_id FROM queues WHERE id = $1', [req.params.id]);
          if (qRes.rows.length > 0) projectId = qRes.rows[0].project_id;
        } 
        else if (url.includes('/jobs/')) {
          // Job -> Queue -> Project
          const jRes = await db.query(
            `SELECT q.project_id 
             FROM jobs j 
             JOIN queues q ON j.queue_id = q.id 
             WHERE j.id = $1`, 
            [req.params.id]
          );
          if (jRes.rows.length > 0) projectId = jRes.rows[0].project_id;
        } 
        else if (url.includes('/dlq/')) {
          // DLQ -> Job -> Queue -> Project
          const dRes = await db.query(
            `SELECT q.project_id 
             FROM dead_letter_queue dlq 
             JOIN jobs j ON dlq.job_id = j.id
             JOIN queues q ON j.queue_id = q.id 
             WHERE dlq.id = $1`, 
            [req.params.id]
          );
          if (dRes.rows.length > 0) projectId = dRes.rows[0].project_id;
        }
      }

      // If we still don't have a projectId, the resource likely doesn't exist
      if (!projectId) {
        return res.status(404).json({ error: true, message: 'Resource not found' });
      }

      // 3. Check membership in project_members
      const mRes = await db.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, req.user.id]
      );

      let userRole = null;
      let projectExists = false;

      if (mRes.rows.length > 0) {
        userRole = mRes.rows[0].role;
        projectExists = true;
      } else {
        // Fallback for backward compatibility: Check if user owns the project
        const pRes = await db.query('SELECT user_id FROM projects WHERE id = $1', [projectId]);
        if (pRes.rows.length > 0) {
          projectExists = true;
          if (pRes.rows[0].user_id === req.user.id) {
            userRole = 'owner';
          }
        }
      }

      if (!projectExists) {
        if (req.originalUrl?.includes('/projects/') || req.url?.includes('/projects/')) {
          return res.status(404).json({ error: true, message: 'Project not found or not owned by you' });
        }
        return res.status(404).json({ error: true, message: 'Project not found' });
      }

      if (!userRole) {
        return res.status(403).json({ error: true, message: 'Forbidden: You are not a member of this project' });
      }

      // 4. Check if the user's role is in the allowed list
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: true, message: 'Forbidden: Insufficient role permissions' });
      }

      req.userRole = userRole;
      req.projectId = projectId;
      next();
    } catch (err) {
      console.error('RBAC Error:', err);
      res.status(500).json({ error: true, message: 'Internal Server Error during authorization' });
    }
  };
};

module.exports = { requireRole };
