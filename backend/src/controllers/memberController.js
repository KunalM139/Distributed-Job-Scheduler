const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { errorResponse } = require('../middleware/validate');

/**
 * GET /api/projects/:projectId/members
 * List all members of a project.
 */
const listMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await db.query(
      `SELECT pm.user_id, pm.role, pm.created_at, u.name, u.email 
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.created_at ASC`,
      [projectId]
    );

    // Fallback: If no members exist (legacy project), manually inject owner
    if (result.rows.length === 0) {
      const pRes = await db.query(
        `SELECT p.user_id, u.name, u.email, p.created_at 
         FROM projects p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = $1`,
        [projectId]
      );
      if (pRes.rows.length > 0) {
        result.rows.push({
          user_id: pRes.rows[0].user_id,
          role: 'owner',
          created_at: pRes.rows[0].created_at,
          name: pRes.rows[0].name,
          email: pRes.rows[0].email,
        });
      }
    }

    return res.json({ data: result.rows });
  } catch (err) {
    console.error('listMembers error:', err);
    return errorResponse(res, 500, 'Failed to list members');
  }
};

/**
 * POST /api/projects/:projectId/members
 * Add a member by email.
 */
const addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;

    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return errorResponse(res, 404, 'User with that email not found');
    }

    const userId = userRes.rows[0].id;

    // Check if already a member
    const existingRes = await db.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (existingRes.rows.length > 0) {
      return errorResponse(res, 400, 'User is already a member of this project');
    }

    const result = await db.query(
      'INSERT INTO project_members (id, project_id, user_id, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), projectId, userId, role]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('addMember error:', err);
    return errorResponse(res, 500, 'Failed to add member');
  }
};

/**
 * PATCH /api/projects/:projectId/members/:userId
 * Update member role.
 */
const updateMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    const result = await db.query(
      'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3 RETURNING *',
      [role, projectId, userId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Project member not found');
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('updateMember error:', err);
    return errorResponse(res, 500, 'Failed to update member role');
  }
};

/**
 * DELETE /api/projects/:projectId/members/:userId
 * Remove a member. Prevent the last owner from removing themselves.
 */
const removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    // Prevent removing the last owner
    const ownersRes = await db.query(
      "SELECT user_id FROM project_members WHERE project_id = $1 AND role = 'owner'",
      [projectId]
    );
    
    const ownerIds = ownersRes.rows.map(r => r.user_id);
    if (ownerIds.includes(userId) && ownerIds.length === 1) {
      return errorResponse(res, 400, 'Cannot remove the last owner of the project');
    }

    const result = await db.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id',
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Project member not found');
    }

    return res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('removeMember error:', err);
    return errorResponse(res, 500, 'Failed to remove member');
  }
};

module.exports = { listMembers, addMember, updateMember, removeMember };
