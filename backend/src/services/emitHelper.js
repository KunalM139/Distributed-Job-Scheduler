/**
 * Emit Helper — sends a pg_notify on channel 'job_events'.
 *
 * Used by both controllers (running inside the API server) and the worker
 * (running as a separate process). Controllers can also call socketService
 * directly, but pg_notify is the universal path that works from any process.
 */

const db = require('../db');

/**
 * Fire a real-time event through PostgreSQL NOTIFY.
 * The API server's notifyService picks this up and emits via Socket.IO.
 *
 * @param {string} event — Socket.IO event name (e.g. 'job:updated')
 * @param {object} data  — payload to send to clients
 */
async function emitEvent(event, data) {
  try {
    const payload = JSON.stringify({ event, data });
    await db.query(`SELECT pg_notify('job_events', $1)`, [payload]);
  } catch (err) {
    // Non-critical — log and move on. The UI will still update via polling.
    console.error(`[emitEvent] Failed to notify (${event}):`, err.message);
  }
}

module.exports = { emitEvent };
