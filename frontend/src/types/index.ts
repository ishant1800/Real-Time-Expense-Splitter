// ─── Shared TypeScript types used across the frontend ──────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface GroupMember {
  userId: User;
  role: 'owner' | 'member';
}

export interface Group {
  _id: string;
  name: string;
  inviteCode: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
  percentage?: number;
  shares?: number;
}

export interface Expense {
  _id: string;
  groupId: string;
  paidBy: User;
  amount: number;
  description: string;
  category: string;
  receiptUrl?: string;
  splits: ExpenseSplit[];
  splitType: 'equal' | 'exact' | 'percentage' | 'shares';
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  _id: string;
  groupId: string;
  from: User;
  to: User;
  amount: number;
  createdAt: string;
}

export interface NetBalance {
  userId: string;
  name: string;
  avatarUrl?: string;
  balance: number; // positive = owed to you, negative = you owe
}

export interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}

export type ActivityType =
  | 'expense_added'
  | 'expense_updated'
  | 'expense_deleted'
  | 'settlement_completed'
  | 'member_joined'
  | 'member_removed';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  groupId: string;
  groupName: string;
  actorName: string;
  actorAvatar?: string;
  targetName?: string;
  amount?: number;
  description?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalOwed: number;
  totalReceivable: number;
  groupCount: number;
  expenseCount: number;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}
