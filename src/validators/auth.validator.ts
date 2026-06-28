import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/CustomErrors';

/**
 * Validate register request body.
 */
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required');
  } else if (name.trim().length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }

  next();
};

/**
 * Validate login request body.
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  const { email, password } = req.body;

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }

  next();
};

/**
 * Validate that a refreshToken field exists in the request body.
 */
export const validateRefreshToken = (req: Request, res: Response, next: NextFunction): void => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== 'string') {
    return next(new ValidationError('Validation failed', ['Refresh token is required']));
  }

  next();
};

/**
 * Validate Google login request body.
 */
export const validateGoogleLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { idToken } = req.body;

  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    return next(new ValidationError('Validation failed', ['idToken is required']));
  }

  next();
};

/**
 * Validate forgot password request body.
 */
export const validateForgotPassword = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Please provide a valid email address');
  }

  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }

  next();
};

/**
 * Validate reset password request body.
 */
export const validateResetPassword = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  const { token, password } = req.body;

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    errors.push('Token is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }

  next();
};
