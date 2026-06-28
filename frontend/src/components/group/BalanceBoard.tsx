import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { NetBalance, Group } from '@/types';

interface BalanceBoardProps {
  balances: NetBalance[];
  group: Group;
  currentUserId: string;
  onSettle?: (toUserId: string, amount: number) => void;
}

export function BalanceBoard({ balances, group, currentUserId, onSettle }: BalanceBoardProps) {
  const maxAbs = Math.max(...balances.map(b => Math.abs(b.balance)), 0.01);

  // Enrich balances with member name info from group
  const enriched = balances.map(b => {
    const member = group.members.find(m => m.userId._id === b.userId);
    return {
      ...b,
      name: member?.userId.name ?? b.name,
      avatarUrl: member?.userId.avatarUrl ?? b.avatarUrl,
    };
  });

  const creditors = enriched.filter(b => b.balance > 0);  // are owed
  const debtors = enriched.filter(b => b.balance < 0);    // owe someone

  if (balances.length === 0) {
    return (
      <Card className="p-5">
        <CardHeader title="Balance Board" icon="⚖️" className="mb-4" />
        <EmptyState icon="✨" title="All settled!" description="No outstanding balances in this group." />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-5">
        <CardHeader title="Balance Board" subtitle="Net balances" icon="⚖️" />
      </div>

      <div className="space-y-5">
        {/* Owed to (positive) */}
        {creditors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-success uppercase tracking-wider mb-3">
              💚 Owed To
            </p>
            <div className="space-y-3">
              {creditors.map((b) => {
                const isMe = b.userId === currentUserId;
                const pct = (b.balance / maxAbs) * 100;
                return (
                  <div key={b.userId} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={b.name} src={b.avatarUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {isMe ? 'You' : b.name}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-success">+{formatCurrency(b.balance)}</p>
                    </div>
                    <ProgressBar
                      value={pct}
                      color="bg-gradient-to-r from-emerald-500 to-teal-500"
                      height="h-1.5"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Owes (negative) */}
        {debtors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-danger uppercase tracking-wider mb-3">
              🔴 Owes
            </p>
            <div className="space-y-3">
              {debtors.map((b) => {
                const isMe = b.userId === currentUserId;
                const pct = (Math.abs(b.balance) / maxAbs) * 100;
                // Find the user this debtor should pay (first creditor for simplicity)
                const payTo = creditors[0];
                return (
                  <div key={b.userId} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={b.name} src={b.avatarUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {isMe ? 'You' : b.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-danger">{formatCurrency(b.balance)}</p>
                        {isMe && payTo && onSettle && (
                          <button
                            id={`settle-btn-${b.userId}`}
                            onClick={() => onSettle(payTo.userId, Math.abs(b.balance))}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-accent/15 text-accent-light border border-accent/20 hover:bg-accent/25 transition-all"
                          >
                            Settle Up
                          </button>
                        )}
                      </div>
                    </div>
                    <ProgressBar
                      value={pct}
                      color="bg-gradient-to-r from-rose-500 to-pink-500"
                      height="h-1.5"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Net summary row */}
      <div className="mt-5 pt-4 border-t border-surface-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground-subtle">Group total spent</span>
          <span className="text-sm font-bold text-foreground">
            {formatCurrency(balances.reduce((sum, b) => sum + Math.abs(b.balance), 0) / 2)}
          </span>
        </div>
      </div>
    </Card>
  );
}
