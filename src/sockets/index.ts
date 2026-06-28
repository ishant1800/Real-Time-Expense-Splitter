import { Server, Socket } from 'socket.io';
import http from 'http';
import { env } from '../config/env';
import { logger } from '../utils/Logger';

let io: Server | null = null;

/**
 * Initialize the Socket.io server.
 */
export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.debug(`Socket client connected: ${socket.id}`);

    // Join a group room
    socket.on('join-group', (groupId: string) => {
      if (groupId) {
        socket.join(groupId);
        logger.debug(`Socket client ${socket.id} joined group room: ${groupId}`);
      }
    });

    // Leave a group room
    socket.on('leave-group', (groupId: string) => {
      if (groupId) {
        socket.leave(groupId);
        logger.debug(`Socket client ${socket.id} left group room: ${groupId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Helper to retrieve the active Socket.io Server instance.
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

/**
 * Emit an update only to clients in the designated group room.
 */
export const emitToGroup = (groupId: string, event: string, data: any): void => {
  if (io) {
    io.to(groupId).emit(event, data);
    logger.info(`Socket emission to Group Room: ${groupId}, Event: ${event}`);
  }
};
