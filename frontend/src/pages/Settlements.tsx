import { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { groupApi, balanceApi } from '@/services/groupApi';
import { groupKeys } from '@/hooks/useGroupQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Settlement } from '@/types';

export default function Settlements() {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || '';

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received'>('all');

  // 1. Fetch user's groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: groupKeys.all,
    queryFn: () => groupApi.listGroups(),
  });

  // 2. Fetch settlements for all groups
  const settlementsQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: groupKeys.settlements(g._id),
      queryFn: () => balanceApi.listSettlements(g._id),
      enabled: !!g._id,
    })),
  });

  const isLoadingSettlements = settlementsQueries.some((q) => q.isLoading);

  // Combine and enrich settlements with group name info
  const allSettlements: (Settlement & { groupName: string })[] = settlementsQueries
    .flatMap((q, index) => {
      const g = groups[index];
      const list = (q.data as Settlement[]) || [];
      return list.map((settle: Settlement) => ({
        ...settle,
        groupName: g?.name || 'Group',
      }));
    });

  // Filter and Sort
  const filtered = allSettlements
    .filter((s) => {
      const matchGroup = selectedGroupId ? s.groupId === selectedGroupId : true;
      const isFromMe = s.from._id === currentUserId;
      const isToMe = s.to._id === currentUserId;
      const matchType =
        filterType === 'sent' ? isFromMe : filterType === 'received' ? isToMe : true;
      return matchGroup && matchType;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isLoadingGroups || isLoadingSettlements) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-surface-elevated rounded-xl animate-pulse" />
        <CardSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Settlements</h1>
          <p className="text-sm text-foreground-subtle mt-1">Recorded payments and balance settlements</p>
        </div>
      </div>

      <Card className="p-5">
        <CardHeader title="All Settlements" subtitle={`${filtered.length} matched`} icon="✅" className="mb-4" />

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2 text-sm text-foreground cursor-pointer"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'sent' | 'received')}
            className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2 text-sm text-foreground cursor-pointer"
          >
            <option value="all">All Transactions</option>
            <option value="sent">Payments Sent</option>
            <option value="received">Payments Received</option>
          </select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="No settlements found"
            description="Record a settlement inside a group to see it listed here."
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => {
              const isFromMe = s.from._id === currentUserId;
              const isToMe = s.to._id === currentUserId;

              let label: React.ReactNode;
              if (isFromMe) {
                label = (
                  <span className="text-sm text-foreground-muted">
                    You paid <strong className="text-foreground">{s.to.name}</strong>
                  </span>
                );
              } else if (isToMe) {
                label = (
                  <span className="text-sm text-foreground-muted">
                    <strong className="text-foreground">{s.from.name}</strong> paid you
                  </span>
                );
              } else {
                label = (
                  <span className="text-sm text-foreground-muted">
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
                  <div className="w-9 h-9 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-base shrink-0">
                    ✅
                  </div>

                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center -space-x-2 shrink-0">
                      <Avatar name={s.from.name} src={s.from.avatarUrl} size="xs" />
                      <Avatar name={s.to.name} src={s.to.avatarUrl} size="xs" />
                    </div>
                    <div className="min-w-0">
                      {label}
                      <p className="text-xs text-foreground-subtle mt-1">
                        In <span className="text-accent-light font-medium">{s.groupName}</span> · {formatDate(s.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isToMe ? 'text-success' : isFromMe ? 'text-danger' : 'text-foreground'}`}>
                      {isToMe ? '+' : isFromMe ? '-' : ''}{formatCurrency(s.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
