/**
 * Mock data for the Group Detail page.
 * Used when the backend is not running (development/demo mode).
 * These are automatically used if the API returns an error.
 */
import type { Group, Expense, NetBalance, Settlement } from '@/types';

export const MOCK_GROUP_DETAIL: Group = {
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
};

export const MOCK_GROUP_EXPENSES: Expense[] = [
  {
    _id: 'e1',
    groupId: 'g1',
    paidBy: { _id: 'user-2', name: 'Maria Garcia', email: 'maria@example.com' },
    amount: 248.5,
    description: 'Hotel booking — 2 nights',
    category: 'travel',
    splits: [
      { userId: 'user-1', amount: 62.125 },
      { userId: 'user-2', amount: 62.125 },
      { userId: 'user-3', amount: 62.125 },
      { userId: 'user-4', amount: 62.125 },
    ],
    splitType: 'equal',
    createdAt: '2024-06-28T14:30:00Z',
    updatedAt: '2024-06-28T14:30:00Z',
  },
  {
    _id: 'e2',
    groupId: 'g1',
    paidBy: { _id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com' },
    amount: 87.4,
    description: 'Team lunch at La Boqueria',
    category: 'food',
    splits: [
      { userId: 'user-1', amount: 21.85 },
      { userId: 'user-2', amount: 21.85 },
      { userId: 'user-3', amount: 21.85 },
      { userId: 'user-4', amount: 21.85 },
    ],
    splitType: 'equal',
    createdAt: '2024-06-27T13:00:00Z',
    updatedAt: '2024-06-27T13:00:00Z',
  },
  {
    _id: 'e3',
    groupId: 'g1',
    paidBy: { _id: 'user-3', name: 'Tom Wilson', email: 'tom@example.com' },
    amount: 64.0,
    description: 'Tapas dinner at El Xampanyet',
    category: 'food',
    splits: [
      { userId: 'user-1', amount: 16 },
      { userId: 'user-2', amount: 16 },
      { userId: 'user-3', amount: 16 },
      { userId: 'user-4', amount: 16 },
    ],
    splitType: 'equal',
    createdAt: '2024-06-26T20:00:00Z',
    updatedAt: '2024-06-26T20:00:00Z',
  },
  {
    _id: 'e4',
    groupId: 'g1',
    paidBy: { _id: 'user-4', name: 'Sara Lee', email: 'sara@example.com' },
    amount: 120.0,
    description: 'Sagrada Familia tickets',
    category: 'entertainment',
    splits: [
      { userId: 'user-1', amount: 30 },
      { userId: 'user-2', amount: 30 },
      { userId: 'user-3', amount: 30 },
      { userId: 'user-4', amount: 30 },
    ],
    splitType: 'equal',
    createdAt: '2024-06-25T11:00:00Z',
    updatedAt: '2024-06-25T11:00:00Z',
  },
  {
    _id: 'e5',
    groupId: 'g1',
    paidBy: { _id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com' },
    amount: 45.0,
    description: 'Airport taxi',
    category: 'transport',
    splits: [
      { userId: 'user-1', amount: 11.25 },
      { userId: 'user-2', amount: 11.25 },
      { userId: 'user-3', amount: 11.25 },
      { userId: 'user-4', amount: 11.25 },
    ],
    splitType: 'equal',
    createdAt: '2024-06-25T08:00:00Z',
    updatedAt: '2024-06-25T08:00:00Z',
  },
];

export const MOCK_GROUP_BALANCES: NetBalance[] = [
  { userId: 'user-1', name: 'Alex Johnson', balance: 79.05 },
  { userId: 'user-2', name: 'Maria Garcia', balance: -186.375 },
  { userId: 'user-3', name: 'Tom Wilson', balance: 17.125 },
  { userId: 'user-4', name: 'Sara Lee', balance: 90.2 },
];

export const MOCK_GROUP_SETTLEMENTS: Settlement[] = [
  {
    _id: 's1',
    groupId: 'g1',
    from: { _id: 'user-2', name: 'Maria Garcia', email: 'maria@example.com' },
    to: { _id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com' },
    amount: 62.125,
    createdAt: '2024-06-27T16:00:00Z',
  },
  {
    _id: 's2',
    groupId: 'g1',
    from: { _id: 'user-2', name: 'Maria Garcia', email: 'maria@example.com' },
    to: { _id: 'user-4', name: 'Sara Lee', email: 'sara@example.com' },
    amount: 30.0,
    createdAt: '2024-06-26T12:00:00Z',
  },
];
