import { StatsSection } from '@/components/dashboard/StatsSection';
import { GroupsSection } from '@/components/dashboard/GroupsSection';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { SpendingSummary } from '@/components/dashboard/SpendingSummary';
import { BalancePanel } from '@/components/dashboard/BalancePanel';
import { Avatar } from '@/components/ui/Avatar';
import {
  MOCK_GROUPS,
  MOCK_RECENT_EXPENSES,
  MOCK_ACTIVITY,
  MOCK_STATS,
  MOCK_SPENDING,
  MOCK_NET_BALANCES,
  MOCK_USER,
} from '@/hooks/useDashboardData';

const TOTAL_SPENDING = MOCK_SPENDING.reduce((acc, c) => acc + c.amount, 0);

export default function Dashboard() {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={MOCK_USER.name} size="lg" />
          <div>
            <p className="text-sm text-foreground-subtle">{greeting},</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              {MOCK_USER.name.split(' ')[0]} 👋
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="add-expense-btn"
            className="btn-primary flex items-center gap-2"
          >
            <span className="text-base leading-none">+</span>
            Add Expense
          </button>
          <button
            id="create-group-btn"
            className="btn-ghost border border-surface-border"
          >
            New Group
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <StatsSection stats={MOCK_STATS} />

      {/* Groups */}
      <GroupsSection groups={MOCK_GROUPS} currentUserId={MOCK_USER._id} />

      {/* Middle Grid: Expenses + Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentExpenses expenses={MOCK_RECENT_EXPENSES} currentUserId={MOCK_USER._id} />
        <ActivityFeed items={MOCK_ACTIVITY} />
      </div>

      {/* Bottom Grid: Spending + Balance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SpendingSummary categories={MOCK_SPENDING} totalSpending={TOTAL_SPENDING} />
        <BalancePanel balances={MOCK_NET_BALANCES} />
      </div>
    </div>
  );
}
