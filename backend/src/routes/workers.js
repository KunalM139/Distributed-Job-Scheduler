const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { listWorkers, getWorker } = require('../controllers/workerController');

// All worker routes require authentication
router.use(authenticate);

// GET /api/workers
router.get('/', listWorkers);

// GET /api/workers/:id
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid worker ID')],
  validate,
  getWorker
);

module.exports = router;
