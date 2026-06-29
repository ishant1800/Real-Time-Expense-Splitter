import { motion, Variants } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatRelativeTime, getCategoryIcon } from '@/lib/utils';
import type { Expense } from '@/types';

interface RecentExpensesProps {
  expenses: Expense[];
  currentUserId: string;
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

export function RecentExpenses({ expenses, currentUserId }: RecentExpensesProps) {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -12 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 200, damping: 18 },
    },
  };

  return (
    <div className="bg-[#111] border border-white/6 rounded-xl p-6 text-left space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-2">
        <div>
          <h2 className="font-heading text-lg font-bold text-white">Recent Expenses</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
            across all groups
          </p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-xs">
          No expenses logged yet.
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2.5"
        >
          {expenses.map((expense) => {
            const isPaidByMe = expense.paidBy._id === currentUserId;
            const myShare = expense.splits.find((s) => s.userId === currentUserId)?.amount
              ?? expense.amount / (expense.splits.length || 1);

            const catKey = expense.category?.toLowerCase() || 'other';
            const catStyle = categoryStyleMap[catKey] || categoryStyleMap.other;

            return (
              <motion.div
                key={expense._id}
                variants={itemVariants}
                className="flex items-center justify-between gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                {/* Category Icon */}
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 ${catStyle}`}>
                  {getCategoryIcon(expense.category)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate leading-snug">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 select-none">
                    <Avatar name={expense.paidBy.name} size="xs" />
                    <p className="text-[10px] text-gray-400 truncate">
                      {isPaidByMe ? 'You' : expense.paidBy.name} paid
                    </p>
                    <span className="text-gray-600 text-[10px]">·</span>
                    <p className="text-[10px] text-gray-400">
                      {formatRelativeTime(expense.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Amount info */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white leading-none">
                    {formatCurrency(expense.amount)}
                  </p>
                  <Badge variant={isPaidByMe ? 'success' : 'danger'} className="mt-1">
                    {isPaidByMe ? `+${formatCurrency(expense.amount - myShare)}` : `-${formatCurrency(myShare)}`}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
