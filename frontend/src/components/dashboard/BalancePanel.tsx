import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';
import type { NetBalance } from '@/types';

interface BalancePanelProps {
  balances: NetBalance[];
  onSettle?: () => void;
}

export function BalancePanel({ balances, onSettle }: BalancePanelProps) {
  const owed = balances.filter(b => b.balance > 0);
  const owes = balances.filter(b => b.balance < 0);

  return (
    <Card className="p-5">
      <div className="mb-5">
        <CardHeader title="Balance Overview" subtitle="Net across all groups" icon="⚖️" />
      </div>

      {/* You are owed */}
      {owed.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-2">
            They Owe You
          </p>
          <div className="space-y-2">
            {owed.map((b) => (
              <div key={b.userId} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-elevated transition-colors">
                <Avatar name={b.name} src={b.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">+{formatCurrency(b.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* You owe */}
      {owes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-2">
            You Owe
          </p>
          <div className="space-y-2">
            {owes.map((b) => (
              <div key={b.userId} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-elevated transition-colors">
                <Avatar name={b.name} src={b.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-danger">{formatCurrency(b.balance)}</p>
                  {onSettle && (
                    <button
                      onClick={onSettle}
                      className="text-xs text-accent-light hover:underline mt-0.5"
                    >
                      Settle up
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {owed.length === 0 && owes.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-sm font-medium text-foreground">All settled up!</p>
          <p className="text-xs text-foreground-subtle mt-1">No outstanding balances.</p>
        </div>
      )}
    </Card>
  );
}
