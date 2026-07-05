const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  listQueues,
  createQueue,
  updateQueue,
  pauseQueue,
  resumeQueue,
  getQueueStats,
} = require('../controllers/queueController');
const { requireRole } = require('../middleware/rbac');

// All queue routes require authentication
router.use(authenticate);

// GET /api/projects/:projectId/queues
router.get(
  '/projects/:projectId/queues',
  [param('projectId').isUUID().withMessage('Invalid project ID')],
  validate,
  requireRole('owner', 'admin', 'viewer'),
  listQueues
);

// POST /api/projects/:projectId/queues
router.post(
  '/projects/:projectId/queues',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Queue name is required')
      .isLength({ max: 255 })
      .withMessage('Queue name must be at most 255 characters'),
    body('priority')
      .optional()
      .isInt()
      .withMessage('Priority must be an integer'),
    body('concurrency_limit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Concurrency limit must be a positive integer'),
    body('retry_policy')
      .optional()
      .isObject()
      .withMessage('retry_policy must be an object'),
    body('retry_policy.strategy')
      .optional()
      .isIn(['fixed', 'linear', 'exponential'])
      .withMessage("Strategy must be one of: fixed, linear, exponential"),
    body('retry_policy.max_attempts')
      .optional()
      .isInt({ min: 1 })
      .withMessage('max_attempts must be a positive integer'),
    body('retry_policy.delay_seconds')
      .optional()
      .isInt({ min: 0 })
      .withMessage('delay_seconds must be a non-negative integer'),
    body('retry_policy.backoff_multiplier')
      .optional()
      .isFloat({ min: 1.0 })
      .withMessage('backoff_multiplier must be >= 1.0'),
  ],
  validate,
  requireRole('owner', 'admin'),
  createQueue
);

// PATCH /api/queues/:id
router.patch(
  '/queues/:id',
  [
    param('id').isUUID().withMessage('Invalid queue ID'),
    body('priority')
      .optional()
      .isInt()
      .withMessage('Priority must be an integer'),
    body('concurrency_limit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Concurrency limit must be a positive integer'),
    body('status')
      .optional()
      .isIn(['active', 'paused', 'draining'])
      .withMessage("Status must be one of: active, paused, draining"),
  ],
  validate,
  requireRole('owner', 'admin'),
  updateQueue
);

// POST /api/queues/:id/pause
router.post(
  '/queues/:id/pause',
  [param('id').isUUID().withMessage('Invalid queue ID')],
  validate,
  requireRole('owner', 'admin'),
  pauseQueue
);

// POST /api/queues/:id/resume
router.post(
  '/queues/:id/resume',
  [param('id').isUUID().withMessage('Invalid queue ID')],
  validate,
  requireRole('owner', 'admin'),
  resumeQueue
);

// GET /api/queues/:id/stats
router.get(
  '/queues/:id/stats',
  [param('id').isUUID().withMessage('Invalid queue ID')],
  validate,
  requireRole('owner', 'admin', 'viewer'),
  getQueueStats
);

module.exports = router;
