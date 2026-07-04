const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/statsController');

// All stats routes require authentication
router.use(authenticate);

// GET /api/stats
router.get('/', getDashboardStats);

module.exports = router;
