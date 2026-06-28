import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, elevated = false, hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border shadow-card transition-all duration-300',
        elevated ? 'bg-surface-elevated border-surface-border' : 'bg-surface border-surface-border',
        hover && 'hover:border-accent/30 hover:shadow-glow cursor-pointer',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, icon, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center text-lg shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-foreground text-base leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-foreground-subtle mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  gradientClass?: string;
  glowClass?: string;
}

export function StatCard({ label, value, sublabel, icon, trend, gradientClass = 'from-violet-500 to-indigo-600', glowClass = 'shadow-glow' }: StatCardProps) {
  const isPositiveTrend = trend && trend.value >= 0;

  return (
    <div className={cn('stat-card group', glowClass && `hover:${glowClass}`)}>
      {/* Glow orb */}
      <div className={cn('absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20', gradientClass)} />

      <div className="flex items-start justify-between">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br shadow-lg', gradientClass)}>
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-1 rounded-lg',
              isPositiveTrend
                ? 'text-success bg-success/10'
                : 'text-danger bg-danger/10',
            )}
          >
            {isPositiveTrend ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <div>
        <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
        {sublabel && <p className="text-xs text-foreground-subtle mt-0.5">{sublabel}</p>}
      </div>

      <p className="text-sm text-foreground-muted">{label}</p>
    </div>
  );
}
