const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { requireRole } = require('../middleware/rbac');
const {
  listMembers,
  addMember,
  updateMember,
  removeMember,
} = require('../controllers/memberController');

// All member routes require authentication
router.use(authenticate);

// GET /api/projects/:projectId/members
router.get(
  '/projects/:projectId/members',
  [param('projectId').isUUID().withMessage('Invalid project ID')],
  validate,
  requireRole('owner', 'admin'),
  listMembers
);

// POST /api/projects/:projectId/members
router.post(
  '/projects/:projectId/members',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['owner', 'admin', 'viewer']).withMessage('Role must be owner, admin, or viewer'),
  ],
  validate,
  requireRole('owner'),
  addMember
);

// PATCH /api/projects/:projectId/members/:userId
router.patch(
  '/projects/:projectId/members/:userId',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    param('userId').isUUID().withMessage('Invalid user ID'),
    body('role').isIn(['owner', 'admin', 'viewer']).withMessage('Role must be owner, admin, or viewer'),
  ],
  validate,
  requireRole('owner'),
  updateMember
);

// DELETE /api/projects/:projectId/members/:userId
router.delete(
  '/projects/:projectId/members/:userId',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    param('userId').isUUID().withMessage('Invalid user ID'),
  ],
  validate,
  requireRole('owner'),
  removeMember
);

module.exports = router;
