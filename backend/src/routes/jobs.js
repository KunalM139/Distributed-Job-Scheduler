const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createJob,
  listJobs,
  getJob,
  retryJob,
  deleteJob,
} = require('../controllers/jobController');

// All job routes require authentication
router.use(authenticate);

// POST /api/queues/:queueId/jobs
router.post(
  '/queues/:queueId/jobs',
  [
    param('queueId').isUUID().withMessage('Invalid queue ID'),
    body('type')
      .if((_value, { req }) => !req.body.batch)
      .trim()
      .notEmpty()
      .withMessage('Job type is required when not using batch mode'),
    body('payload')
      .optional()
      .isObject()
      .withMessage('Payload must be an object'),
    body('priority')
      .optional()
      .isInt()
      .withMessage('Priority must be an integer'),
    body('scheduled_at')
      .optional()
      .isISO8601()
      .withMessage('scheduled_at must be a valid ISO 8601 datetime'),
    body('cron_expression')
      .optional()
      .isString()
      .withMessage('cron_expression must be a string'),
    body('batch')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Batch must be a non-empty array'),
  ],
  validate,
  createJob
);

// GET /api/queues/:queueId/jobs
router.get(
  '/queues/:queueId/jobs',
  [
    param('queueId').isUUID().withMessage('Invalid queue ID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isString()
      .withMessage('Status must be a string'),
  ],
  validate,
  listJobs
);

// GET /api/jobs/:id
router.get(
  '/jobs/:id',
  [param('id').isUUID().withMessage('Invalid job ID')],
  validate,
  getJob
);

// POST /api/jobs/:id/retry
router.post(
  '/jobs/:id/retry',
  [param('id').isUUID().withMessage('Invalid job ID')],
  validate,
  retryJob
);

// DELETE /api/jobs/:id
router.delete(
  '/jobs/:id',
  [param('id').isUUID().withMessage('Invalid job ID')],
  validate,
  deleteJob
);

module.exports = router;
