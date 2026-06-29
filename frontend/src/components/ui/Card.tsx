import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'style'> {
  elevated?: boolean;
  hover?: boolean;
  glow?: boolean;
  glass?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hover, glow, glass, elevated, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -4, borderColor: 'rgba(16, 185, 129, 0.3)' } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={cn(
          'border border-white/6 rounded-xl p-6 transition-all duration-300 relative overflow-hidden',
          elevated ? 'bg-[#161616] border-white/8' : 'bg-[#111] border-white/6',
          glass && 'backdrop-blur-[20px] bg-white/[0.04] border-white/10',
          glow && 'hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)]',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// CardHeader (original)
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
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-white text-base leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// StatCard (original)
interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  gradientClass?: string;
  glowClass?: string;
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  trend,
  gradientClass = 'from-emerald-500 to-teal-600',
  glowClass = 'shadow-[#10b981]/10 hover:shadow-[#10b981]/20'
}: StatCardProps) {
  const isPositiveTrend = trend && trend.value >= 0;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-white/6 bg-[#111] p-6 shadow-md transition-all duration-300 group hover:-translate-y-1 hover:border-[#10b981]/30 hover:shadow-[0_20px_40px_rgba(16,185,129,0.06)]', glowClass)}>
      {/* Glow orb */}
      <div className={cn('absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br opacity-5 blur-2xl transition-opacity duration-300 group-hover:opacity-10', gradientClass)} />

      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br shadow-lg text-white font-bold', gradientClass)}>
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider',
              isPositiveTrend
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-rose-400 bg-rose-500/10',
            )}
          >
            {isPositiveTrend ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{label}</p>
        <p className="text-2xl font-bold text-white tracking-tight font-heading">{value}</p>
        {sublabel && <p className="text-[10px] text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}
