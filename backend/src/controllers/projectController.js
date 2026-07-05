const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { errorResponse } = require('../middleware/validate');

/**
 * GET /api/projects
 * List all projects for the logged-in user.
 */
const listProjects = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.id, p.name, p.description, p.created_at, COALESCE(MAX(pm.role), 'owner') AS user_role
       FROM projects p 
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
       WHERE p.user_id = $1 OR pm.user_id = $1
       GROUP BY p.id
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
    const { name, description } = req.body;
    const id = uuidv4();

    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO projects (id, user_id, name, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, req.user.id, name, description || null]
    );

    // Insert creator as 'owner'
    await client.query(
      `INSERT INTO project_members (id, project_id, user_id, role) VALUES ($1, $2, $3, $4)`,
      [uuidv4(), id, req.user.id, 'owner']
    );

    await client.query('COMMIT');
    return res.status(201).json({ data: result.rows[0] });
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
 * Delete a project only if owned by the current user.
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, 'Project not found or not owned by you');
    }

    return res.json({ data: { id }, message: 'Project deleted' });
  } catch (err) {
    console.error('deleteProject error:', err);
    return errorResponse(res, 500, 'Failed to delete project');
  }
};

module.exports = { listProjects, createProject, deleteProject };
