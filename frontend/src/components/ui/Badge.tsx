import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'neutral' | 'accent';
  children: React.ReactNode;
  className?: string;
}

const variantMap = {
  success: 'bg-success/10 text-success border border-success/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  neutral: 'bg-surface-elevated text-foreground-muted border border-surface-border',
  accent: 'bg-accent/10 text-accent-light border border-accent/20',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variantMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
