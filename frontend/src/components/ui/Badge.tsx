import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'live' | 'neutral' | 'accent';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest select-none';
  
  const variantClasses = {
    default: 'bg-white/5 border border-white/10 text-gray-300',
    success: 'bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981]',
    warning: 'bg-amber-500/10 border border-amber-500/20 text-amber-450',
    danger: 'bg-rose-500/10 border border-rose-500/20 text-rose-450',
    live: 'bg-emerald-950/40 border border-emerald-800/40 text-[#10b981]',
    neutral: 'bg-white/5 border border-white/10 text-gray-400',
    accent: 'bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981]',
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {variant === 'live' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse shrink-0" />
      )}
      {children || (variant === 'live' ? 'Live' : '')}
    </span>
  );
};
