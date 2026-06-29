import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';

import { MembersPanel } from '@/components/group/MembersPanel';
import { ExpenseList } from '@/components/group/ExpenseList';
import { BalanceBoard } from '@/components/group/BalanceBoard';
import { SettlementHistory } from '@/components/group/SettlementHistory';
import { AddExpenseModal } from '@/components/group/AddExpenseModal';
import { SettleModal } from '@/components/group/SettleModal';
import { CardSkeleton } from '@/components/ui/Skeleton';
import PageWrapper from '@/components/ui/PageWrapper';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

import {
  useGroup,
  useExpenses,
  useBalances,
  useSettlements,
  useCreateExpense,
  useDeleteExpense,
  useRemoveMember,
  groupKeys,
} from '@/hooks/useGroupQueries';
import { useGroupSocket } from '@/hooks/useGroupSocket';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { groupApi } from '@/services/groupApi';
import type { CreateExpensePayload } from '@/services/groupApi';
import type { NetBalance } from '@/types';
import { formatCurrency } from '@/lib/utils';

type Tab = 'expenses' | 'balances' | 'settlements' | 'members';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'expenses', label: 'Expenses', icon: '🧾' },
  { key: 'balances', label: 'Balances', icon: '⚖️' },
  { key: 'settlements', label: 'Settlements', icon: '✅' },
  { key: 'members', label: 'Members', icon: '👥' },
];

