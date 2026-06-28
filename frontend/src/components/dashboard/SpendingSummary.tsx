import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCurrency } from '@/lib/utils';
import type { SpendingCategory } from '@/types';

interface SpendingSummaryProps {
  categories: SpendingCategory[];
  totalSpending: number;
}

export function SpendingSummary({ categories, totalSpending }: SpendingSummaryProps) {
  return (
    <Card className="p-5">
      <div className="mb-5">
        <CardHeader title="Spending Summary" subtitle="This month" icon="📊" />
      </div>

      {/* Stacked Bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-6">
        {categories.map((cat) => (
          <div
            key={cat.category}
            className="transition-all duration-700 rounded-full"
            style={{
              width: `${cat.percentage}%`,
              backgroundColor: cat.color,
            }}
            title={`${cat.category}: ${cat.percentage}%`}
          />
        ))}
      </div>

      {/* Category List */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.category}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm text-foreground-muted">{cat.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground-subtle">{cat.percentage}%</span>
                <span className="text-sm font-semibold text-foreground w-20 text-right">
                  {formatCurrency(cat.amount)}
                </span>
              </div>
            </div>
            <ProgressBar
              value={cat.percentage}
              color=""
              height="h-1"
            />
            {/* Override with custom color via inline style hack using a wrapper */}
            <div className="h-1 -mt-1 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.color,
                  opacity: 0.6,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer total */}
      <div className="mt-5 pt-4 border-t border-surface-border flex items-center justify-between">
        <span className="text-sm text-foreground-muted">Total Spending</span>
        <span className="text-base font-bold text-foreground">{formatCurrency(totalSpending)}</span>
      </div>
    </Card>
  );
}
