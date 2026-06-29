import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatRelativeTime, getCategoryIcon } from '@/lib/utils';
import type { Expense } from '@/types';

interface ExpenseListProps {
  expenses: Expense[];
  currentUserId: string;
  onAddExpense: () => void;
  onDeleteExpense?: (expenseId: string) => void;
  isDeleting?: boolean;
}

const categoryStyleMap: Record<string, string> = {
  food: 'bg-violet-500/15 border-violet-500/20 text-violet-400',
  transport: 'bg-cyan-500/15 border-cyan-500/20 text-cyan-400',
  entertainment: 'bg-amber-500/15 border-amber-500/20 text-amber-450',
  shopping: 'bg-pink-500/15 border-pink-500/20 text-pink-400',
  utilities: 'bg-blue-500/15 border-blue-500/20 text-blue-450',
  rent: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-450',
  travel: 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400',
  health: 'bg-rose-500/15 border-rose-500/20 text-rose-450',
  other: 'bg-gray-500/15 border-gray-500/20 text-gray-400',
};

export function ExpenseList({
  expenses,
  currentUserId,
  onAddExpense,
  onDeleteExpense,
  isDeleting,
}: ExpenseListProps) {
  const [filterText, setFilterText] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Derive unique categories dynamically
  const uniqueCategories = Array.from(new Set(expenses.map((e) => e.category?.toLowerCase()).filter(Boolean)));

  // Filter list
  const filtered = expenses
    .filter((e) => {
      const matchesSearch = filterText
        ? e.description.toLowerCase().includes(filterText.toLowerCase()) ||
          e.category.toLowerCase().includes(filterText.toLowerCase())
        : true;

      const matchesCategory = categoryFilter
        ? e.category.toLowerCase() === categoryFilter.toLowerCase()
        : true;

      const daysDiff = (new Date().getTime() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const matchesTime =
        timeFilter === 'week' ? daysDiff <= 7 : timeFilter === 'month' ? daysDiff <= 30 : true;

      return matchesSearch && matchesCategory && matchesTime;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDelete = (expenseId: string) => {
    if (confirmDelete === expenseId) {
      onDeleteExpense?.(expenseId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(expenseId);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.05 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 220, damping: 20 },
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  return (
    <div className="space-y-4 text-left">
      
      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Search expenses…"
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#10b981]/50 focus:ring-1 focus:ring-[#10b981]/20 transition-all"
        />

        {/* Time Tabs */}
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
              {t === 'all' ? 'All' : t === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-xs text-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#10b981]/50 cursor-pointer shrink-0"
        >
          <option value="" className="bg-[#111]">All Categories</option>
          {uniqueCategories.map((c) => (
            <option key={c} value={c} className="bg-[#111] capitalize">
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Stack */}
      {filtered.length === 0 ? (
        <div className="bg-[#111] border border-white/6 rounded-xl p-16 text-center space-y-4">
          <p className="text-gray-400 text-sm">No expenses match your active filters.</p>
          {expenses.length === 0 && (
            <button
              onClick={onAddExpense}
              className="px-5 py-2.5 bg-[#10b981] text-[#0a0a0a] font-bold text-xs rounded-lg uppercase tracking-wider transition hover:bg-[#0ea572]"
            >
              Add First Expense
            </button>
          )}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <AnimatePresence initial={false}>
            {filtered.map((expense) => {
              const isPaidByMe = expense.paidBy._id === currentUserId;
              const myShare = expense.splits.find((s) => s.userId === currentUserId)?.amount
                ?? expense.amount / Math.max(expense.splits.length, 1);

              const catKey = expense.category?.toLowerCase() || 'other';
              const catStyle = categoryStyleMap[catKey] || categoryStyleMap.other;

              return (
                <motion.div
                  key={expense._id}
                  variants={cardVariants}
                  exit="exit"
                  layout
                  whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.3)' }}
                  className="bg-[#111] border border-white/6 rounded-xl p-5 flex items-center justify-between gap-4 transition-all duration-300 relative group hover:shadow-[0_15px_30px_rgba(16,185,129,0.04)]"
                >
                  {/* Left: Category Icon Box with 12px radius */}
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-lg shrink-0 ${catStyle}`}>
                    {getCategoryIcon(expense.category)}
                  </div>

                  {/* Center: Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading text-sm font-bold text-white truncate leading-snug">
                      {expense.description}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 select-none flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={expense.paidBy.name} src={expense.paidBy.avatarUrl} size="xs" />
                        <span className="text-[10px] text-gray-400">
                          {isPaidByMe ? 'You' : expense.paidBy.name} paid
                        </span>
                      </div>
                      <span className="text-gray-600 text-[10px]">·</span>
                      <Badge variant="neutral" className="text-[9px] capitalize px-2 py-0.5 rounded">
                        {expense.category}
                      </Badge>
                      <span className="text-gray-600 text-[10px]">·</span>
                      <span className="text-[10px] text-gray-500">
                        {formatRelativeTime(expense.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Amounts & Split Indicator */}
                  <div className="text-right shrink-0 space-y-1">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-sm font-extrabold text-white">
                        {formatCurrency(expense.amount)}
                      </span>
                      <span className="text-[9px] text-gray-500 font-bold bg-white/5 border border-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        ÷{expense.splits?.length || 1}
                      </span>
                    </div>
                    <Badge variant={isPaidByMe ? 'success' : 'danger'} className="text-[9px]">
                      {isPaidByMe
                        ? `Owed +${formatCurrency(expense.amount - myShare)}`
                        : `Owes -${formatCurrency(myShare)}`}
                    </Badge>
                  </div>

                  {/* Delete button appears on hover */}
                  {onDeleteExpense && isPaidByMe && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(expense._id);
                      }}
                      disabled={isDeleting}
                      className={`
                        ml-2 opacity-0 group-hover:opacity-100 text-xs px-2.5 py-1.5 rounded-lg
                        font-bold transition-all shrink-0 select-none cursor-pointer z-10
                        ${confirmDelete === expense._id
                          ? 'bg-rose-500/20 text-rose-450 border border-rose-500/30 animate-pulse opacity-100'
                          : 'text-gray-500 hover:text-rose-500 hover:bg-rose-500/10'}
                      `}
                    >
                      {confirmDelete === expense._id ? 'Sure?' : '🗑️'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
