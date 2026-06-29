import { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { groupApi, expenseApi } from '@/services/groupApi';
import { groupKeys } from '@/hooks/useGroupQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate, getCategoryIcon } from '@/lib/utils';
import type { Expense } from '@/types';

export default function Expenses() {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || '';

  const [filterText, setFilterText] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // 1. Fetch user's groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: groupKeys.all,
    queryFn: () => groupApi.listGroups(),
  });

  // 2. Fetch expenses for all groups
  const expensesQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: groupKeys.expenses(g._id),
      queryFn: () => expenseApi.listExpenses(g._id),
      enabled: !!g._id,
    })),
  });

  const isLoadingExpenses = expensesQueries.some((q) => q.isLoading);

  // Combine and enrich expenses with group name info
  const allExpenses: (Expense & { groupName: string })[] = expensesQueries
    .flatMap((q, index) => {
      const g = groups[index];
      const list = (q.data as Expense[]) || [];
      return list.map((exp: Expense) => ({
        ...exp,
        groupName: g?.name || 'Group',
      }));
    });

  // Filter and Sort
  const filtered = allExpenses
    .filter((exp) => {
      const matchText = exp.description.toLowerCase().includes(filterText.toLowerCase());
      const matchGroup = selectedGroupId ? exp.groupId === selectedGroupId : true;
      const matchCat = selectedCategory ? exp.category === selectedCategory : true;
      return matchText && matchGroup && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (isLoadingGroups || isLoadingExpenses) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-surface-elevated rounded-xl animate-pulse" />
        <CardSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Expenses</h1>
          <p className="text-sm text-foreground-subtle mt-1">All shared expenses across all your groups</p>
        </div>
      </div>

      <Card className="p-5">
        <CardHeader title="All Expenses" subtitle={`${filtered.length} matched`} icon="🧾" className="mb-4" />

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search descriptions..."
            className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent/40"
          />

          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2 text-sm text-foreground cursor-pointer"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2 text-sm text-foreground cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="food">🍔 Food</option>
            <option value="transport">🚗 Transport</option>
            <option value="entertainment">🎬 Entertainment</option>
            <option value="shopping">🛍️ Shopping</option>
            <option value="utilities">💡 Utilities</option>
            <option value="rent">🏠 Rent</option>
            <option value="travel">✈️ Travel</option>
            <option value="health">🏥 Health</option>
            <option value="other">💰 Other</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
            className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2 text-sm text-foreground cursor-pointer"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No expenses found"
            description="Add expenses inside your groups to track them here."
          />
        ) : (
          <div className="space-y-1">
            {filtered.map((expense) => {
              const isPaidByMe = expense.paidBy._id === currentUserId;
              const myShare = expense.splits.find((s) => s.userId === currentUserId)?.amount
                ?? expense.amount / Math.max(expense.splits.length, 1);

              return (
                <div
                  key={expense._id}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-elevated transition-all duration-200"
                >
                  <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center text-lg shrink-0">
                    {getCategoryIcon(expense.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={expense.paidBy.name} size="xs" />
                        <span className="text-xs text-foreground-subtle">
                          {isPaidByMe ? 'You' : expense.paidBy.name} paid
                        </span>
                      </div>
                      <span className="text-foreground-subtle text-xs">·</span>
                      <span className="text-xs text-accent-light font-medium">{expense.groupName}</span>
                      <span className="text-foreground-subtle text-xs">·</span>
                      <span className="text-xs text-foreground-subtle">{formatDate(expense.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-sm font-bold text-foreground">{formatCurrency(expense.amount)}</p>
                    <Badge variant={isPaidByMe ? 'success' : 'danger'}>
                      {isPaidByMe
                        ? `get back ${formatCurrency(expense.amount - myShare)}`
                        : `your share ${formatCurrency(myShare)}`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
