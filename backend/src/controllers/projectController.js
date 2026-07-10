const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { errorResponse } = require('../middleware/validate');
const { emitEvent } = require('../services/socket');

/**
 * GET /api/projects
 * List all projects where the logged-in user is a member.
 */
const listProjects = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.id, p.name, p.description, p.created_at, pm.role 
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1 
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error('listProjects error:', err);
    return errorResponse(res, 500, 'Failed to list projects');
  }
};

/**
 * POST /api/projects
 * Create a new project.
 */
const createProject = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { name, description } = req.body;
    const id = uuidv4();

    const projectResult = await client.query(
      'INSERT INTO projects (id, user_id, name, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, req.user.id, name, description || null]
    );

    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [id, req.user.id, 'OWNER']
    );

    await client.query('COMMIT');
    const newProject = projectResult.rows[0];
    newProject.role = 'OWNER';
    emitEvent('PROJECT_CREATED', { projectId: id });
    return res.status(201).json({ data: newProject });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createProject error:', err);
    return errorResponse(res, 500, 'Failed to create project');
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/projects/:id
 * Delete a project only if owned by the current user (role = OWNER).
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Must be OWNER
    const checkRole = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (checkRole.rows.length === 0 || checkRole.rows[0].role !== 'OWNER') {
      return errorResponse(res, 403, 'Must be an OWNER to delete project');
    }

    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [id]
    );

    return res.json({ data: { id }, message: 'Project deleted' });
  } catch (err) {
    console.error('deleteProject error:', err);
    return errorResponse(res, 500, 'Failed to delete project');
  }
};

/**
 * GET /api/projects/:id/members
 */
const listMembers = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate access
    const accessCheck = await db.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (accessCheck.rows.length === 0) return errorResponse(res, 403, 'Access denied');

    const result = await db.query(
      `SELECT pm.id, pm.user_id, pm.role, pm.created_at, u.name, u.email 
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.role ASC, pm.created_at ASC`,
      [id]
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error('listMembers error:', err);
    return errorResponse(res, 500, 'Failed to list members');
  }
};

/**
 * POST /api/projects/:id/members
 */
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    // Check auth user is ADMIN or OWNER
    const accessCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (accessCheck.rows.length === 0 || !['OWNER', 'ADMIN'].includes(accessCheck.rows[0].role)) {
      return errorResponse(res, 403, 'Must be OWNER or ADMIN to add members');
    }

    // Find user by email
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return errorResponse(res, 404, 'User with that email not found');
    }
    const targetUserId = userResult.rows[0].id;

    // Check if already a member
    const existingResult = await db.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, targetUserId]
    );
    if (existingResult.rows.length > 0) {
      return errorResponse(res, 400, 'User is already a member of this project');
    }

    const insertResult = await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [id, targetUserId, role]
    );

    return res.status(201).json({ data: insertResult.rows[0], message: 'Member added' });
  } catch (err) {
    console.error('addMember error:', err);
    return errorResponse(res, 500, 'Failed to add member');
  }
};

/**
 * PUT /api/projects/:id/members/:memberId
 */
const updateMemberRole = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    // Check auth user is ADMIN or OWNER
    const accessCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (accessCheck.rows.length === 0 || !['OWNER', 'ADMIN'].includes(accessCheck.rows[0].role)) {
      return errorResponse(res, 403, 'Must be OWNER or ADMIN to change roles');
    }

    // Cannot change OWNER role unless you are an OWNER
    if (role === 'OWNER' && accessCheck.rows[0].role !== 'OWNER') {
       return errorResponse(res, 403, 'Only an OWNER can assign OWNER role');
    }

    // If changing from OWNER to something else, check if there's at least one other OWNER
    const targetMemberCheck = await db.query('SELECT role, user_id FROM project_members WHERE id = $1 AND project_id = $2', [memberId, id]);
    if (targetMemberCheck.rows.length === 0) return errorResponse(res, 404, 'Member not found');
    
    if (targetMemberCheck.rows[0].role === 'OWNER' && role !== 'OWNER') {
      const ownerCount = await db.query("SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND role = 'OWNER'", [id]);
      if (parseInt(ownerCount.rows[0].count, 10) <= 1) {
        return errorResponse(res, 400, 'Cannot remove the last OWNER');
      }
    }

    const result = await db.query(
      'UPDATE project_members SET role = $1 WHERE id = $2 AND project_id = $3 RETURNING *',
      [role, memberId, id]
    );

    return res.json({ data: result.rows[0], message: 'Role updated' });
  } catch (err) {
    console.error('updateMemberRole error:', err);
    return errorResponse(res, 500, 'Failed to update member role');
  }
};

/**
 * DELETE /api/projects/:id/members/:memberId
 */
const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;

    // Check auth user is ADMIN or OWNER
    const accessCheck = await db.query(
      'SELECT role, user_id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (accessCheck.rows.length === 0) {
      return errorResponse(res, 403, 'Access denied');
    }

    const targetMemberCheck = await db.query('SELECT role, user_id FROM project_members WHERE id = $1 AND project_id = $2', [memberId, id]);
    if (targetMemberCheck.rows.length === 0) return errorResponse(res, 404, 'Member not found');

    const authUserRole = accessCheck.rows[0].role;
    const targetUserId = targetMemberCheck.rows[0].user_id;
    const targetRole = targetMemberCheck.rows[0].role;
    
    const isSelf = req.user.id === targetUserId;

    if (!isSelf && !['OWNER', 'ADMIN'].includes(authUserRole)) {
      return errorResponse(res, 403, 'Must be OWNER or ADMIN to remove members');
    }
    
    if (!isSelf && targetRole === 'OWNER' && authUserRole !== 'OWNER') {
      return errorResponse(res, 403, 'Only an OWNER can remove another OWNER');
    }

    if (targetRole === 'OWNER') {
      const ownerCount = await db.query("SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND role = 'OWNER'", [id]);
      if (parseInt(ownerCount.rows[0].count, 10) <= 1) {
        return errorResponse(res, 400, 'Cannot remove the last OWNER. Delete the project instead or assign another OWNER.');
      }
    }

    await db.query('DELETE FROM project_members WHERE id = $1', [memberId]);

    return res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('removeMember error:', err);
    return errorResponse(res, 500, 'Failed to remove member');
  }
};

module.exports = { 
  listProjects, 
  createProject, 
  deleteProject,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember
};
