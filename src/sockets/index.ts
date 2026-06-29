import { Server, Socket } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/Logger';
import { GroupRepository } from '../repositories/group.repository';

let io: Server | null = null;
const groupRepo = new GroupRepository();

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

  // JWT Authentication Middleware for Socket.io connections
  io.use((socket: Socket, next) => {
    let token = socket.handshake.auth?.token;
    if (!token) {
      logger.warn(`Socket connection rejected: Token is missing for socket ${socket.id}`);
      return next(new Error('Authentication required'));
    }

    // Strip "Bearer " prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      logger.warn(`Socket connection rejected: Invalid or expired token for socket ${socket.id}`, error);
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    logger.debug(`Socket client connected: ${socket.id} (user: ${userId})`);

    // Join a group room
    socket.on('join-group', async (groupId: string) => {
      if (groupId) {
        try {
          const group = await groupRepo.findById(groupId);
          if (!group) {
            socket.emit('error', { message: 'Group not found' });
            return;
          }

          // Verify if connecting user is a member of the group
          const isMember = group.members.some(
            (member: any) =>
              (member.userId._id ? member.userId._id.toString() : member.userId.toString()) === userId
          );

          if (!isMember) {
            socket.emit('error', { message: 'Access denied: You are not a member of this group' });
            logger.warn(`Unauthorized socket join-group attempt by user ${userId} for group ${groupId}`);
            return;
          }

          socket.join(groupId);
          logger.debug(`Socket client ${socket.id} (user: ${userId}) joined group room: ${groupId}`);
        } catch (error) {
          logger.error('Error during socket join-group', error);
          socket.emit('error', { message: 'Internal server error occurred' });
        }
      }
    });

    // Leave a group room
    socket.on('leave-group', (groupId: string) => {
      if (groupId) {
        socket.leave(groupId);
        logger.debug(`Socket client ${socket.id} (user: ${userId}) left group room: ${groupId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket client disconnected: ${socket.id} (user: ${userId})`);
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
