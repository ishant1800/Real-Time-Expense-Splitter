import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/database';
import { initSocket } from './sockets';
import { logger } from './utils/Logger';

const server = http.createServer(app);

// Initialize Socket.io server
initSocket(server);

const startServer = async () => {
  try {
    // Connect to MongoDB before accepting HTTP traffic
    await connectDB();

    server.listen(env.PORT, '0.0.0.0', () => {
      logger.info(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start database connection / server initialization', error);
    process.exit(1);
  }
};

// Handle process uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', error);
  // For production stability, immediately exit so process manager (e.g. PM2, Kubernetes) restarts the container
  process.exit(1);
});

// Handle process unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection', reason);
  // Gracefully close server and then exit
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown helper
const handleGracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);
  server.close(() => {
    logger.info('HTTP server closed. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

startServer();
