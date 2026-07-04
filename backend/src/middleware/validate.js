const { validationResult } = require('express-validator');

/**
 * Returns a consistent JSON error envelope.
 * @param {object} res - Express response
 * @param {number} status - HTTP status code
 * @param {string} message - Human-readable message
 * @param {Array}  details - Optional array of field-level errors
 */
const errorResponse = (res, status, message, details = []) => {
  return res.status(status).json({ error: true, message, details });
};

/**
 * Express middleware that checks express-validator results.
 * If there are validation errors it returns a 400 with the consistent format.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Validation failed', errors.array());
  }
  next();
};

module.exports = { errorResponse, validate };
