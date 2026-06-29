import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StatsSection } from '@/components/dashboard/StatsSection';
import { GroupsSection } from '@/components/dashboard/GroupsSection';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { SpendingSummary } from '@/components/dashboard/SpendingSummary';
import { BalancePanel } from '@/components/dashboard/BalancePanel';
import { AddExpenseModal } from '@/components/group/AddExpenseModal';
import { SettleModal } from '@/components/group/SettleModal';
import { CreateGroupModal } from '@/components/group/CreateGroupModal';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useCreateGroup, groupKeys } from '@/hooks/useGroupQueries';
import { expenseApi } from '@/services/groupApi';
import type { CreateExpensePayload } from '@/services/groupApi';
import { useToastStore } from '@/store/useToastStore';
import { CardSkeleton } from '@/components/ui/Skeleton';
import PageWrapper from '@/components/ui/PageWrapper';
import { Button } from '@/components/ui/Button';
import { motion, Variants } from 'framer-motion';

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

  // Modals state
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

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // slideInDown variants for page header
  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-8 py-4 text-left">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="h-12 w-48 bg-white/5 border border-white/5 rounded-xl animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-28 bg-white/5 border border-white/5 rounded-xl animate-pulse" />
            <div className="h-10 w-28 bg-white/5 border border-white/5 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="p-12 text-center space-y-4">
        <p className="text-rose-500 font-bold text-lg">Failed to load dashboard data.</p>
        <p className="text-gray-500 text-sm">Please check your connection and try again.</p>
      </div>
    );
  }

  const TOTAL_SPENDING = spending.reduce((acc, c) => acc + c.amount, 0);
  const username = currentUser.name || 'User';

  return (
    <PageWrapper className="min-h-0 bg-transparent space-y-8 pb-10">
      
      {/* 1. slideInDown Page Header */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between flex-wrap gap-5 border-b border-white/5 pb-6 text-left"
      >
        <div>
          <h1 className="font-heading text-white font-extrabold text-2xl tracking-tight leading-tight">
            {greeting}, {username.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-xs mt-1 font-semibold select-none">
            {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {groups.length > 0 && (
            <Button
              id="add-expense-btn"
              onClick={() => setIsAddExpenseOpen(true)}
              variant="primary"
              size="md"
            >
              + Add Expense
            </Button>
          )}
          <Button
            id="create-group-btn"
            onClick={() => setIsCreateGroupOpen(true)}
            variant="outline"
            size="md"
          >
            New Group
          </Button>
          {netBalances.length > 0 && (
            <Button
              id="settle-up-btn"
              onClick={() => setIsSettleOpen(true)}
              variant="outline"
              size="md"
              className="text-[#10b981] hover:text-[#0ea572]"
            >
              Settle Up
            </Button>
          )}
        </div>
      </motion.div>

      {/* 2. Stats Section */}
      <StatsSection stats={stats} totalSpent={TOTAL_SPENDING} />

      {/* 3. Groups Section */}
      <GroupsSection
        groups={groups}
        currentUserId={currentUser._id}
        onNewGroup={() => setIsCreateGroupOpen(true)}
      />

      {/* 4. Grid - Expenses & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentExpenses expenses={recentExpenses} currentUserId={currentUser._id} />
        <ActivityFeed items={activity} />
      </div>

      {/* 5. Grid - Spending & Net Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingSummary categories={spending} totalSpending={TOTAL_SPENDING} />
        <BalancePanel
          balances={netBalances}
          onSettle={() => setIsSettleOpen(true)}
        />
      </div>

      {/* Modals mount layer */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSubmit={handleCreateGroup}
        isLoading={createGroupMutation.isPending}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groups={groups}
        currentUserId={currentUser._id}
        onSubmit={handleAddExpense}
        isLoading={createExpenseMutation.isPending}
      />

      <SettleModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        groups={groups}
        currentUserId={currentUser._id}
      />
    </PageWrapper>
  );
}
