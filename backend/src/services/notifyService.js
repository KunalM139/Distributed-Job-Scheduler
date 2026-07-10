/**
 * Notify Service — PostgreSQL LISTEN/NOTIFY → Socket.IO bridge
 *
 * The worker process (a separate Node process) cannot share the Socket.IO
 * server instance. Instead, it uses pg_notify() to send events through
 * PostgreSQL. This service listens on the 'job_events' channel with a
 * dedicated pg connection and forwards every notification to Socket.IO.
 *
 * Flow:  Worker → pg_notify('job_events', JSON) → this listener → socketService.emit()
 */

const { Client } = require('pg');
const socketService = require('./socketService');

let client = null;

/**
 * Start listening for PostgreSQL NOTIFY events and bridge them to Socket.IO.
 */
async function start() {
  client = new Client({ connectionString: process.env.DATABASE_URL });

  client.on('error', (err) => {
    console.error('[NotifyService] pg client error:', err.message);
    // Attempt reconnect after 3 seconds
    setTimeout(start, 3000);
  });

  await client.connect();
  await client.query('LISTEN job_events');

  console.log('[NotifyService] Listening on pg channel "job_events"');

  client.on('notification', (msg) => {
    try {
      const { event, data } = JSON.parse(msg.payload);
      socketService.emit(event, data);
    } catch (err) {
      console.error('[NotifyService] Failed to parse notification:', err.message);
    }
  });
}

/**
 * Stop listening and close the dedicated pg connection.
 */
async function stop() {
  if (client) {
    try {
      await client.query('UNLISTEN job_events');
      await client.end();
    } catch (_) {
      // ignore errors during shutdown
    }
    client = null;
  }
}

module.exports = { start, stop };
