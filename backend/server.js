const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const http = require('http');
const { initSocket } = require('./src/services/socket');

const authRoutes = require('./src/routes/auth');
const projectRoutes = require('./src/routes/projects');
const queueRoutes = require('./src/routes/queues');
const jobRoutes = require('./src/routes/jobs');
const workerRoutes = require('./src/routes/workers');
const dlqRoutes = require('./src/routes/dlq');
const statsRoutes = require('./src/routes/stats');
const memberRoutes = require('./src/routes/members');

const socketService = require('./src/services/socketService');
const notifyService = require('./src/services/notifyService');
const { generalLimiter, authLimiter } = require('./src/middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// --------------- Middleware ---------------
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

// --------------- Routes ---------------
// Prevent browser caching for all API responses to fix stale data after login/logout
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use('/api', generalLimiter); // Apply general limiter globally to /api
app.use('/api/auth', authLimiter, authRoutes); // Apply auth limiter to /api/auth
app.use('/api/projects', projectRoutes);
app.use('/api', queueRoutes);
app.use('/api', jobRoutes);
app.use('/api', memberRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/dlq', dlqRoutes);
app.use('/api/stats', statsRoutes);

// Health-check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --------------- Start server ---------------
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  initSocket(server).then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to initialize socket:', err);
  });
}

module.exports = server;
