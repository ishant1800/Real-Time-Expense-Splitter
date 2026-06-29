import { useQuery, useQueries } from '@tanstack/react-query';
import { groupApi, expenseApi, balanceApi } from '@/services/groupApi';
import { useAuthStore } from '@/store/useAuthStore';
import { groupKeys } from './useGroupQueries';
import type {
  Expense,
  ActivityItem,
  DashboardStats,
  SpendingCategory,
  NetBalance,
} from '@/types';

export function useDashboardData() {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || '';

  // 1. Fetch all user's groups
  const groupsQuery = useQuery({
    queryKey: groupKeys.all,
    queryFn: () => groupApi.listGroups(),
    enabled: !!currentUserId,
    staleTime: 30_000,
  });

  const groups = groupsQuery.data || [];

  // 2. Fetch expenses for all groups
  const expensesQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: groupKeys.expenses(g._id),
      queryFn: () => expenseApi.listExpenses(g._id),
      enabled: !!currentUserId && groups.length > 0,
      staleTime: 15_000,
    })),
  });

  // 3. Fetch balances for all groups
  const balancesQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: groupKeys.balances(g._id),
      queryFn: () => balanceApi.getBalances(g._id),
      enabled: !!currentUserId && groups.length > 0,
      staleTime: 15_000,
    })),
  });

  // 4. Fetch simplified debts for all groups to calculate user-to-user net balances
  const simplifiedQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: ['groups', g._id, 'simplify'],
      queryFn: () => balanceApi.getSimplifiedDebts(g._id),
      enabled: !!currentUserId && groups.length > 0,
      staleTime: 15_000,
    })),
  });

  const isLoading =
    groupsQuery.isLoading ||
    expensesQueries.some((q) => q.isLoading) ||
    balancesQueries.some((q) => q.isLoading) ||
    simplifiedQueries.some((q) => q.isLoading);

  const isError =
    groupsQuery.isError ||
    expensesQueries.some((q) => q.isError) ||
    balancesQueries.some((q) => q.isError) ||
    simplifiedQueries.some((q) => q.isError);

  // ─── Computations ──────────────────────────────────────────────────────────
  if (isLoading || isError || !currentUserId) {
    return {
      isLoading,
      isError,
      stats: { totalOwed: 0, totalReceivable: 0, groupCount: 0, expenseCount: 0 },
      groups: [],
      recentExpenses: [],
      activity: [],
      spending: [],
      netBalances: [],
      currentUser,
    };
  }

  // A. Expense list across all groups
  const allExpenses: (Expense & { groupName: string })[] = [];
  expensesQueries.forEach((query, index) => {
    if (query.data) {
      const group = groups[index];
      query.data.forEach((exp) => {
        allExpenses.push({
          ...exp,
          groupName: group.name,
        });
      });
    }
  });

  // Sort by date descending
  allExpenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recentExpenses = allExpenses.slice(0, 5);

  // B. Net balances across all groups for current user
  let totalOwed = 0;
  let totalReceivable = 0;

  balancesQueries.forEach((query) => {
    if (query.data) {
      const myBalanceItem = query.data.find((b) => b.userId === currentUserId);
      if (myBalanceItem) {
        if (myBalanceItem.balance < 0) {
          totalOwed += Math.abs(myBalanceItem.balance);
        } else if (myBalanceItem.balance > 0) {
          totalReceivable += myBalanceItem.balance;
        }
      }
    }
  });

  const stats: DashboardStats = {
    totalOwed,
    totalReceivable,
    groupCount: groups.length,
    expenseCount: allExpenses.length,
  };

  // C. Aggregated Net Balances per user (alex owes X, or X owes alex)
  const balanceAggregator: Record<string, { name: string; avatarUrl?: string; balance: number }> = {};

  simplifiedQueries.forEach((query, index) => {
    if (query.data) {
      const group = groups[index];
      query.data.forEach((debt) => {
        if (debt.from === currentUserId) {
          // Current user owes 'debt.to'
          const targetId = debt.to;
          const targetMember = group.members.find((m) => m.userId._id === targetId);
          const name = targetMember?.userId.name || 'Group Member';
          const avatarUrl = targetMember?.userId.avatarUrl;

          if (!balanceAggregator[targetId]) {
            balanceAggregator[targetId] = { name, avatarUrl, balance: 0 };
          }
          balanceAggregator[targetId].balance -= debt.amount;
        } else if (debt.to === currentUserId) {
          // 'debt.from' owes current user
          const targetId = debt.from;
          const targetMember = group.members.find((m) => m.userId._id === targetId);
          const name = targetMember?.userId.name || 'Group Member';
          const avatarUrl = targetMember?.userId.avatarUrl;

          if (!balanceAggregator[targetId]) {
            balanceAggregator[targetId] = { name, avatarUrl, balance: 0 };
          }
          balanceAggregator[targetId].balance += debt.amount;
        }
      });
    }
  });

  const netBalances: NetBalance[] = Object.entries(balanceAggregator)
    .map(([userId, val]) => ({
      userId,
      name: val.name,
      avatarUrl: val.avatarUrl,
      balance: Math.round(val.balance * 100) / 100,
    }))
    .filter((b) => b.balance !== 0);

  // D. Spending by Category for expenses paid by current user
  const categoryTotals: Record<string, number> = {};
  let totalUserSpent = 0;

  allExpenses.forEach((exp) => {
    if (exp.paidBy._id === currentUserId) {
      const cat = exp.category || 'other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
      totalUserSpent += exp.amount;
    }
  });

  const categoryColors: Record<string, string> = {
    food: '#8b5cf6',
    transport: '#06b6d4',
    entertainment: '#f59e0b',
    shopping: '#ec4899',
    utilities: '#3b82f6',
    rent: '#22c55e',
    travel: '#6366f1',
    health: '#ef4444',
    other: '#6b7280',
  };

  const spending: SpendingCategory[] = Object.entries(categoryTotals).map(([cat, amount]) => {
    const formattedCategory = cat.charAt(0).toUpperCase() + cat.slice(1);
    const percentage = totalUserSpent > 0 ? Math.round((amount / totalUserSpent) * 100) : 0;
    return {
      category: formattedCategory,
      amount,
      percentage,
      color: categoryColors[cat] || '#6b7280',
    };
  });

  // E. Dynamic Activity Feed
  const activity: ActivityItem[] = [];

  groups.forEach((g) => {
    // Member join activities
    g.members.forEach((m) => {
      activity.push({
        id: `act-join-${g._id}-${m.userId._id}`,
        type: 'member_joined',
        groupId: g._id,
        groupName: g.name,
        actorName: m.userId.name,
        actorAvatar: m.userId.avatarUrl,
        timestamp: g.createdAt,
      });
    });
  });

  allExpenses.forEach((exp) => {
    activity.push({
      id: `act-exp-${exp._id}`,
      type: 'expense_added',
      groupId: exp.groupId,
      groupName: exp.groupName,
      actorName: exp.paidBy.name,
      actorAvatar: exp.paidBy.avatarUrl,
      amount: exp.amount,
      description: exp.description,
      timestamp: exp.createdAt,
    });
  });

  // Sort by timestamp descending
  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const recentActivity = activity.slice(0, 10);

  return {
    isLoading: false,
    isError: false,
    stats,
    groups,
    recentExpenses,
    activity: recentActivity,
    spending,
    netBalances,
    currentUser,
  };
}
