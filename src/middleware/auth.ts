import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiResponse } from '../utils/ApiResponse';

/**
 * Express middleware that protects routes by verifying the JWT access token
 * from the Authorization header.
 *
 * Usage: router.get('/protected', authenticate, handler);
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ApiResponse.error(res, 401, 'Authentication required. Please provide a valid access token.');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    ApiResponse.error(res, 401, 'Invalid or expired access token');
  }
};
