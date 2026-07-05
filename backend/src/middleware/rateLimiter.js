const rateLimit = require('express-rate-limit');

// 1. General API Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
  skip: (req, res) => {
    // Skip GET requests for endpoints used by frontend polling/monitoring
    if (req.method === 'GET') {
      const pollingEndpoints = [
        '/api/stats',
        '/api/projects',
        '/api/workers',
        '/api/queues',
        '/api/jobs',
        '/api/dlq'
      ];
      // Check if the route starts with any of the polling endpoints
      return pollingEndpoints.some(endpoint => req.originalUrl.startsWith(endpoint) || req.url.startsWith(endpoint));
    }
    return false;
  },
});

// 2. Auth Limiter (applied only to login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 10 login/register requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

// 3. Job Creation Limiter (applied only to POST /api/queues/:id/jobs)
const jobCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 job creation requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Job creation rate limit exceeded. Max 30 jobs per minute.',
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  jobCreationLimiter,
};
