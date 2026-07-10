const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  listProjects,
  createProject,
  deleteProject,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember
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

// GET /api/projects/:id/members
router.get(
  '/:id/members',
  [param('id').isUUID().withMessage('Invalid project ID')],
  validate,
  listMembers
);

// POST /api/projects/:id/members
router.post(
  '/:id/members',
  [
    param('id').isUUID().withMessage('Invalid project ID'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['OWNER', 'ADMIN', 'VIEWER']).withMessage('Invalid role')
  ],
  validate,
  addMember
);

// PUT /api/projects/:id/members/:memberId
router.put(
  '/:id/members/:memberId',
  [
    param('id').isUUID().withMessage('Invalid project ID'),
    param('memberId').isUUID().withMessage('Invalid member ID'),
    body('role').isIn(['OWNER', 'ADMIN', 'VIEWER']).withMessage('Invalid role')
  ],
  validate,
  updateMemberRole
);

// DELETE /api/projects/:id/members/:memberId
router.delete(
  '/:id/members/:memberId',
  [
    param('id').isUUID().withMessage('Invalid project ID'),
    param('memberId').isUUID().withMessage('Invalid member ID')
  ],
  validate,
  removeMember
);

module.exports = router;
