import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/Logger';

/**
 * Establishes a connection to MongoDB Atlas using Mongoose.
 * Retries are handled internally by Mongoose's built-in reconnection logic.
 * This function should be called once before the HTTP server starts listening.
 */
export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Log disconnection events for observability
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Mongoose will attempt to reconnect.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', err);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};
