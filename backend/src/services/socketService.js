/**
 * Socket Service — Distributed Job Scheduler
 *
 * Singleton wrapper around Socket.IO server. Provides:
 *   init(httpServer)  — attach Socket.IO to the given HTTP server
 *   getIO()           — return the io instance (safe for controllers)
 *   emit(event, data) — broadcast an event to all connected clients
 */

const { Server } = require('socket.io');

let io = null;

/**
 * Attach Socket.IO to the provided HTTP server.
 */
function init(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

/**
 * Get the Socket.IO server instance. Returns null if not yet initialised.
 */
function getIO() {
  return io;
}

/**
 * Broadcast an event to all connected clients.
 * No-op if Socket.IO hasn't been initialised (e.g. during tests).
 */
function emit(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = { init, getIO, emit };
