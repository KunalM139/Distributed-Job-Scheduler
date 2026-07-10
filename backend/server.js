const express = require('express');
const cors = require('cors');
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

const app = express();
const server = http.createServer(app);

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());

// --------------- Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', queueRoutes);
app.use('/api', jobRoutes);
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