// Greedy settlement suggestions calculator
function calculateSimplifiedDebts(netBalances: NetBalance[]) {
  const participants = netBalances
    .map((b) => ({ ...b }))
    .filter((b) => Math.abs(b.balance) > 0.05);

  const debts: {
    fromId: string;
    fromName: string;
    fromAvatar?: string;
    toId: string;
    toName: string;
    toAvatar?: string;
    amount: number;
  }[] = [];

  while (participants.length > 1) {
    participants.sort((a, b) => a.balance - b.balance);
    const debtor = participants[0];
    const creditor = participants[participants.length - 1];

    if (!debtor || !creditor || Math.abs(debtor.balance) < 0.05 || Math.abs(creditor.balance) < 0.05) {
      break;
    }

    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    debtor.balance += amount;
    creditor.balance -= amount;

    debts.push({
      fromId: debtor.userId,
      fromName: debtor.name,
      fromAvatar: debtor.avatarUrl,
      toId: creditor.userId,
      toName: creditor.name,
      toAvatar: creditor.avatarUrl,
      amount: Math.round(amount * 100) / 100,
    });

    if (Math.abs(debtor.balance) < 0.05) participants.shift();
    if (Math.abs(creditor.balance) < 0.05) participants.pop();
  }

  return debts;
}

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prefill state for SettleModal suggestions
  const [settlePreFill, setSettlePreFill] = useState<{
    fromUserId?: string;
    toUserId?: string;
    amount?: number;
  } | undefined>(undefined);

  // Last updated seconds state
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  // ─── Data queries ───────────────────────────────────────────────────────────
  const groupQuery = useGroup(groupId);
  const expensesQuery = useExpenses(groupId);
  const balancesQuery = useBalances(groupId);
  const settlementsQuery = useSettlements(groupId);

  const group = groupQuery.data;
  const expenses = expensesQuery.data || [];
  const balances = balancesQuery.data || [];
  const settlements = settlementsQuery.data || [];

  // Reset seconds update tracker when queries refresh
  useEffect(() => {
    setSecondsSinceUpdate(0);
  }, [group, expenses, balances, settlements]);

  // Keep ticking update timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceUpdate((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const createExpense = useCreateExpense(groupId);
  const deleteExpense = useDeleteExpense(groupId);
  const removeMember = useRemoveMember(groupId);

  // ─── Socket.io integration ──────────────────────────────────────────────────
  const handleExpenseAdded = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: groupKeys.expenses(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.all });
    toast.success('Real-time update: A member added a new expense!');
  }, [groupId, queryClient, toast]);

  const handleBalanceUpdated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.all });
    toast.success('Real-time update: Balances recalculated!');
  }, [groupId, queryClient, toast]);

  const handleSettlementCompleted = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: groupKeys.settlements(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.balances(groupId) });
    queryClient.invalidateQueries({ queryKey: groupKeys.all });
    toast.success('Real-time update: Settlement recorded!');
  }, [groupId, queryClient, toast]);

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
    setSettlePreFill({
      fromUserId: currentUserId,
      toUserId,
      amount,
    });
    setIsSettleOpen(true);
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate(userId);
  };

  const handleCopyInviteLink = () => {
    if (!group) return;
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
  if (groupQuery.isLoading || !group) {
    return (
      <div className="space-y-6 py-4 text-left">
        <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
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

  const memberShip = group.members.find((m) => m.userId._id === currentUserId);
  const isOwner = memberShip?.role === 'owner';

  // Calculations for right summary block
  const totalGroupSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const myBalance = balances.find((b) => b.userId === currentUserId)?.balance || 0;

  // Derive enriched balances and greedy suggestions
  const enrichedBalances = balances.map((b) => {
    const member = group.members.find((m) => m.userId._id === b.userId);
    return {
      ...b,
      name: member?.userId.name ?? b.name,
      avatarUrl: member?.userId.avatarUrl ?? b.avatarUrl,
    };
  });
  const simplifiedDebts = calculateSimplifiedDebts(enrichedBalances);
  const quickSuggestions = simplifiedDebts.slice(0, 2);

  // Quick settle button handler
  const handleQuickSettleClick = () => {
    const myDebts = simplifiedDebts.filter((d) => d.fromId === currentUserId);
    if (myDebts.length > 0) {
      setSettlePreFill({
        fromUserId: currentUserId,
        toUserId: myDebts[0].toId,
        amount: myDebts[0].amount,
      });
    } else {
      setSettlePreFill(undefined);
    }
    setIsSettleOpen(true);
  };

  // Header slide variants
  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <PageWrapper className="min-h-0 bg-transparent space-y-8 pb-10">
      
      {/* 1. Header slideInDown */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-start justify-between flex-wrap gap-5 border-b border-white/5 pb-6 text-left"
      >
        <div className="space-y-2.5">
          {/* Back arrow breadcrumb */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-bold transition select-none cursor-pointer"
          >
            <span>←</span> Back to Dashboard
          </button>

          <h1 className="font-heading text-white font-extrabold text-2xl tracking-tight leading-tight">
            {group.name}
          </h1>

          {/* Member avatars overlap list */}
          <div className="flex items-center gap-3 select-none flex-wrap">
            <div className="flex items-center -space-x-2">
              {group.members.slice(0, 4).map((m) => (
                <Avatar key={m.userId._id} name={m.userId.name} src={m.userId.avatarUrl} size="sm" />
              ))}
              {group.members.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-gray-400 font-bold shrink-0">
                  +{group.members.length - 4}
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-600 font-bold">·</span>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              {group.members.length} members
            </span>
          </div>
        </div>

        {/* Action bar items */}
        <div className="flex items-center gap-3">
          {/* Socket connected pulse */}
          <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2 select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[#10b981] font-bold">Live</span>
          </div>

          <Button
            id="group-add-expense-btn"
            onClick={() => setIsAddExpenseOpen(true)}
            variant="primary"
            size="md"
          >
            + Add Expense
          </Button>

          <Button
            id="invite-members-btn"
            onClick={handleCopyInviteLink}
            variant="ghost"
            size="md"
            className="hidden sm:inline-flex border border-white/6 hover:border-white/12"
          >
            Invite Member
          </Button>

          {/* Options Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 border border-white/6 hover:border-white/12 flex items-center justify-center rounded-xl text-xs text-gray-400 hover:text-white transition select-none cursor-pointer"
            >
              ⚙️
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-[#111] border border-white/6 rounded-xl shadow-xl z-20 p-1.5 select-none"
                  >
                    {/* Mobile Only: Invite Member */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleCopyInviteLink();
                      }}
                      className="sm:hidden w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 rounded-lg transition select-none cursor-pointer"
                    >
                      👥 Invite Member
                    </button>

                    {/* Mobile Only: Settle Up */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleQuickSettleClick();
                      }}
                      className="sm:hidden w-full text-left px-3 py-2 text-xs text-[#10b981] hover:bg-[#10b981]/10 rounded-lg transition select-none cursor-pointer"
                    >
                      ⚖️ Settle Up
                    </button>

                    <div className="sm:hidden my-1 border-t border-white/5" />

                    {isOwner ? (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleDeleteGroup();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition select-none cursor-pointer"
                      >
                        🗑️ Delete Group
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLeaveGroup();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition select-none cursor-pointer"
                      >
                        🚪 Leave Group
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* 2. Tab sliding underline indicator */}
      <div className="flex items-center gap-6 border-b border-white/5 pb-2 overflow-x-auto select-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap
                ${isActive ? 'text-white' : 'text-gray-500 hover:text-white'}
              `}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#10b981]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main content (two column layout: left 60%, right 40% sticky) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column content */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
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
                  <SettlementHistory settlements={settlements} currentUserId={currentUserId} />
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
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right sticky Column */}
        <div className="lg:col-span-1 space-y-6 sticky top-24">
          
          {/* Sticky balance summary card */}
          <div className="bg-[#111] border border-white/6 rounded-xl p-6 text-left space-y-5">
            <div>
              <h3 className="font-heading text-base font-bold text-white">Group Summary</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5 select-none">
                net statistics Overview
              </p>
            </div>

            {/* Total group spent */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold select-none">Total Spending</span>
              <p className="text-3xl font-extrabold font-heading text-white tracking-tight">
                {formatCurrency(totalGroupSpent)}
              </p>
            </div>

            {/* Net Balance of current user */}
            <div className="space-y-1 pt-3.5 border-t border-white/5">
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold select-none">Your Net Balance</span>
              <p className={`text-xl font-extrabold font-heading ${myBalance > 0 ? 'text-[#10b981]' : myBalance < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                {myBalance > 0 ? '+' : ''}{formatCurrency(myBalance)}
              </p>
            </div>

            {/* Quick Settle Suggestions */}
            {quickSuggestions.length > 0 && (
              <div className="space-y-2 pt-3.5 border-t border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold select-none block mb-1">
                  Settlement suggestions
                </span>
                <div className="space-y-1.5">
                  {quickSuggestions.map((debt) => (
                    <div key={`${debt.fromId}-${debt.toId}-${debt.amount}`} className="flex items-center justify-between text-xs font-semibold py-0.5">
                      <div className="flex items-center gap-1.5 min-w-0 select-none">
                        <span className="text-gray-400 truncate max-w-[60px]">
                          {debt.fromId === currentUserId ? 'You' : debt.fromName.split(' ')[0]}
                        </span>
                        <span className="text-gray-600 font-normal">➔</span>
                        <span className="text-gray-300 truncate max-w-[60px]">
                          {debt.toId === currentUserId ? 'You' : debt.toName.split(' ')[0]}
                        </span>
                      </div>
                      <span className="font-bold text-[#10b981]">{formatCurrency(debt.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sticky settle action */}
            <div className="pt-2">
              <button
                onClick={handleQuickSettleClick}
                className="w-full py-3 bg-[#10b981] hover:bg-[#0ea572] text-[#0a0a0a] font-bold text-xs rounded-xl uppercase tracking-wider transition select-none cursor-pointer"
              >
                Settle Up
              </button>
            </div>

            {/* Last updated ticker indicator */}
            <div className="pt-2 flex items-center justify-center gap-1.5 text-[9px] text-gray-600 font-bold uppercase tracking-wider select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse" />
              <span>Last updated {secondsSinceUpdate}s ago</span>
            </div>
          </div>

          {/* Compact members roster */}
          <MembersPanel
            group={group}
            currentUserId={currentUserId}
            isSidebar
          />
        </div>
      </div>

      {/* Modals mount layer */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        group={group}
        currentUserId={currentUserId}
        onSubmit={handleAddExpense}
        isLoading={createExpense.isPending}
      />

      <SettleModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        group={group}
        currentUserId={currentUserId}
        preFill={settlePreFill}
      />
    </PageWrapper>
  );
}
