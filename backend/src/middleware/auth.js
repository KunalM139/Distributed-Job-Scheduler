const jwt = require('jsonwebtoken');
const db = require('../db');

/**
 * Auth middleware — verifies the JWT from the Authorization header,
 * attaches the decoded user payload to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user actually exists in the database
    // This prevents cryptographic bugs where old JWTs are used after the DB is truncated or user is deleted
    const result = await db.query('SELECT id FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists or token is invalid.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = authenticate;
