import mongoose from 'mongoose';
import Expense, { IExpenseDocument } from '../models/expense.model';

export class ExpenseRepository {
  /**
   * Create a new expense.
   */
  async create(data: {
    groupId: string;
    paidBy: string;
    amount: number;
    description: string;
    category: string;
    receiptUrl?: string;
    splitType: string;
    splits: Array<{
      userId: string | mongoose.Types.ObjectId;
      amount: number;
      percentage?: number;
      share?: number;
    }>;
  }): Promise<IExpenseDocument> {
    const expense = new Expense(data);
    return expense.save();
  }

  /**
   * Find an expense by ID, populating details.
   */
  async findById(expenseId: string): Promise<IExpenseDocument | null> {
    return Expense.findById(expenseId)
      .populate('paidBy', 'name email avatar')
      .populate('splits.userId', 'name email avatar')
      .populate('groupId');
  }

  /**
   * List all expenses inside a group.
   */
  async findByGroupId(groupId: string): Promise<IExpenseDocument[]> {
    return Expense.find({ groupId })
      .populate('paidBy', 'name email avatar')
      .populate('splits.userId', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  /**
   * Update an expense.
   */
  async update(
    expenseId: string,
    data: Partial<{
      paidBy: string;
      amount: number;
      description: string;
      category: string;
      receiptUrl?: string;
      splitType: string;
      splits: Array<{
        userId: string | mongoose.Types.ObjectId;
        amount: number;
        percentage?: number;
        share?: number;
      }>;
    }>
  ): Promise<IExpenseDocument | null> {
    return Expense.findByIdAndUpdate(
      expenseId,
      { $set: data },
      { returnDocument: 'after' }
    )
      .populate('paidBy', 'name email avatar')
      .populate('splits.userId', 'name email avatar')
      .populate('groupId');
  }

  /**
   * Delete an expense.
   */
  async delete(expenseId: string): Promise<void> {
    await Expense.findByIdAndDelete(expenseId);
  }
}
