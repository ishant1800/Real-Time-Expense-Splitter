import type { Group, Expense, ActivityItem, DashboardStats, SpendingCategory, NetBalance } from '@/types';

// ─── Mock Data ──────────────────────────────────────────────────────────────
// Replace with real API calls via TanStack Query when backend is connected.

export const MOCK_USER = {
  _id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
};

export const MOCK_GROUPS: Group[] = [
  {
    _id: 'g1',
    name: 'Barcelona Trip 🇪🇸',
    inviteCode: 'BAR-2024',
    members: [
      { userId: { _id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com' }, role: 'owner' },
      { userId: { _id: 'user-2', name: 'Maria Garcia', email: 'maria@example.com' }, role: 'member' },
      { userId: { _id: 'user-3', name: 'Tom Wilson', email: 'tom@example.com' }, role: 'member' },
      { userId: { _id: 'user-4', name: 'Sara Lee', email: 'sara@example.com' }, role: 'member' },
    ],
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-28T18:00:00Z',
  },
  {
    _id: 'g2',
    name: 'Apartment Rent 🏠',
    inviteCode: 'APT-HOME',
    members: [
      { userId: { _id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com' }, role: 'owner' },
      { userId: { _id: 'user-2', name: 'Maria Garcia', email: 'maria@example.com' }, role: 'member' },
      { userId: { _id: 'user-5', name: 'James Brown', email: 'james@example.com' }, role: 'member' },
    ],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-06-25T10:00:00Z',
  },
  {
    _id: 'g3',
    name: 'Office Lunch 🍕',
    inviteCode: 'OFC-LNC',
    members: [
      { userId: { _id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com' }, role: 'member' },
      { userId: { _id: 'user-3', name: 'Tom Wilson', email: 'tom@example.com' }, role: 'owner' },
      { userId: { _id: 'user-6', name: 'Priya Patel', email: 'priya@example.com' }, role: 'member' },
      { userId: { _id: 'user-7', name: 'Chris Evans', email: 'chris@example.com' }, role: 'member' },
      { userId: { _id: 'user-8', name: 'Lena Kim', email: 'lena@example.com' }, role: 'member' },
    ],
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2024-06-29T12:00:00Z',
  },
];

export const MOCK_RECENT_EXPENSES: Expense[] = [
  {
    _id: 'e1',
    groupId: 'g1',
    paidBy: { _id: 'user-2', name: 'Maria Garcia', email: 'maria@example.com' },
    amount: 248.5,
    description: 'Hotel booking — 2 nights',
    category: 'travel',
    splits: [],
    splitType: 'equal',
    createdAt: '2024-06-28T14:30:00Z',
    updatedAt: '2024-06-28T14:30:00Z',
  },
  {
    _id: 'e2',
    groupId: 'g3',
    paidBy: { _id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com' },
    amount: 87.4,
    description: 'Team lunch at Chipotle',
    category: 'food',
    splits: [],
    splitType: 'equal',
    createdAt: '2024-06-28T13:00:00Z',
    updatedAt: '2024-06-28T13:00:00Z',
  },
  {
    _id: 'e3',
    groupId: 'g2',
    paidBy: { _id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com' },
    amount: 1800,
    description: 'Monthly rent — July',
    category: 'rent',
    splits: [],
    splitType: 'equal',
    createdAt: '2024-06-27T09:00:00Z',
    updatedAt: '2024-06-27T09:00:00Z',
  },
  {
    _id: 'e4',
    groupId: 'g1',
    paidBy: { _id: 'user-3', name: 'Tom Wilson', email: 'tom@example.com' },
    amount: 64.0,
    description: 'Tapas dinner',
    category: 'food',
    splits: [],
    splitType: 'equal',
    createdAt: '2024-06-26T20:00:00Z',
    updatedAt: '2024-06-26T20:00:00Z',
  },
  {
    _id: 'e5',
    groupId: 'g1',
    paidBy: { _id: 'user-4', name: 'Sara Lee', email: 'sara@example.com' },
    amount: 120,
    description: 'Museum tickets',
    category: 'entertainment',
    splits: [],
    splitType: 'equal',
    createdAt: '2024-06-25T11:00:00Z',
    updatedAt: '2024-06-25T11:00:00Z',
  },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    type: 'expense_added',
    groupId: 'g1',
    groupName: 'Barcelona Trip 🇪🇸',
    actorName: 'Maria Garcia',
    amount: 248.5,
    description: 'Hotel booking — 2 nights',
    timestamp: '2024-06-28T14:30:00Z',
  },
  {
    id: 'a2',
    type: 'settlement_completed',
    groupId: 'g2',
    groupName: 'Apartment Rent 🏠',
    actorName: 'James Brown',
    targetName: 'Alex Johnson',
    amount: 600,
    timestamp: '2024-06-28T11:00:00Z',
  },
  {
    id: 'a3',
    type: 'expense_added',
    groupId: 'g3',
    groupName: 'Office Lunch 🍕',
    actorName: 'Alex Johnson',
    amount: 87.4,
    description: 'Team lunch at Chipotle',
    timestamp: '2024-06-28T13:00:00Z',
  },
  {
    id: 'a4',
    type: 'member_joined',
    groupId: 'g1',
    groupName: 'Barcelona Trip 🇪🇸',
    actorName: 'Sara Lee',
    timestamp: '2024-06-24T09:15:00Z',
  },
  {
    id: 'a5',
    type: 'expense_updated',
    groupId: 'g2',
    groupName: 'Apartment Rent 🏠',
    actorName: 'Alex Johnson',
    amount: 1800,
    description: 'Monthly rent — July',
    timestamp: '2024-06-27T09:10:00Z',
  },
  {
    id: 'a6',
    type: 'settlement_completed',
    groupId: 'g3',
    groupName: 'Office Lunch 🍕',
    actorName: 'Priya Patel',
    targetName: 'Tom Wilson',
    amount: 29.13,
    timestamp: '2024-06-26T15:00:00Z',
  },
];

export const MOCK_STATS: DashboardStats = {
  totalOwed: 312.45,
  totalReceivable: 680.20,
  groupCount: 3,
  expenseCount: 24,
};

export const MOCK_NET_BALANCES: NetBalance[] = [
  { userId: 'user-2', name: 'Maria Garcia', balance: -248.5 },
  { userId: 'user-3', name: 'Tom Wilson', balance: 124.25 },
  { userId: 'user-4', name: 'Sara Lee', balance: -63.95 },
  { userId: 'user-5', name: 'James Brown', balance: 200 },
];

export const MOCK_SPENDING: SpendingCategory[] = [
  { category: 'Travel', amount: 432.5, percentage: 42, color: '#6366f1' },
  { category: 'Food', amount: 281.4, percentage: 27, color: '#8b5cf6' },
  { category: 'Rent', amount: 1800, percentage: 20, color: '#22c55e' },
  { category: 'Entertainment', amount: 120, percentage: 8, color: '#f59e0b' },
  { category: 'Other', amount: 30, percentage: 3, color: '#6b7280' },
];
