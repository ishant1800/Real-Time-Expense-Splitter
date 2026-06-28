import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { env } from './config/env';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import groupRoutes from './routes/group.routes';
import expenseRoutes from './routes/expense.routes';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/AppError';

const app = express();

// Set up security headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);

// Gzip compression for response bodies
app.use(compression());

// Log HTTP requests
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parse cookie headers
app.use(cookieParser());

// Parse incoming request bodies under JSON format
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Expense Splitter API is running',
    healthCheck: '/api/health',
  });
});

// Apply rate limiting (auth-related endpoints get a stricter limit)
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Register routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);

// Fallback for non-existent routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Resource not found: ${req.method} ${req.originalUrl}`, 404));
});

// Error handling middleware
app.use(errorHandler);

export default app;
