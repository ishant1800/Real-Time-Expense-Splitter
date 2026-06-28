import { Request, Response } from 'express';
import { ExpenseService } from '../services/expense.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

const expenseService = new ExpenseService();

/**
 * POST /api/expenses
 * Create a new expense.
 */
export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const expense = await expenseService.createExpense(userId, req.body);

  ApiResponse.success(res, 201, 'Expense created successfully', { expense });
});

/**
 * PUT /api/expenses/:expenseId
 * Update an existing expense. Only payers or group owners can modify.
 */
export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const { expenseId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const expense = await expenseService.updateExpense(expenseId as string, userId, req.body);

  ApiResponse.success(res, 200, 'Expense updated successfully', { expense });
});

/**
 * DELETE /api/expenses/:expenseId
 * Delete an expense. Only payers or group owners can modify.
 */
export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const { expenseId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  await expenseService.deleteExpense(expenseId as string, userId);

  ApiResponse.success(res, 200, 'Expense deleted successfully');
});

/**
 * GET /api/expenses/group/:groupId
 * List all expenses for a group. Requesting user must be a member of the group.
 */
export const listGroupExpenses = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const expenses = await expenseService.listGroupExpenses(groupId as string, userId);

  ApiResponse.success(res, 200, 'Group expenses retrieved successfully', { expenses });
});
