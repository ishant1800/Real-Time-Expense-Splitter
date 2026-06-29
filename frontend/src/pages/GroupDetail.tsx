import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { MembersPanel } from '@/components/group/MembersPanel';
import { ExpenseList } from '@/components/group/ExpenseList';
import { BalanceBoard } from '@/components/group/BalanceBoard';
import { SettlementHistory } from '@/components/group/SettlementHistory';
import { AddExpenseModal } from '@/components/group/AddExpenseModal';
import { SettleModal } from '@/components/group/SettleModal';
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
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { groupApi } from '@/services/groupApi';
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || '';

  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [socketActivity, setSocketActivity] = useState<string[]>([]);

  // ─── Data queries ───────────────────────────────────────────────────────────
  const groupQuery = useQueryClient().getQueryState(groupKeys.detail(groupId))
    ? useGroup(groupId)
    : useGroup(groupId);

  const expensesQuery = useExpenses(groupId);
  const balancesQuery = useBalances(groupId);
  const settlementsQuery = useSettlements(groupId);

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const createExpense = useCreateExpense(groupId);
  const deleteExpense = useDeleteExpense(groupId);
  const createSettlement = useCreateSettlement(groupId);
  const removeMember = useRemoveMember(groupId);

  // ─── Socket.io integration ──────────────────────────────────────────────────
  const handleExpenseAdded = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: groupKeys.expenses(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.all });
    setSocketActivity(prev => [`Expense added by another member`, ...prev.slice(0, 4)]);
  }, [groupId, queryClient]);

  const handleBalanceUpdated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.all });
    setSocketActivity(prev => [`Balances updated`, ...prev.slice(0, 4)]);
  }, [groupId, queryClient]);

  const handleSettlementCompleted = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: groupKeys.settlements(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.all });
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
      { from: currentUserId, to: toUserId, amount },
      { onSuccess: () => setActiveTab('settlements') },
    );
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate(userId);
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/groups?join=${group.inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard');
  };

  const handleDeleteGroup = async () => {
    if (confirm('Are you sure you want to delete this group? This cannot be undone.')) {
      try {
        await groupApi.deleteGroup(groupId);
        queryClient.invalidateQueries({ queryKey: groupKeys.all });
        toast.success('Group deleted');
        navigate('/dashboard');
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Failed to delete group');
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (confirm('Are you sure you want to leave this group?')) {
      try {
        // Backend expects DELETE /api/groups/:id/members/me or userId
        await groupApi.removeMember(groupId, 'me');
        queryClient.invalidateQueries({ queryKey: groupKeys.all });
        toast.success('Left group');
        navigate('/dashboard');
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Failed to leave group');
      }
    }
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

  // ─── Error/Unavailable state ───────────────────────────────────────────────
  if (groupQuery.isError || !groupQuery.data) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-danger font-medium text-lg">Failed to load group details.</p>
        <p className="text-foreground-subtle text-sm">Please check your connection and try again.</p>
        <Link to="/dashboard" className="btn-primary inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  const group = groupQuery.data;
  const expenses = expensesQuery.data || [];
  const balances = balancesQuery.data || [];
  const settlements = settlementsQuery.data || [];

  const memberShip = group.members.find((m) => m.userId._id === currentUserId);
  const isOwner = memberShip?.role === 'owner';

  return (
    <div className="space-y-6 animate-fade-in">
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
            onClick={() => setIsAddExpenseOpen(true)}
            className="btn-primary"
          >
            + Add Expense
          </button>

          <button
            id="invite-members-btn"
            onClick={handleCopyInviteLink}
            className="btn-ghost border border-surface-border"
          >
            Invite Members 📋
          </button>

          {balances.length > 0 && (
            <button
              id="group-settle-up-btn"
              onClick={() => setIsSettleOpen(true)}
              className="btn-ghost border border-surface-border text-accent-light"
            >
              Settle Up ⚖️
            </button>
          )}

          {isOwner ? (
            <button
              id="delete-group-btn"
              onClick={handleDeleteGroup}
              className="btn-ghost border border-danger/30 text-danger hover:bg-danger/10"
            >
              Delete Group 🗑️
            </button>
          ) : (
            <button
              id="leave-group-btn"
              onClick={handleLeaveGroup}
              className="btn-ghost border border-danger/30 text-danger hover:bg-danger/10"
            >
              Leave Group 🚪
            </button>
          )}
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
                onAddExpense={() => setIsAddExpenseOpen(true)}
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
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        group={group}
        currentUserId={currentUserId}
        onSubmit={handleAddExpense}
        isLoading={createExpense.isPending}
      />

      {/* ── Settle Up Modal ────────────────────────────────────────────────── */}
      <SettleModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        group={group}
        currentUserId={currentUserId}
      />
    </div>
  );
}
