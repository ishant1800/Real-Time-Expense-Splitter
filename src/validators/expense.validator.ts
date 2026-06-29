import { z } from 'zod';
import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/CustomErrors';

// Helper to validate Mongoose ObjectId strings
const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

/**
 * Zod Schema for creating a new expense.
 */
export const createExpenseSchema = z.object({
  groupId: objectIdSchema,
  paidBy: objectIdSchema,
  amount: z.number().positive('Amount must be greater than 0'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description cannot exceed 255 characters'),
  category: z.string().min(1, 'Category is required'),
  receiptUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  splitType: z.enum(['equal', 'exact', 'percentage', 'shares']),
  splits: z
    .array(
      z.object({
        userId: objectIdSchema,
        amount: z.number().nonnegative().optional(),
        percentage: z.number().min(0).max(100).optional(),
        share: z.number().nonnegative().optional(),
      })
    )
    .min(1, 'At least one split participant is required'),
});

/**
 * Zod Schema for updating an existing expense.
 */
export const updateExpenseSchema = createExpenseSchema.partial();

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
