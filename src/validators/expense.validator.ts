import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ValidationError } from '../utils/CustomErrors';

/**
 * Validate create expense payload body.
 */
export const validateCreateExpense = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  const { groupId, paidBy, amount, description, category, splitType, splits } = req.body;

  if (!groupId || !mongoose.Types.ObjectId.isValid(groupId as string)) {
    errors.push('groupId is required and must be a valid ObjectId');
  }

  if (!paidBy || !mongoose.Types.ObjectId.isValid(paidBy as string)) {
    errors.push('paidBy is required and must be a valid ObjectId');
  }

  if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
    errors.push('amount is required and must be a number greater than 0');
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('description is required and must be a non-empty string');
  } else if (description.trim().length > 255) {
    errors.push('description cannot exceed 255 characters');
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('category is required and must be a non-empty string');
  }

  const validSplitTypes = ['equal', 'exact', 'percentage', 'shares'];
  if (!splitType || !validSplitTypes.includes(splitType)) {
    errors.push(`splitType must be one of: ${validSplitTypes.join(', ')}`);
  }

  if (!splits || !Array.isArray(splits) || splits.length === 0) {
    errors.push('splits must be a non-empty array');
  } else {
    splits.forEach((s: any, idx: number) => {
      if (!s.userId || !mongoose.Types.ObjectId.isValid(s.userId as string)) {
        errors.push(`splits[${idx}].userId is required and must be a valid ObjectId`);
      }
    });
  }

  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }

  next();
};

/**
 * Validate update expense payload body.
 */
export const validateUpdateExpense = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  const { paidBy, amount, description, category, splitType, splits } = req.body;

  if (paidBy !== undefined && !mongoose.Types.ObjectId.isValid(paidBy as string)) {
    errors.push('paidBy must be a valid ObjectId');
  }

  if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
    errors.push('amount must be a number greater than 0');
  }

  if (description !== undefined && (typeof description !== 'string' || description.trim().length === 0)) {
    errors.push('description must be a non-empty string');
  } else if (description !== undefined && description.trim().length > 255) {
    errors.push('description cannot exceed 255 characters');
  }

  if (category !== undefined && (typeof category !== 'string' || category.trim().length === 0)) {
    errors.push('category must be a non-empty string');
  }

  const validSplitTypes = ['equal', 'exact', 'percentage', 'shares'];
  if (splitType !== undefined && !validSplitTypes.includes(splitType)) {
    errors.push(`splitType must be one of: ${validSplitTypes.join(', ')}`);
  }

  if (splits !== undefined) {
    if (!Array.isArray(splits) || splits.length === 0) {
      errors.push('splits must be a non-empty array');
    } else {
      splits.forEach((s: any, idx: number) => {
        if (!s.userId || !mongoose.Types.ObjectId.isValid(s.userId as string)) {
          errors.push(`splits[${idx}].userId is required and must be a valid ObjectId`);
        }
      });
    }
  }

  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }

  next();
};

/**
 * Validate expenseId parameter format.
 */
export const validateExpenseId = (req: Request, res: Response, next: NextFunction): void => {
  const { expenseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(expenseId as string)) {
    return next(new ValidationError('Validation failed', ['Invalid expense ID format']));
  }

  next();
};
