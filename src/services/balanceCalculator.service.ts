import { GroupRepository } from '../repositories/group.repository';
import { ExpenseRepository } from '../repositories/expense.repository';
import { SettlementRepository } from '../repositories/settlement.repository';
import { AppError } from '../utils/AppError';

export interface UserBalanceResult {
  userId: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  netBalance: number;
}

export class BalanceCalculatorService {
  private groupRepo: GroupRepository;
  private expenseRepo: ExpenseRepository;
  private settlementRepo: SettlementRepository;

  constructor() {
    this.groupRepo = new GroupRepository();
    this.expenseRepo = new ExpenseRepository();
    this.settlementRepo = new SettlementRepository();
  }

  /**
   * Calculate each user's net balance within a group.
   * Positive net balance = user is owed money
   * Negative net balance = user owes money
   * Zero net balance = user is fully settled
   */
  async calculateNetBalances(groupId: string, userId: string): Promise<UserBalanceResult[]> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    // Verify requesting user is a member of the group
    const isMember = group.members.some(
      (m) => m.userId._id.toString() === userId
    );
    if (!isMember) {
      throw new AppError('Only group members can view the group balances', 403);
    }

    // Fetch all group expenses and settlements
    const expenses = await this.expenseRepo.findByGroupId(groupId);
    const settlements = await this.settlementRepo.findByGroupId(groupId);

    // Initialize balance map for each member
    const balances: Record<string, number> = {};
    group.members.forEach((m) => {
      balances[m.userId._id.toString()] = 0;
    });

    // 1. Process Expenses: Payer gets (+) paid amount, split participants get (-) split amount
    expenses.forEach((expense) => {
      const payerId = expense.paidBy._id.toString();
      if (balances[payerId] !== undefined) {
        balances[payerId] += expense.amount;
      }

      expense.splits.forEach((split) => {
        const participantId = split.userId._id.toString();
        if (balances[participantId] !== undefined) {
          balances[participantId] -= split.amount;
        }
      });
    });

    // 2. Process Settlements: Sender gets (+) sent amount (reduces debt), receiver gets (-) received amount
    settlements.forEach((settlement) => {
      const senderId = settlement.from._id.toString();
      const receiverId = settlement.to._id.toString();

      if (balances[senderId] !== undefined) {
        balances[senderId] += settlement.amount;
      }

      if (balances[receiverId] !== undefined) {
        balances[receiverId] -= settlement.amount;
      }
    });

    // 3. Assemble and round balances
    return group.members.map((m) => {
      const memberUserId = m.userId._id.toString();
      const rawBalance = balances[memberUserId] || 0;
      const netBalance = Math.round(rawBalance * 100) / 100;

      return {
        userId: memberUserId,
        user: {
          name: (m.userId as any).name || '',
          email: (m.userId as any).email || '',
          avatar: (m.userId as any).avatar,
        },
        netBalance,
      };
    });
  }
}
