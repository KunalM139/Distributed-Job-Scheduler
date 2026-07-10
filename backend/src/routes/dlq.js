const express = require('express');
const { param, query } = require('express-validator');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { listDLQ, retryDLQ } = require('../controllers/dlqController');
const { requireRole } = require('../middleware/rbac');

// All DLQ routes require authentication
router.use(authenticate);

// GET /api/dlq
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  listDLQ
);

// POST /api/dlq/:id/retry
router.post(
  '/:id/retry',
  [param('id').isUUID().withMessage('Invalid dead-letter queue entry ID')],
  validate,
  requireRole('owner', 'admin'),
  retryDLQ
);

module.exports = router;
