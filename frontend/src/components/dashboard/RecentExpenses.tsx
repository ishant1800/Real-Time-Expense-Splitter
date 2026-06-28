import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatRelativeTime, getCategoryIcon } from '@/lib/utils';
import type { Expense } from '@/types';

interface RecentExpensesProps {
  expenses: Expense[];
  currentUserId: string;
}

export function RecentExpenses({ expenses, currentUserId }: RecentExpensesProps) {
  if (expenses.length === 0) {
    return (
      <Card className="p-5">
        <CardHeader title="Recent Expenses" icon="🧾" className="mb-4" />
        <EmptyState
          icon="📝"
          title="No expenses yet"
          description="Once expenses are added to your groups, they'll show up here."
        />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <CardHeader title="Recent Expenses" subtitle="Last 30 days" icon="🧾" />
        <button className="text-xs text-accent-light hover:underline font-medium">View all</button>
      </div>

      <div className="space-y-1">
        {expenses.map((expense) => {
          const isPaidByMe = expense.paidBy._id === currentUserId;
          const myShare = expense.splits.find(s => s.userId === currentUserId)?.amount
            ?? expense.amount / (expense.splits.length || 1);

          return (
            <div key={expense._id} className="expense-row">
              {/* Category Icon */}
              <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center text-lg shrink-0">
                {getCategoryIcon(expense.category)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{expense.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Avatar name={expense.paidBy.name} size="xs" />
                  <p className="text-xs text-foreground-subtle truncate">
                    {isPaidByMe ? 'You' : expense.paidBy.name} paid
                  </p>
                  <span className="text-xs text-foreground-subtle">·</span>
                  <p className="text-xs text-foreground-subtle">{formatRelativeTime(expense.createdAt)}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">{formatCurrency(expense.amount)}</p>
                <Badge variant={isPaidByMe ? 'success' : 'danger'} className="mt-0.5">
                  {isPaidByMe ? `+${formatCurrency(expense.amount - myShare)}` : `-${formatCurrency(myShare)}`}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
