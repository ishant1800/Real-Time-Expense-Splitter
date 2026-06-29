import { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import CountUp from 'react-countup';

import { groupApi, balanceApi } from '@/services/groupApi';
import { groupKeys } from '@/hooks/useGroupQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { SettleModal } from '@/components/group/SettleModal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import PageWrapper from '@/components/ui/PageWrapper';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Settlement, NetBalance } from '@/types';

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

const formatIndianNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const formatInteger = (num: number) => {
  return String(Math.round(num));
};

export default function Settlements() {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || '';

  // Modals / filters state
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settlePreFill, setSettlePreFill] = useState<{
    fromUserId?: string;
    toUserId?: string;
    amount?: number;
  } | undefined>(undefined);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const [pendingOnly, setPendingOnly] = useState(false);

  // Animate completing pending card key
  const [completingKey, setCompletingKey] = useState<string | null>(null);

  // 1. Fetch user's groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: groupKeys.all,
    queryFn: () => groupApi.listGroups(),
  });

  // 2. Fetch settlements for all groups
  const settlementsQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: groupKeys.settlements(g._id),
      queryFn: () => balanceApi.listSettlements(g._id),
      enabled: !!g._id,
    })),
  });

  // 3. Fetch balances for all groups (to calculate pending debts)
  const balancesQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: groupKeys.balances(g._id),
      queryFn: () => balanceApi.getBalances(g._id),
      enabled: !!g._id,
    })),
  });

  const isLoadingSettlements = settlementsQueries.some((q) => q.isLoading);
  const isLoadingBalances = balancesQueries.some((q) => q.isLoading);

  // Combine and enrich completed settlements
  const allSettlements: (Settlement & { groupName: string })[] = settlementsQueries.flatMap((q, index) => {
    const g = groups[index];
    const list = (q.data as Settlement[]) || [];
    return list.map((settle: Settlement) => ({
      ...settle,
      groupName: g?.name || 'Group',
    }));
  });

  // Filter completed settlements
  const filteredSettlements = allSettlements
    .filter((s) => {
      const matchGroup = selectedGroupId ? s.groupId === selectedGroupId : true;
      const daysDiff = (new Date().getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const matchTime =
        timeFilter === 'week' ? daysDiff <= 7 : timeFilter === 'month' ? daysDiff <= 30 : true;
      return matchGroup && matchTime;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Aggregate pending settlements (simplified debts) across all groups
  const pendingSettlements: {
    key: string;
    groupId: string;
    groupName: string;
    fromId: string;
    fromName: string;
    fromAvatar?: string;
    toId: string;
    toName: string;
    toAvatar?: string;
    amount: number;
  }[] = [];

  balancesQueries.forEach((q, index) => {
    const g = groups[index];
    if (g && q.data) {
      const netBalances = q.data as NetBalance[];
      const enrichedBalances = netBalances.map((b) => {
        const m = g.members.find((member) => member.userId._id === b.userId);
        return {
          ...b,
          name: m?.userId.name ?? b.name,
          avatarUrl: m?.userId.avatarUrl ?? b.avatarUrl,
        };
      });

      const debts = calculateSimplifiedDebts(enrichedBalances);
      debts.forEach((d) => {
        pendingSettlements.push({
          key: `${d.fromId}-${d.toId}-${d.amount}`,
          groupId: g._id,
          groupName: g.name,
          ...d,
        });
      });
    }
  });

  // Filter pending debts
  const filteredPending = pendingSettlements
    .filter((d) => {
      const matchGroup = selectedGroupId ? d.groupId === selectedGroupId : true;
      return matchGroup;
    })
    .sort((a, b) => b.amount - a.amount);

  // Statistics calculation
  const totalSettledVal = allSettlements
    .filter((s) => s.from._id === currentUserId || s.to._id === currentUserId)
    .reduce((sum, s) => sum + s.amount, 0);

  const totalPendingVal = pendingSettlements
    .filter((d) => d.fromId === currentUserId || d.toId === currentUserId)
    .reduce((sum, d) => sum + d.amount, 0);

  const countVal = allSettlements.length;

  const handleSettleRow = (fromId: string, toId: string, amount: number) => {
    setSettlePreFill({
      fromUserId: fromId,
      toUserId: toId,
      amount,
    });
    setIsSettleOpen(true);
  };

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const listVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 220, damping: 20 },
    },
    exit: {
      scale: 0.95,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  if (isLoadingGroups || isLoadingSettlements || isLoadingBalances) {
    return (
      <div className="space-y-8 py-4 text-left animate-fade-in">
        <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
        <CardSkeleton rows={8} />
      </div>
    );
  }

  return (
    <PageWrapper className="min-h-0 bg-transparent space-y-8 pb-10">
      
      {/* 1. Header */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between flex-wrap gap-5 border-b border-white/5 pb-6 text-left"
      >
        <div>
          <h1 className="font-heading text-white font-extrabold text-2xl tracking-tight leading-tight">
            Settlements
          </h1>
          <p className="text-gray-500 text-xs mt-1 font-semibold select-none">
            Recorded payments and balance settlements
          </p>
        </div>

        <Button
          id="open-settle-up-btn"
          onClick={() => {
            setSettlePreFill(undefined);
            setIsSettleOpen(true);
          }}
          variant="primary"
          size="md"
        >
          Settle Up
        </Button>
      </motion.div>

      {/* 2. Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Settled */}
        <motion.div
          whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.25)' }}
          className="bg-[#111] border border-white/6 rounded-xl p-5 transition-all duration-300 text-left hover:shadow-[0_20px_40px_rgba(16,185,129,0.04)]"
        >
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold select-none">Total Settled (By/To You)</span>
          <p className="text-2xl font-extrabold font-heading text-white mt-1.5">
            <CountUp end={totalSettledVal} formattingFn={formatIndianNumber} duration={1.5} />
          </p>
        </motion.div>

        {/* Pending Amount */}
        <motion.div
          whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.25)' }}
          className="bg-[#111] border border-white/6 rounded-xl p-5 transition-all duration-300 text-left hover:shadow-[0_20px_40px_rgba(16,185,129,0.04)]"
        >
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold select-none">Your Pending Balance</span>
          <p className="text-2xl font-extrabold font-heading text-white mt-1.5">
            <CountUp end={totalPendingVal} formattingFn={formatIndianNumber} duration={1.5} />
          </p>
        </motion.div>

        {/* Total Settlements count */}
        <motion.div
          whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.25)' }}
          className="bg-[#111] border border-white/6 rounded-xl p-5 transition-all duration-300 text-left hover:shadow-[0_20px_40px_rgba(16,185,129,0.04)]"
        >
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold select-none">Settlement Count</span>
          <p className="text-2xl font-extrabold font-heading text-white mt-1.5">
            <CountUp end={countVal} formattingFn={formatInteger} duration={1.5} />
          </p>
        </motion.div>
      </div>

      {/* 3. Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Group select */}
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-xs text-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#10b981]/50 cursor-pointer"
        >
          <option value="" className="bg-[#111]">All Groups</option>
          {groups.map((g) => (
            <option key={g._id} value={g._id} className="bg-[#111]">{g.name}</option>
          ))}
        </select>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-1 shrink-0">
          {(['all', 'week', 'month'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`
                px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all select-none cursor-pointer
                ${timeFilter === t ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25' : 'text-gray-400 hover:text-white border border-transparent'}
              `}
            >
              {t === 'all' ? 'All time' : t === 'week' ? '7 days' : '30 days'}
            </button>
          ))}
        </div>

        {/* Pending Only Toggle */}
        <div className="flex items-center gap-2 select-none ml-0 sm:ml-auto">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pending Only</span>
          <button
            onClick={() => setPendingOnly(!pendingOnly)}
            className={`
              w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer
              ${pendingOnly ? 'bg-[#10b981]' : 'bg-white/10'}
            `}
          >
            <div
              className={`
                w-4.5 h-4.5 bg-[#0a0a0a] rounded-full transition-transform duration-200
                ${pendingOnly ? 'translate-x-4.5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>
      </div>

      {/* 4. Sections stagger mount */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
      >
        
        {/* SECTION A: PENDING SETTLEMENTS */}
        <div className="space-y-4">
          <div className="pb-1 select-none text-left">
            <h2 className="font-heading text-lg font-bold text-white">Pending Settlements</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
              Outstanding balances requiring action
            </p>
          </div>

          {filteredPending.length === 0 ? (
            <div className="bg-[#111] border border-white/6 rounded-xl p-12 text-center text-gray-500 text-xs">
              🎉 No pending settlements! All groups are balanced.
            </div>
          ) : (
            <motion.div
              variants={listVariants}
              className="space-y-3"
            >
              <AnimatePresence>
                {filteredPending.map((d) => {
                  const isCompleting = completingKey === d.key;

                  return (
                    <motion.div
                      key={d.key}
                      variants={itemVariants}
                      exit="exit"
                      layout
                      className="bg-[#111] border border-[#10b981]/20 rounded-xl p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-[0_15px_30px_rgba(16,185,129,0.06)] relative overflow-hidden"
                      // Pulsing emerald border animation using animate prop
                      animate={{
                        borderColor: [
                          'rgba(16, 185, 129, 0.12)',
                          'rgba(16, 185, 129, 0.35)',
                          'rgba(16, 185, 129, 0.12)',
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      {/* Left side: settlement flow */}
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-3.5 select-none">
                          <Avatar name={d.fromName} src={d.fromAvatar} size="xs" />
                          <span className="text-gray-500 text-xs">➔</span>
                          <Avatar name={d.toName} src={d.toAvatar} size="xs" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white leading-snug">
                            {d.fromId === currentUserId ? 'You' : d.fromName.split(' ')[0]} owe{' '}
                            {d.toId === currentUserId ? 'you' : d.toName.split(' ')[0]}
                          </p>
                          <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                            {d.groupName}
                          </p>
                        </div>
                      </div>

                      {/* Right side: Amount & Action */}
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-extrabold text-[#10b981]">
                          {formatCurrency(d.amount)}
                        </span>

                        {isCompleting ? (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-xs font-extrabold text-[#10b981] bg-[#10b981]/15 px-3 py-1.5 rounded-lg border border-[#10b981]/25 select-none"
                          >
                            ✓ Settling
                          </motion.span>
                        ) : (
                          <button
                            onClick={() => handleSettleRow(d.fromId, d.toId, d.amount)}
                            className="px-3.5 py-1.5 border border-[#10b981] hover:bg-[#10b981] hover:text-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider text-[#10b981] rounded-lg transition select-none cursor-pointer"
                          >
                            Settle
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* SECTION B: SETTLED HISTORY */}
        {!pendingOnly && (
          <div className="space-y-4">
            <div className="pb-1 select-none text-left">
              <h2 className="font-heading text-lg font-bold text-white">Settled History</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
                Completed transactions timeline
              </p>
            </div>

            {filteredSettlements.length === 0 ? (
              <div className="bg-[#111] border border-white/6 rounded-xl p-12 text-center text-gray-500 text-xs">
                No recorded completed settlements.
              </div>
            ) : (
              <motion.div
                variants={listVariants}
                className="space-y-2.5"
              >
                {filteredSettlements.map((s) => {
                  const isFromMe = s.from._id === currentUserId;
                  const isToMe = s.to._id === currentUserId;

                  return (
                    <motion.div
                      key={s._id}
                      variants={itemVariants}
                      whileHover={{ y: -1, borderColor: 'rgba(255,255,255,0.08)' }}
                      className="bg-[#111] border border-white/6 rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-300 opacity-70 hover:opacity-100"
                    >
                      <div className="flex items-center gap-3.5 select-none">
                        <div className="flex items-center -space-x-1.5 shrink-0">
                          <Avatar name={s.from.name} src={s.from.avatarUrl} size="xs" />
                          <Avatar name={s.to.name} src={s.to.avatarUrl} size="xs" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-xs text-gray-300 truncate max-w-[150px]">
                            <strong className="text-white">
                              {isFromMe ? 'You' : s.from.name.split(' ')[0]}
                            </strong>{' '}
                            paid{' '}
                            <strong className="text-white">
                              {isToMe ? 'you' : s.to.name.split(' ')[0]}
                            </strong>
                          </p>
                          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">
                            {s.groupName} · {formatDate(s.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold text-gray-400">
                          {formatCurrency(s.amount)}
                        </span>
                        <Badge variant="success">Settled</Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}

      </motion.div>

      {/* Settle modal mount */}
      <SettleModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        groups={groups}
        currentUserId={currentUserId}
        preFill={settlePreFill}
        onSuccess={() => {
          if (settlePreFill) {
            const key = `${settlePreFill.fromUserId}-${settlePreFill.toUserId}-${settlePreFill.amount}`;
            setCompletingKey(key);
            setTimeout(() => setCompletingKey(null), 1500);
          }
        }}
      />
    </PageWrapper>
  );
}
