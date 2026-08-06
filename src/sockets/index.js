import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';

let io = null;

// Initializes Socket.IO on top of the existing HTTP server.
// Clients must connect with `auth: { token: '<JWT access token>' }`.
// Every authenticated socket is joined to two rooms:
//   - user:<userId>  (targeted notifications)
//   - role:<role>     (broadcasts to every admin / employee / buyer / seller / mediator)
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = verifyAccessToken(token);
      socket.user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${socket.user.role}`);
  });

  return io;
}

export function getIO() {
  return io;
}

// Emits an event to a specific user room, a role room, or both.
export function emitToUser(userId, event, payload) {
  if (io && userId) io.to(`user:${userId}`).emit(event, payload);
}

export function emitToRole(role, event, payload) {
  if (io && role) io.to(`role:${role}`).emit(event, payload);
}
