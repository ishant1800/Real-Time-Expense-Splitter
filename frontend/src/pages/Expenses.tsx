import { useState } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
import CountUp from 'react-countup';

import { groupApi, expenseApi } from '@/services/groupApi';
import type { CreateExpensePayload } from '@/services/groupApi';
import { groupKeys } from '@/hooks/useGroupQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { AddExpenseModal } from '@/components/group/AddExpenseModal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import PageWrapper from '@/components/ui/PageWrapper';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatRelativeTime, getCategoryIcon } from '@/lib/utils';
import type { Expense } from '@/types';

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

const formatIndianNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

const formatInteger = (num: number) => {
  return String(Math.round(num));
};

export default function Expenses() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || '';

  // Modals / filters state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [displayCount, setDisplayCount] = useState(15);

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

  // Mutation to add expense
  const createExpenseMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) => expenseApi.createExpense(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      queryClient.invalidateQueries({ queryKey: groupKeys.expenses(data.groupId) });
      toast.success('Expense added');
      setIsAddExpenseOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to add expense');
    },
  });

  const handleAddExpense = async (payload: CreateExpensePayload) => {
    await createExpenseMutation.mutateAsync(payload);
  };

  // Combine and enrich expenses with group details
  const allExpenses: (Expense & { groupName: string })[] = expensesQueries.flatMap((q, index) => {
    const g = groups[index];
    const list = (q.data as Expense[]) || [];
    return list.map((exp: Expense) => ({
      ...exp,
      groupName: g?.name || 'Group',
    }));
  });

  // Filter and Sort list
  const filtered = allExpenses
    .filter((exp) => {
      const matchText = exp.description.toLowerCase().includes(filterText.toLowerCase());
      const matchGroup = selectedGroupId ? exp.groupId === selectedGroupId : true;
      const matchCat = selectedCategory ? exp.category === selectedCategory : true;
      
      const daysDiff = (new Date().getTime() - new Date(exp.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const matchTime =
        timeFilter === 'week' ? daysDiff <= 7 : timeFilter === 'month' ? daysDiff <= 30 : true;

      return matchText && matchGroup && matchCat && matchTime;
    })
    .sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Calculate statistics metrics
  const totalSpentVal = allExpenses
    .filter((e) => e.paidBy._id === currentUserId)
    .reduce((sum, e) => sum + e.amount, 0);

  const thisMonthVal = allExpenses
    .filter(
      (e) =>
        e.paidBy._id === currentUserId &&
        (new Date().getTime() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 30
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const countVal = allExpenses.length;

  // Pagination slice
  const displayed = filtered.slice(0, displayCount);
  const hasMore = filtered.length > displayCount;

  // Group by group name
  const groupedExpenses: Record<string, { groupName: string; total: number; list: typeof displayed }> = {};
  displayed.forEach((exp) => {
    const key = exp.groupId;
    if (!groupedExpenses[key]) {
      groupedExpenses[key] = { groupName: exp.groupName, total: 0, list: [] };
    }
    groupedExpenses[key].list.push(exp);
    groupedExpenses[key].total += exp.amount;
  });

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const groupVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 220, damping: 20 },
    },
  };

  if (isLoadingGroups || isLoadingExpenses) {
    return (
      <div className="space-y-8 py-4 text-left animate-fade-in">
        <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
        <CardSkeleton rows={8} />
      </div>
    );
  }

  return (
    <PageWrapper className="min-h-0 bg-transparent space-y-8 pb-10">
      
      {/* 1. Header slideInDown */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between flex-wrap gap-5 border-b border-white/5 pb-6 text-left"
      >
        <div>
          <h1 className="font-heading text-white font-extrabold text-2xl tracking-tight leading-tight">
            All Expenses
          </h1>
          <p className="text-gray-500 text-xs mt-1 font-semibold select-none">
            All shared expenses across all your groups
          </p>
        </div>

        {groups.length > 0 && (
          <Button
            id="open-add-expense-btn"
            onClick={() => setIsAddExpenseOpen(true)}
            variant="primary"
            size="md"
          >
            + Add Expense
          </Button>
        )}
      </motion.div>

      {/* 2. Summary stats cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Spent */}
        <motion.div
          whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.25)' }}
          className="bg-[#111] border border-white/6 rounded-xl p-5 transition-all duration-300 text-left hover:shadow-[0_20px_40px_rgba(16,185,129,0.04)]"
        >
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold select-none">Total Spent (Paid By You)</span>
          <p className="text-2xl font-extrabold font-heading text-white mt-1.5">
            <CountUp end={totalSpentVal} formattingFn={formatIndianNumber} duration={1.5} />
          </p>
        </motion.div>

        {/* This Month */}
        <motion.div
          whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.25)' }}
          className="bg-[#111] border border-white/6 rounded-xl p-5 transition-all duration-300 text-left hover:shadow-[0_20px_40px_rgba(16,185,129,0.04)]"
        >
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold select-none">Spent This Month</span>
          <p className="text-2xl font-extrabold font-heading text-white mt-1.5">
            <CountUp end={thisMonthVal} formattingFn={formatIndianNumber} duration={1.5} />
          </p>
        </motion.div>

        {/* Number of expenses */}
        <motion.div
          whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.25)' }}
          className="bg-[#111] border border-white/6 rounded-xl p-5 transition-all duration-300 text-left hover:shadow-[0_20px_40px_rgba(16,185,129,0.04)]"
        >
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold select-none">Total Expenses Logs</span>
          <p className="text-2xl font-extrabold font-heading text-white mt-1.5">
            <CountUp end={countVal} formattingFn={formatInteger} duration={1.5} />
          </p>
        </motion.div>
      </div>

      {/* 3. Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search */}
        <input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Search descriptions..."
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#10b981]/50 transition-all font-body"
        />

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

        {/* Category select */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-xs text-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#10b981]/50 cursor-pointer"
        >
          <option value="" className="bg-[#111]">All Categories</option>
          <option value="food" className="bg-[#111]">🍔 Food</option>
          <option value="transport" className="bg-[#111]">🚗 Transport</option>
          <option value="entertainment" className="bg-[#111]">🎬 Entertainment</option>
          <option value="shopping" className="bg-[#111]">🛍️ Shopping</option>
          <option value="utilities" className="bg-[#111]">💡 Utilities</option>
          <option value="rent" className="bg-[#111]">🏠 Rent</option>
          <option value="travel" className="bg-[#111]">✈️ Travel</option>
          <option value="health" className="bg-[#111]">🏥 Health</option>
          <option value="other" className="bg-[#111]">💰 Other</option>
        </select>

        {/* Date / Time filter tabs */}
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

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
          className="bg-white/[0.04] border border-white/[0.08] text-xs text-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#10b981]/50 cursor-pointer"
        >
          <option value="date" className="bg-[#111]">Sort by Date</option>
          <option value="amount" className="bg-[#111]">Sort by Amount</option>
        </select>
      </div>

      {/* 4. Grouped List */}
      {filtered.length === 0 ? (
        <div className="bg-[#111] border border-white/6 rounded-xl p-16 text-center space-y-4">
          <span className="text-4xl select-none">💸</span>
          <div>
            <h3 className="font-heading text-base font-bold text-white">No expenses found</h3>
            <p className="text-gray-500 text-xs mt-1">Try updating your filters or add a new expense inside your groups.</p>
          </div>
          {groups.length > 0 && (
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-5 py-2.5 bg-[#10b981] text-[#0a0a0a] font-bold text-xs rounded-lg uppercase tracking-wider transition hover:bg-[#0ea572] cursor-pointer"
            >
              Add Expense
            </button>
          )}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {Object.entries(groupedExpenses).map(([groupId, groupData]) => (
            <motion.div
              key={groupId}
              variants={groupVariants}
              className="space-y-3.5 text-left"
            >
              {/* Group Name Section Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-2 select-none px-1">
                <span className="font-heading text-sm font-extrabold text-[#10b981] tracking-wide uppercase">
                  {groupData.groupName}
                </span>
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
                  Group total: {formatIndianNumber(groupData.total)}
                </span>
              </div>

              {/* Cards List inside group */}
              <div className="space-y-3">
                {groupData.list.map((expense) => {
                  const isPaidByMe = expense.paidBy._id === currentUserId;
                  const myShare = expense.splits.find((s) => s.userId === currentUserId)?.amount
                    ?? expense.amount / Math.max(expense.splits.length, 1);

                  const catKey = expense.category?.toLowerCase() || 'other';
                  const catStyle = categoryStyleMap[catKey] || categoryStyleMap.other;

                  return (
                    <motion.div
                      key={expense._id}
                      variants={cardVariants}
                      whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.3)' }}
                      className="bg-[#111] border border-white/6 rounded-xl p-5 flex items-center justify-between gap-4 transition-all duration-300 relative group hover:shadow-[0_15px_30px_rgba(16,185,129,0.04)]"
                    >
                      {/* Left: category box */}
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-lg shrink-0 ${catStyle}`}>
                        {getCategoryIcon(expense.category)}
                      </div>

                      {/* Center: details */}
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
                          <span className="text-[10px] text-gray-400 font-medium">
                            {formatRelativeTime(expense.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Right: amount info */}
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
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* Load More Pagination */}
          {hasMore && (
            <div className="pt-4 text-center select-none">
              <button
                onClick={() => setDisplayCount((prev) => prev + 15)}
                className="px-5 py-2.5 border border-white/6 hover:border-[#10b981] hover:text-[#10b981] font-bold text-xs rounded-lg uppercase tracking-wider bg-transparent text-white transition cursor-pointer"
              >
                Load More Expenses
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Modal Add Expense mount */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groups={groups}
        currentUserId={currentUserId}
        onSubmit={handleAddExpense}
        isLoading={createExpenseMutation.isPending}
      />
    </PageWrapper>
  );
}
