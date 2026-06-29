import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';
import type { NetBalance, Group } from '@/types';

interface BalanceBoardProps {
  balances: NetBalance[];
  group: Group;
  currentUserId: string;
  onSettle?: (toUserId: string, amount: number) => void;
}

// Client-side greedy algorithm to calculate simplified debts from net balances
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
    // Sort so debtors (negative balance) are first, creditors (positive balance) are last
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

export function BalanceBoard({ balances, group, currentUserId, onSettle }: BalanceBoardProps) {
  const [settledDebts, setSettledDebts] = useState<string[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);

  // Trigger flash effect when balances array changes
  useEffect(() => {
    if (balances.length > 0) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [balances]);

  // Enrich balances with details from group member info
  const enriched = balances.map((b) => {
    const member = group.members.find((m) => m.userId._id === b.userId);
    return {
      ...b,
      name: member?.userId.name ?? b.name,
      avatarUrl: member?.userId.avatarUrl ?? b.avatarUrl,
    };
  });

  const simplifiedDebts = calculateSimplifiedDebts(enriched);

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 220, damping: 20 },
    },
  };

  if (balances.length === 0) {
    return (
      <div className="bg-[#111] border border-white/6 rounded-xl p-16 text-center space-y-2 select-none">
        <span className="text-4xl">🎉</span>
        <h3 className="font-heading text-base font-bold text-white mt-2">All settled up!</h3>
        <p className="text-gray-500 text-xs">No outstanding balances in this group.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      
      {/* 1. Grid of member cards (2-3 columns) */}
      <div className="space-y-3">
        <h3 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3 select-none">
          Net Balances Board
        </h3>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {enriched.map((b) => {
            const isMe = b.userId === currentUserId;
            const isPositive = b.balance > 0;

            return (
              <motion.div
                key={b.userId}
                variants={itemVariants}
                whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.25)' }}
                className={`bg-[#111] border rounded-xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 relative ${
                  isFlashing ? 'border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.25)] animate-pulse' : 'border-white/6'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={b.name} src={b.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {isMe ? `${b.name} (You)` : b.name}
                    </p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
                      {isPositive ? 'Gets back' : 'Owes'}
                    </p>
                  </div>
                </div>

                <div className="text-left mt-1">
                  <p className={`text-xl font-extrabold font-heading ${isPositive ? 'text-[#10b981]' : 'text-rose-500'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(b.balance)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* 2. Simplified debts section below */}
      {simplifiedDebts.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="select-none">
            <h3 className="font-heading text-base font-bold text-white">Minimum Settlements</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
              optimized debt simplification algorithm
            </p>
          </div>

          <div className="space-y-2.5">
            {simplifiedDebts.map((debt) => {
              const debtKey = `${debt.fromId}-${debt.toId}-${debt.amount}`;
              const isSettled = settledDebts.includes(debtKey);

              return (
                <div
                  key={debtKey}
                  className={`
                    flex items-center justify-between gap-4 p-4 bg-[#111] border border-white/6 rounded-xl transition-all duration-300
                    ${isSettled ? 'opacity-35 line-through select-none' : ''}
                  `}
                >
                  {/* Settlement arrows flow */}
                  <div className="flex items-center gap-4.5">
                    {/* Debtor */}
                    <div className="flex items-center gap-2">
                      <Avatar name={debt.fromName} src={debt.fromAvatar} size="xs" />
                      <span className="text-xs font-bold text-white truncate max-w-[80px]">
                        {debt.fromId === currentUserId ? 'You' : debt.fromName.split(' ')[0]}
                      </span>
                    </div>

                    {/* Arrow */}
                    <span className="text-gray-500 text-sm select-none">➔</span>

                    {/* Creditor */}
                    <div className="flex items-center gap-2">
                      <Avatar name={debt.toName} src={debt.toAvatar} size="xs" />
                      <span className="text-xs font-bold text-white truncate max-w-[80px]">
                        {debt.toId === currentUserId ? 'You' : debt.toName.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Settle amount & Settle Action */}
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-bold text-[#10b981]">
                      {formatCurrency(debt.amount)}
                    </span>
                    {onSettle && !isSettled && (
                      <button
                        onClick={() => {
                          setSettledDebts((prev) => [...prev, debtKey]);
                          onSettle(debt.toId, debt.amount);
                        }}
                        className="px-3.5 py-1.5 border border-[#10b981] hover:bg-[#10b981] hover:text-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider text-[#10b981] rounded-lg transition-all select-none cursor-pointer"
                      >
                        Settle
                      </button>
                    )}
                    {isSettled && (
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-1 rounded">
                        Settled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
