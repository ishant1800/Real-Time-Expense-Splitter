import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Settlement } from '@/types';

interface SettlementHistoryProps {
  settlements: Settlement[];
  currentUserId: string;
}

export function SettlementHistory({ settlements, currentUserId }: SettlementHistoryProps) {
  const sorted = [...settlements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (settlements.length === 0) {
    return (
      <Card className="p-5">
        <CardHeader title="Settlement History" icon="✅" className="mb-4" />
        <EmptyState
          icon="🤝"
          title="No settlements yet"
          description="Once members settle up, history will appear here."
        />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <CardHeader title="Settlement History" subtitle={`${settlements.length} settlements`} icon="✅" />
      </div>

      <div className="space-y-2">
        {sorted.map((s) => {
          const isFromMe = s.from._id === currentUserId;
          const isToMe = s.to._id === currentUserId;

          let label: React.ReactNode;
          if (isFromMe) {
            label = (
              <span className="text-xs text-foreground-muted">
                You paid <strong className="text-foreground">{s.to.name}</strong>
              </span>
            );
          } else if (isToMe) {
            label = (
              <span className="text-xs text-foreground-muted">
                <strong className="text-foreground">{s.from.name}</strong> paid you
              </span>
            );
          } else {
            label = (
              <span className="text-xs text-foreground-muted">
                <strong className="text-foreground">{s.from.name}</strong> paid{' '}
                <strong className="text-foreground">{s.to.name}</strong>
              </span>
            );
          }

          return (
            <div
              key={s._id}
              className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-surface-elevated transition-colors"
            >
              {/* Arrow indicator */}
              <div className="w-9 h-9 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-base shrink-0">
                ✅
              </div>

              {/* Avatars + label */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center -space-x-2 shrink-0">
                  <Avatar name={s.from.name} src={s.from.avatarUrl} size="xs" />
                  <Avatar name={s.to.name} src={s.to.avatarUrl} size="xs" />
                </div>
                <div className="min-w-0">
                  {label}
                  <p className="text-xs text-foreground-subtle mt-0.5">{formatDate(s.createdAt)}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${isToMe ? 'text-success' : isFromMe ? 'text-danger' : 'text-foreground'}`}>
                  {isToMe ? '+' : isFromMe ? '-' : ''}{formatCurrency(s.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
