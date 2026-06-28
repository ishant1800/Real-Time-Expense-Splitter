import mongoose from 'mongoose';
import { ExpenseRepository } from '../repositories/expense.repository';
import { GroupRepository } from '../repositories/group.repository';
import { BalanceCalculatorService } from './balanceCalculator.service';
import { AppError } from '../utils/AppError';
import { IExpenseDocument, SplitType, IExpenseSplit } from '../models/expense.model';
import { IGroupDocument } from '../models/group.model';
import { emitToGroup } from '../sockets';

export class ExpenseService {
  private expenseRepo: ExpenseRepository;
  private groupRepo: GroupRepository;
  private balanceCalculator: BalanceCalculatorService;

  constructor() {
    this.expenseRepo = new ExpenseRepository();
    this.groupRepo = new GroupRepository();
    this.balanceCalculator = new BalanceCalculatorService();
  }

  /**
   * Create a new expense.
   */
  async createExpense(
    userId: string,
    data: {
      groupId: string;
      paidBy: string;
      amount: number;
      description: string;
      category: string;
      receiptUrl?: string;
      splitType: SplitType;
      splits: Array<{
        userId: string;
        amount?: number;
        percentage?: number;
        share?: number;
      }>;
    }
  ): Promise<IExpenseDocument> {
    const group = await this.groupRepo.findById(data.groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    // Verify requesting user is a member of the group
    this.assertIsGroupMember(group, userId);

    // Verify payer is a member of the group
    this.assertIsGroupMember(group, data.paidBy);

    // Verify all split participants are members of the group
    const participantIds = data.splits.map((s) => s.userId);
    participantIds.forEach((id) => this.assertIsGroupMember(group, id));

    // Calculate splits
    const calculatedSplits = this.calculateSplits(data.amount, data.splitType, data.splits);

    const createdExpense = await this.expenseRepo.create({
      ...data,
      splits: calculatedSplits.map((s) => ({
        userId: s.userId,
        amount: s.amount,
        percentage: s.percentage,
        share: s.share,
      })),
    });

    // Fetch populated expense for socket emission
    const populatedExpense = await this.expenseRepo.findById(createdExpense._id.toString());
    if (populatedExpense) {
      emitToGroup(data.groupId, 'expense-added', populatedExpense);
    }

    // Compute updated balances and emit
    const balances = await this.balanceCalculator.calculateNetBalances(data.groupId, userId);
    emitToGroup(data.groupId, 'balance-updated', balances);

    return populatedExpense || createdExpense;
  }

  /**
   * Update an existing expense.
   */
  async updateExpense(
    expenseId: string,
    userId: string,
    data: Partial<{
      paidBy: string;
      amount: number;
      description: string;
      category: string;
      receiptUrl?: string;
      splitType: SplitType;
      splits: Array<{
        userId: string;
        amount?: number;
        percentage?: number;
        share?: number;
      }>;
    }>
  ): Promise<IExpenseDocument> {
    const expense = await this.expenseRepo.findById(expenseId);
    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    const group = await this.groupRepo.findById(expense.groupId.toString());
    if (!group) {
      throw new AppError('Group associated with expense not found', 404);
    }

    // Ensure user has permission to modify the expense (is payer or group owner)
    this.assertWritePrivilege(expense, group, userId);

    // If updating payer, check membership
    if (data.paidBy) {
      this.assertIsGroupMember(group, data.paidBy);
    }

    // If updating splits or amount, recalculate splits
    let updatedSplits = expense.splits;
    if (data.splits || data.amount || data.splitType) {
      const activeAmount = data.amount !== undefined ? data.amount : expense.amount;
      const activeSplitType = data.splitType !== undefined ? data.splitType : expense.splitType;
      const activeSplitsInput = data.splits !== undefined ? data.splits : expense.splits.map((s) => ({
        userId: s.userId.toString(),
        amount: s.amount,
        percentage: s.percentage,
        share: s.share,
      }));

      // Check membership for all participants
      const participantIds = activeSplitsInput.map((s) => s.userId);
      participantIds.forEach((id) => this.assertIsGroupMember(group, id));

      updatedSplits = this.calculateSplits(activeAmount, activeSplitType, activeSplitsInput);
    }

    const updatePayload = {
      ...data,
      splits: updatedSplits.map((s) => ({
        userId: s.userId,
        amount: s.amount,
        percentage: s.percentage,
        share: s.share,
      })),
    };

    const updatedExpense = await this.expenseRepo.update(expenseId, updatePayload);
    if (!updatedExpense) {
      throw new AppError('Failed to update expense', 500);
    }

    // Compute updated balances and emit
    const balances = await this.balanceCalculator.calculateNetBalances(
      expense.groupId.toString(),
      userId
    );
    emitToGroup(expense.groupId.toString(), 'balance-updated', balances);

    return updatedExpense;
  }

  /**
   * Delete an expense.
   */
  async deleteExpense(expenseId: string, userId: string): Promise<void> {
    const expense = await this.expenseRepo.findById(expenseId);
    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    const group = await this.groupRepo.findById(expense.groupId.toString());
    if (!group) {
      throw new AppError('Group associated with expense not found', 404);
    }

    // Ensure user has permission to modify the expense (is payer or group owner)
    this.assertWritePrivilege(expense, group, userId);

    await this.expenseRepo.delete(expenseId);

    // Compute updated balances and emit
    const balances = await this.balanceCalculator.calculateNetBalances(
      expense.groupId.toString(),
      userId
    );
    emitToGroup(expense.groupId.toString(), 'balance-updated', balances);
  }

  /**
   * List all expenses for a group.
   */
  async listGroupExpenses(groupId: string, userId: string): Promise<IExpenseDocument[]> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    // Verify requesting user is a member of the group
    this.assertIsGroupMember(group, userId);

    return this.expenseRepo.findByGroupId(groupId);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Asserts user belongs to the group.
   */
  private assertIsGroupMember(group: IGroupDocument, userId: string): void {
    const isMember = group.members.some(
      (m) => m.userId._id.toString() === userId
    );
    if (!isMember) {
      throw new AppError(`User ${userId} is not a member of group ${group.name}`, 400);
    }
  }

  /**
   * Asserts user has write permission (is payer or group owner).
   */
  private assertWritePrivilege(expense: IExpenseDocument, group: IGroupDocument, userId: string): void {
    const isPayer = expense.paidBy._id.toString() === userId;
    const isGroupOwner = group.members.some(
      (m) => m.userId._id.toString() === userId && m.role === 'owner'
    );

    if (!isPayer && !isGroupOwner) {
      throw new AppError('You do not have permission to modify or delete this expense', 403);
    }
  }

  /**
   * Core calculator resolving participant splits dynamically.
   */
  private calculateSplits(
    amount: number,
    splitType: SplitType,
    splitsInput: Array<{
      userId: string;
      amount?: number;
      percentage?: number;
      share?: number;
    }>
  ): IExpenseSplit[] {
    const N = splitsInput.length;
    if (N === 0) {
      throw new AppError('At least one split participant is required', 400);
    }

    const results: IExpenseSplit[] = [];

    if (splitType === 'equal') {
      const splitAmount = Math.floor((amount / N) * 100) / 100;
      const sum = splitAmount * N;
      const residual = Math.round((amount - sum) * 100) / 100;

      splitsInput.forEach((s, idx) => {
        results.push({
          userId: new mongoose.Types.ObjectId(s.userId),
          amount: idx === 0 ? Math.round((splitAmount + residual) * 100) / 100 : splitAmount,
        });
      });
    } else if (splitType === 'exact') {
      let sum = 0;
      splitsInput.forEach((s) => {
        if (s.amount === undefined || s.amount <= 0) {
          throw new AppError('Split amount is required and must be greater than 0 for exact splits', 400);
        }
        sum += s.amount;
        results.push({
          userId: new mongoose.Types.ObjectId(s.userId),
          amount: s.amount,
        });
      });

      if (Math.abs(sum - amount) > 0.01) {
        throw new AppError(`The sum of exact split amounts (${sum}) must equal the total expense amount (${amount})`, 400);
      }
    } else if (splitType === 'percentage') {
      let totalPct = 0;
      splitsInput.forEach((s) => {
        if (s.percentage === undefined || s.percentage <= 0) {
          throw new AppError('Split percentage is required and must be greater than 0 for percentage splits', 400);
        }
        totalPct += s.percentage;
      });

      if (Math.abs(totalPct - 100) > 0.01) {
        throw new AppError(`The sum of split percentages must equal exactly 100 (received ${totalPct})`, 400);
      }

      let calculatedSum = 0;
      splitsInput.forEach((s) => {
        const calculatedAmount = Math.floor(((s.percentage || 0) / 100) * amount * 100) / 100;
        calculatedSum += calculatedAmount;
        results.push({
          userId: new mongoose.Types.ObjectId(s.userId),
          amount: calculatedAmount,
          percentage: s.percentage,
        });
      });

      // Distribute rounding remainder to first element
      const residual = Math.round((amount - calculatedSum) * 100) / 100;
      if (results.length > 0) {
        results[0].amount = Math.round((results[0].amount + residual) * 100) / 100;
      }
    } else if (splitType === 'shares') {
      let totalShares = 0;
      splitsInput.forEach((s) => {
        if (s.share === undefined || s.share <= 0) {
          throw new AppError('Split share count is required and must be greater than 0 for shares splits', 400);
        }
        totalShares += s.share;
      });

      if (totalShares <= 0) {
        throw new AppError('Total shares count must be greater than 0', 400);
      }

      let calculatedSum = 0;
      splitsInput.forEach((s) => {
        const calculatedAmount = Math.floor(((s.share || 0) / totalShares) * amount * 100) / 100;
        calculatedSum += calculatedAmount;
        results.push({
          userId: new mongoose.Types.ObjectId(s.userId),
          amount: calculatedAmount,
          share: s.share,
        });
      });

      // Distribute rounding remainder to first element
      const residual = Math.round((amount - calculatedSum) * 100) / 100;
      if (results.length > 0) {
        results[0].amount = Math.round((results[0].amount + residual) * 100) / 100;
      }
    }

    return results;
  }
}
