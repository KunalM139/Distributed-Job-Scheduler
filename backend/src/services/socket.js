const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../db'); // exports { pool, query }

let io;

/**
 * Initialize Socket.IO and attach it to the HTTP server
 */
const initSocket = async (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // or your specific frontend URL
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  // Middleware: Authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
      socket.user = decoded; // { userId, email, etc. }
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} (User: ${socket.user?.id || socket.user?.userId})`);
    
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // Setup PostgreSQL LISTEN for cross-process worker events
  try {
    const pgClient = await db.pool.connect();
    await pgClient.query('LISTEN socket_events');
    
    pgClient.on('notification', (msg) => {
      try {
        const payload = JSON.parse(msg.payload);
        // payload should have { event: 'JOB_COMPLETED', data: {...} }
        if (payload.event) {
          io.emit(payload.event, payload.data);
        }
      } catch (err) {
        console.error('[Socket] Failed to parse PG notification:', err);
      }
    });

    console.log('[Socket] Listening to PostgreSQL "socket_events" channel');
  } catch (err) {
    console.error('[Socket] Failed to connect to PostgreSQL for LISTEN:', err);
  }

  return io;
};

/**
 * Get the initialized Socket.IO instance
 */
const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Helper to emit events from within the same Node process (Controllers)
 */
const emitEvent = (eventName, data) => {
  if (io) {
    io.emit(eventName, data);
  }
};

module.exports = {
  initSocket,
  getIo,
  emitEvent,
};
