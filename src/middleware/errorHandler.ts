import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import { ValidationError } from '../utils/CustomErrors';
import { env } from '../config/env';
import { logger } from '../utils/Logger';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: string[] | undefined = undefined;

  // 1. Handle custom ValidationError
  if (err instanceof ValidationError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // 2. Handle standard operational AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // 3. Handle standard express body-parser errors (like malformed JSON)
  else if (err.status && typeof err.status === 'number') {
    statusCode = err.status;
    message = err.message;
  }
  // 4. Handle Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Failed';
    errors = Object.values(err.errors).map((el: any) => el.message);
  }
  // 5. Handle Mongoose CastError (e.g. invalid ObjectId format)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  // 6. Handle MongoDB duplicate key error (code 11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${field}. Please use another value.`;
  }
  // 7. Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // Log error using production-grade Logger utility
  if (statusCode === 500) {
    logger.error(`Unexpected Server Exception: ${req.method} ${req.originalUrl}`, err);
  } else {
    logger.warn(`Client request warning (${statusCode}) for ${req.method} ${req.originalUrl}: ${message}`, { errors });
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
