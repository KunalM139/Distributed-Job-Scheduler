const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  listProjects,
  createProject,
  deleteProject,
} = require('../controllers/projectController');

// All project routes require authentication
router.use(authenticate);

// GET /api/projects
router.get('/', listProjects);

// POST /api/projects
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Project name is required')
      .isLength({ max: 255 })
      .withMessage('Project name must be at most 255 characters'),
    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string'),
  ],
  validate,
  createProject
);

// DELETE /api/projects/:id
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid project ID')],
  validate,
  deleteProject
);

module.exports = router;
