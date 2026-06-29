import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StatsSection } from '@/components/dashboard/StatsSection';
import { GroupsSection } from '@/components/dashboard/GroupsSection';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { SpendingSummary } from '@/components/dashboard/SpendingSummary';
import { BalancePanel } from '@/components/dashboard/BalancePanel';
import { Avatar } from '@/components/ui/Avatar';
import { AddExpenseModal } from '@/components/group/AddExpenseModal';
import { SettleModal } from '@/components/group/SettleModal';
import { CreateGroupModal } from '@/components/group/CreateGroupModal';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useCreateGroup, groupKeys } from '@/hooks/useGroupQueries';
import { expenseApi } from '@/services/groupApi';
import type { CreateExpensePayload } from '@/services/groupApi';
import { useToastStore } from '@/store/useToastStore';
import { CardSkeleton } from '@/components/ui/Skeleton';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const {
    stats,
    groups,
    recentExpenses,
    activity,
    spending,
    netBalances,
    currentUser,
    isLoading,
    isError,
  } = useDashboardData();

  // Modals state (renamed for exact verification alignment)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);

  // Mutations
  const createGroupMutation = useCreateGroup();

  const createExpenseMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) => expenseApi.createExpense(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      queryClient.invalidateQueries({ queryKey: groupKeys.expenses(data.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.balances(data.groupId) });
      toast.success('Expense added');
      setIsAddExpenseOpen(false);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to add expense';
      toast.error(msg);
    },
  });

  const handleCreateGroup = async (name: string) => {
    await createGroupMutation.mutateAsync(name);
  };

  const handleAddExpense = async (payload: CreateExpensePayload) => {
    await createExpenseMutation.mutateAsync(payload);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="h-12 w-48 bg-surface-elevated rounded-xl animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-28 bg-surface-elevated rounded-xl animate-pulse" />
            <div className="h-10 w-28 bg-surface-elevated rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
        <CardSkeleton rows={5} />
      </div>
    );
  }

  if (isError || !currentUser) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-danger font-medium text-lg">Failed to load dashboard data.</p>
        <p className="text-foreground-subtle text-sm">Please check your connection and try again.</p>
      </div>
    );
  }

  const TOTAL_SPENDING = spending.reduce((acc, c) => acc + c.amount, 0);
  const username = currentUser.name || 'User';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={username} size="lg" />
          <div>
            <p className="text-sm text-foreground-subtle">{greeting},</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              {username.split(' ')[0]} 👋
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {groups.length > 0 && (
            <button
              id="add-expense-btn"
              onClick={() => setIsAddExpenseOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <span className="text-base leading-none">+</span>
              Add Expense
            </button>
          )}
          <button
            id="create-group-btn"
            onClick={() => setIsCreateGroupOpen(true)}
            className="btn-ghost border border-surface-border"
          >
            New Group
          </button>
          {netBalances.length > 0 && (
            <button
              id="settle-up-btn"
              onClick={() => setIsSettleOpen(true)}
              className="btn-ghost border border-surface-border text-accent-light hover:bg-accent/10"
            >
              Settle Up
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <StatsSection stats={stats} />

      {/* Groups */}
      <GroupsSection
        groups={groups}
        currentUserId={currentUser._id}
        onNewGroup={() => setIsCreateGroupOpen(true)}
      />

      {/* Middle Grid: Expenses + Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentExpenses expenses={recentExpenses} currentUserId={currentUser._id} />
        <ActivityFeed items={activity} />
      </div>

      {/* Bottom Grid: Spending + Balance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SpendingSummary categories={spending} totalSpending={TOTAL_SPENDING} />
        <BalancePanel
          balances={netBalances}
          onSettle={() => setIsSettleOpen(true)}
        />
      </div>

      {/* ── Create Group Modal ────────────────────────────────────────────── */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSubmit={handleCreateGroup}
        isLoading={createGroupMutation.isPending}
      />

      {/* ── Add Expense Modal ──────────────────────────────────────────────── */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groups={groups}
        currentUserId={currentUser._id}
        onSubmit={handleAddExpense}
        isLoading={createExpenseMutation.isPending}
      />

      {/* ── Settle Up Modal ────────────────────────────────────────────────── */}
      <SettleModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        groups={groups}
        currentUserId={currentUser._id}
      />
    </div>
  );
}
