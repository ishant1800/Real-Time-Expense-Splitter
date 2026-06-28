import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ValidationError } from '../utils/CustomErrors';

/**
 * Validate create group input body.
 */
export const validateCreateGroup = (req: Request, res: Response, next: NextFunction): void => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new ValidationError('Validation failed', ['Group name is required']));
  }

  if (name.trim().length > 100) {
    return next(new ValidationError('Validation failed', ['Group name cannot exceed 100 characters']));
  }

  next();
};

/**
 * Validate join group input body.
 */
export const validateJoinGroup = (req: Request, res: Response, next: NextFunction): void => {
  const { inviteCode } = req.body;

  if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim().length === 0) {
    return next(new ValidationError('Validation failed', ['Invite code is required']));
  }

  next();
};

/**
 * Validate rename group input body.
 */
export const validateRenameGroup = (req: Request, res: Response, next: NextFunction): void => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new ValidationError('Validation failed', ['Group name is required']));
  }

  if (name.trim().length > 100) {
    return next(new ValidationError('Validation failed', ['Group name cannot exceed 100 characters']));
  }

  next();
};

/**
 * Validate groupId parameter format.
 */
export const validateGroupId = (req: Request, res: Response, next: NextFunction): void => {
  const { groupId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(groupId as string)) {
    return next(new ValidationError('Validation failed', ['Invalid group ID format']));
  }

  next();
};

/**
 * Validate memberId parameter format.
 */
export const validateMemberId = (req: Request, res: Response, next: NextFunction): void => {
  const { memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(memberId as string)) {
    return next(new ValidationError('Validation failed', ['Invalid member ID format']));
  }

  next();
};

/**
 * Validate create settlement payload body.
 */
export const validateCreateSettlement = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  const { to, amount } = req.body;

  if (!to || !mongoose.Types.ObjectId.isValid(to as string)) {
    errors.push('to (recipient userId) is required and must be a valid ObjectId');
  }

  if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
    errors.push('amount is required and must be a number greater than 0');
  }

  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }

  next();
};
