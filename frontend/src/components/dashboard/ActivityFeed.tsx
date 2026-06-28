import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { ActivityItem, ActivityType } from '@/types';

interface ActivityFeedProps {
  items: ActivityItem[];
}

function getActivityMeta(item: ActivityItem): { icon: string; text: React.ReactNode; color: string } {
  const amount = item.amount ? formatCurrency(item.amount) : '';

  switch (item.type as ActivityType) {
    case 'expense_added':
      return {
        icon: '➕',
        color: 'bg-accent/10 text-accent-light border-accent/20',
        text: (
          <span>
            <strong className="text-foreground">{item.actorName}</strong>
            {' added '}
            <strong className="text-foreground">{item.description}</strong>
            {' ('}
            <span className="text-foreground-muted">{amount}</span>
            {') in '}
            <span className="text-accent-light">{item.groupName}</span>
          </span>
        ),
      };
    case 'expense_updated':
      return {
        icon: '✏️',
        color: 'bg-warning/10 text-warning border-warning/20',
        text: (
          <span>
            <strong className="text-foreground">{item.actorName}</strong>
            {' updated '}
            <strong className="text-foreground">{item.description}</strong>
            {' in '}
            <span className="text-accent-light">{item.groupName}</span>
          </span>
        ),
      };
    case 'expense_deleted':
      return {
        icon: '🗑️',
        color: 'bg-danger/10 text-danger border-danger/20',
        text: (
          <span>
            <strong className="text-foreground">{item.actorName}</strong>
            {' deleted an expense in '}
            <span className="text-accent-light">{item.groupName}</span>
          </span>
        ),
      };
    case 'settlement_completed':
      return {
        icon: '✅',
        color: 'bg-success/10 text-success border-success/20',
        text: (
          <span>
            <strong className="text-foreground">{item.actorName}</strong>
            {' paid '}
            <strong className="text-foreground">{item.targetName}</strong>
            {' '}
            <span className="text-success font-semibold">{amount}</span>
            {' in '}
            <span className="text-accent-light">{item.groupName}</span>
          </span>
        ),
      };
    case 'member_joined':
      return {
        icon: '👋',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        text: (
          <span>
            <strong className="text-foreground">{item.actorName}</strong>
            {' joined '}
            <span className="text-accent-light">{item.groupName}</span>
          </span>
        ),
      };
    case 'member_removed':
      return {
        icon: '👤',
        color: 'bg-danger/10 text-danger border-danger/20',
        text: (
          <span>
            <strong className="text-foreground">{item.actorName}</strong>
            {' removed '}
            <strong className="text-foreground">{item.targetName}</strong>
            {' from '}
            <span className="text-accent-light">{item.groupName}</span>
          </span>
        ),
      };
    default:
      return { icon: '📌', color: 'bg-surface-elevated border-surface-border', text: <span>Activity</span> };
  }
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <Card className="p-5">
        <CardHeader title="Activity Feed" icon="📡" className="mb-4" />
        <EmptyState icon="🔔" title="No activity yet" description="Group activities will appear here in real time." />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <CardHeader title="Activity Feed" subtitle="Live updates" icon="📡" />
        {/* Live dot */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-xs text-success font-medium">Live</span>
        </div>
      </div>

      <div className="space-y-1">
        {items.map((item) => {
          const { icon, text, color } = getActivityMeta(item);

          return (
            <div key={item.id} className="activity-item">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 border ${color}`}>
                {icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground-muted leading-relaxed">{text}</p>
                <p className="text-xs text-foreground-subtle mt-1">{formatRelativeTime(item.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
