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
      'SELECT id, name, description, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
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
  try {
    const { name, description } = req.body;
    const id = uuidv4();

    const result = await db.query(
      'INSERT INTO projects (id, user_id, name, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, req.user.id, name, description || null]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('createProject error:', err);
    return errorResponse(res, 500, 'Failed to create project');
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
