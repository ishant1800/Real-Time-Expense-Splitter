import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatRelativeTime, getCategoryIcon } from '@/lib/utils';
import type { Expense } from '@/types';

interface ExpenseListProps {
  expenses: Expense[];
  currentUserId: string;
  onAddExpense: () => void;
  onDeleteExpense?: (expenseId: string) => void;
  isDeleting?: boolean;
}

type SortKey = 'date' | 'amount' | 'category';

export function ExpenseList({
  expenses,
  currentUserId,
  onAddExpense,
  onDeleteExpense,
  isDeleting,
}: ExpenseListProps) {
  const [sort, setSort] = useState<SortKey>('date');
  const [filter, setFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sorted = [...expenses]
    .filter(e =>
      filter
        ? e.description.toLowerCase().includes(filter.toLowerCase()) ||
          e.category.toLowerCase().includes(filter.toLowerCase())
        : true,
    )
    .sort((a, b) => {
      if (sort === 'amount') return b.amount - a.amount;
      if (sort === 'category') return a.category.localeCompare(b.category);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleDelete = (expenseId: string) => {
    if (confirmDelete === expenseId) {
      onDeleteExpense?.(expenseId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(expenseId);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <CardHeader
          title="Expenses"
          subtitle={`${expenses.length} total`}
          icon="🧾"
        />
        <button id="open-add-expense-btn" onClick={onAddExpense} className="btn-primary text-xs px-3 py-1.5">
          + Add Expense
        </button>
      </div>

      {/* Filters + Sort */}
      <div className="flex items-center gap-2 mb-4">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search expenses…"
          className="flex-1 bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent/40 transition-all"
        />
        <div className="flex items-center gap-1 bg-surface-elevated border border-surface-border rounded-xl p-1">
          {(['date', 'amount', 'category'] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                ${sort === k ? 'bg-accent/20 text-accent-light' : 'text-foreground-subtle hover:text-foreground'}
              `}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={filter ? '🔍' : '📝'}
          title={filter ? 'No matching expenses' : 'No expenses yet'}
          description={filter ? 'Try a different search term.' : 'Add the first expense to this group.'}
          action={!filter ? (
            <button onClick={onAddExpense} className="btn-primary text-sm">Add Expense</button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-1">
          {sorted.map((expense) => {
            const isPaidByMe = expense.paidBy._id === currentUserId;
            const myShare = expense.splits.find(s => s.userId === currentUserId)?.amount
              ?? expense.amount / Math.max(expense.splits.length, 1);

            return (
              <div
                key={expense._id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-elevated transition-all duration-200 group"
              >
                {/* Category icon */}
                <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center text-lg shrink-0">
                  {getCategoryIcon(expense.category)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{expense.description}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={expense.paidBy.name} size="xs" />
                      <span className="text-xs text-foreground-subtle">
                        {isPaidByMe ? 'You' : expense.paidBy.name} paid
                      </span>
                    </div>
                    <span className="text-foreground-subtle text-xs">·</span>
                    <Badge variant="neutral" className="text-xs capitalize">{expense.category}</Badge>
                    <span className="text-foreground-subtle text-xs">·</span>
                    <span className="text-xs text-foreground-subtle">{formatRelativeTime(expense.createdAt)}</span>
                  </div>
                </div>

                {/* Amounts */}
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(expense.amount)}</p>
                  <Badge variant={isPaidByMe ? 'success' : 'danger'}>
                    {isPaidByMe
                      ? `you get back ${formatCurrency(expense.amount - myShare)}`
                      : `your share ${formatCurrency(myShare)}`}
                  </Badge>
                </div>

                {/* Delete button */}
                {onDeleteExpense && (isPaidByMe) && (
                  <button
                    onClick={() => handleDelete(expense._id)}
                    disabled={isDeleting}
                    className={`
                      ml-1 opacity-0 group-hover:opacity-100 text-xs px-2.5 py-1.5 rounded-lg
                      font-medium transition-all shrink-0
                      ${confirmDelete === expense._id
                        ? 'bg-danger/20 text-danger border border-danger/30 animate-pulse opacity-100'
                        : 'text-foreground-subtle hover:text-danger hover:bg-danger/10'}
                    `}
                  >
                    {confirmDelete === expense._id ? '⚠️ Sure?' : '🗑️'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
