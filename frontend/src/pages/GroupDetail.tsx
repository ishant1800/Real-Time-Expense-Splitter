import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { MembersPanel } from '@/components/group/MembersPanel';
import { ExpenseList } from '@/components/group/ExpenseList';
import { BalanceBoard } from '@/components/group/BalanceBoard';
import { SettlementHistory } from '@/components/group/SettlementHistory';
import { AddExpenseModal } from '@/components/group/AddExpenseModal';
import { CardSkeleton } from '@/components/ui/Skeleton';

import {
  useGroup,
  useExpenses,
  useBalances,
  useSettlements,
  useCreateExpense,
  useDeleteExpense,
  useCreateSettlement,
  useRemoveMember,
  groupKeys,
} from '@/hooks/useGroupQueries';
import { useGroupSocket } from '@/hooks/useGroupSocket';
import { MOCK_USER } from '@/hooks/useDashboardData';
import {
  MOCK_GROUP_DETAIL,
  MOCK_GROUP_EXPENSES,
  MOCK_GROUP_BALANCES,
  MOCK_GROUP_SETTLEMENTS,
} from '@/hooks/useGroupMockData';
import type { CreateExpensePayload } from '@/services/groupApi';
import { formatDate } from '@/lib/utils';

// ─── Tab configuration ────────────────────────────────────────────────────────
type Tab = 'expenses' | 'balances' | 'settlements' | 'members';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'expenses', label: 'Expenses', icon: '🧾' },
  { key: 'balances', label: 'Balances', icon: '⚖️' },
  { key: 'settlements', label: 'Settlements', icon: '✅' },
  { key: 'members', label: 'Members', icon: '👥' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function GroupDetail() {
  const { groupId = '' } = useParams();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [socketActivity, setSocketActivity] = useState<string[]>([]);

  // ─── Data queries ───────────────────────────────────────────────────────────
  const groupQuery = useGroup(groupId);
  const expensesQuery = useExpenses(groupId);
  const balancesQuery = useBalances(groupId);
  const settlementsQuery = useSettlements(groupId);

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const createExpense = useCreateExpense(groupId);
  const deleteExpense = useDeleteExpense(groupId);
  const createSettlement = useCreateSettlement(groupId);
  const removeMember = useRemoveMember(groupId);

  // ─── Socket.io integration (logic-free, just invalidates caches) ────────────
  const handleExpenseAdded = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: groupKeys.expenses(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
    setSocketActivity(prev => [`Expense added by another member`, ...prev.slice(0, 4)]);
  }, [groupId, queryClient]);

  const handleBalanceUpdated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
    setSocketActivity(prev => [`Balances updated`, ...prev.slice(0, 4)]);
  }, [groupId, queryClient]);

  const handleSettlementCompleted = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: groupKeys.settlements(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
    setSocketActivity(prev => [`Settlement completed`, ...prev.slice(0, 4)]);
  }, [groupId, queryClient]);

  useGroupSocket(groupId, {
    onExpenseAdded: handleExpenseAdded,
    onBalanceUpdated: handleBalanceUpdated,
    onSettlementCompleted: handleSettlementCompleted,
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleAddExpense = async (payload: CreateExpensePayload) => {
    await createExpense.mutateAsync(payload);
  };

  const handleDeleteExpense = (expenseId: string) => {
    deleteExpense.mutate(expenseId);
  };

  const handleSettle = (toUserId: string, amount: number) => {
    createSettlement.mutate(
      { from: MOCK_USER._id, to: toUserId, amount },
      { onSuccess: () => setActiveTab('settlements') },
    );
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate(userId);
  };

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (groupQuery.isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-surface-elevated rounded-xl animate-pulse" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <CardSkeleton rows={5} />
          </div>
          <div className="space-y-4">
            <CardSkeleton rows={3} />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state: fall back to mock data in dev mode ────────────────────────
  const isDevMode = groupQuery.isError || !groupQuery.data;

  const group = groupQuery.data ?? MOCK_GROUP_DETAIL;
  const expenses = expensesQuery.data ?? (isDevMode ? MOCK_GROUP_EXPENSES : []);
  const balances = balancesQuery.data ?? (isDevMode ? MOCK_GROUP_BALANCES : []);
  const settlements = settlementsQuery.data ?? (isDevMode ? MOCK_GROUP_SETTLEMENTS : []);
  const currentUserId = MOCK_USER._id;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dev mode banner */}
      {isDevMode && (
        <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning/20 rounded-xl text-sm text-warning">
          <span>⚠️</span>
          <span className="font-medium">Demo mode:</span>
          <span className="text-warning/80">Backend not connected — showing mock data. Start the backend server to use live data.</span>
        </div>
      )}
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-foreground-subtle mb-2">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-foreground">{group.name}</span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            {group.name}
          </h1>
          <p className="text-sm text-foreground-subtle mt-1">
            {group.members.length} members · Created {formatDate(group.createdAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Socket live indicator */}
          <div className="flex items-center gap-1.5 bg-surface-elevated border border-surface-border rounded-xl px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-xs text-success font-medium">Live</span>
            {socketActivity[0] && (
              <span className="text-xs text-foreground-subtle hidden sm:block">· {socketActivity[0]}</span>
            )}
          </div>

          <button
            id="group-add-expense-btn"
            onClick={() => setIsExpenseModalOpen(true)}
            className="btn-primary"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-surface border border-surface-border rounded-2xl p-1.5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab.key
                ? 'bg-accent/15 text-accent-light border border-accent/20 shadow-glow'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-elevated'}
            `}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {/* Badge counts */}
            {tab.key === 'expenses' && expenses.length > 0 && (
              <span className="text-xs bg-accent/20 text-accent-light rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {expenses.length}
              </span>
            )}
            {tab.key === 'members' && (
              <span className="text-xs bg-surface-elevated text-foreground-muted rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {group.members.length}
              </span>
            )}
            {tab.key === 'settlements' && settlements.length > 0 && (
              <span className="text-xs bg-success/20 text-success rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {settlements.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'expenses' && (
            expensesQuery.isLoading ? (
              <CardSkeleton rows={5} />
            ) : (
              <ExpenseList
                expenses={expenses}
                currentUserId={currentUserId}
                onAddExpense={() => setIsExpenseModalOpen(true)}
                onDeleteExpense={handleDeleteExpense}
                isDeleting={deleteExpense.isPending}
              />
            )
          )}

          {activeTab === 'balances' && (
            balancesQuery.isLoading ? (
              <CardSkeleton rows={4} />
            ) : (
              <BalanceBoard
                balances={balances}
                group={group}
                currentUserId={currentUserId}
                onSettle={handleSettle}
              />
            )
          )}

          {activeTab === 'settlements' && (
            settlementsQuery.isLoading ? (
              <CardSkeleton rows={4} />
            ) : (
              <SettlementHistory
                settlements={settlements}
                currentUserId={currentUserId}
              />
            )
          )}

          {activeTab === 'members' && (
            <MembersPanel
              group={group}
              currentUserId={currentUserId}
              onRemoveMember={handleRemoveMember}
              isRemoving={removeMember.isPending}
            />
          )}
        </div>

        {/* Sidebar — always shows summary info */}
        <div className="space-y-4">
          {/* Quick balance summary */}
          {balancesQuery.isLoading ? (
            <CardSkeleton rows={3} />
          ) : (
            <BalanceBoard
              balances={balances}
              group={group}
              currentUserId={currentUserId}
              onSettle={handleSettle}
            />
          )}

          {/* Members mini list */}
          <MembersPanel
            group={group}
            currentUserId={currentUserId}
            onRemoveMember={handleRemoveMember}
            isRemoving={removeMember.isPending}
          />
        </div>
      </div>

      {/* ── Add Expense Modal ──────────────────────────────────────────────── */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        group={group}
        currentUserId={currentUserId}
        onSubmit={handleAddExpense}
        isLoading={createExpense.isPending}
      />
    </div>
  );
}
