import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/ui/Card';
import type { DashboardStats } from '@/types';

interface StatsSectionProps {
  stats: DashboardStats;
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
      <StatCard
        label="You Are Owed"
        value={formatCurrency(stats.totalReceivable)}
        sublabel="across all groups"
        icon="💰"
        gradientClass="from-violet-500 to-indigo-600"
        trend={{ value: 12, label: 'this month' }}
      />
      <StatCard
        label="You Owe"
        value={formatCurrency(stats.totalOwed)}
        sublabel="pending settlement"
        icon="📤"
        gradientClass="from-rose-500 to-pink-600"
        glowClass="hover:shadow-glow-danger"
        trend={{ value: -5, label: 'this month' }}
      />
      <StatCard
        label="Active Groups"
        value={String(stats.groupCount)}
        sublabel="you're a member of"
        icon="👥"
        gradientClass="from-emerald-500 to-teal-600"
        glowClass="hover:shadow-glow-success"
      />
      <StatCard
        label="Total Expenses"
        value={String(stats.expenseCount)}
        sublabel="logged this month"
        icon="🧾"
        gradientClass="from-amber-500 to-orange-600"
      />
    </div>
  );
}
