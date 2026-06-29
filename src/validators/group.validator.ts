import { z } from 'zod';
import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/CustomErrors';

// Helper to validate Mongoose ObjectId strings
const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

/**
 * Zod Schema for creating a group.
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name cannot exceed 100 characters'),
});

/**
 * Zod Schema for joining a group.
 */
export const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

/**
 * Zod Schema for renaming a group.
 */
export const renameGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name cannot exceed 100 characters'),
});

/**
 * Zod Schema for creating a settlement.
 */
export const createSettlementSchema = z.object({
  to: objectIdSchema,
  amount: z.number().positive('Amount must be greater than 0'),
});

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
