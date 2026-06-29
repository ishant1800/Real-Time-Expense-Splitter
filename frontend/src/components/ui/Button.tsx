import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'style'> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', size = 'md', loading, disabled, type = 'button', ...props }, ref) => {
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs rounded',
      md: 'px-5 py-2.5 text-sm rounded-lg font-semibold',
      lg: 'px-7 py-3.5 text-base rounded-xl font-bold',
    };

    const variantClasses = {
      primary: 'bg-[#10b981] text-white font-bold shadow-lg hover:bg-[#0ea572] shadow-[#10b981]/10 animate-pulse-emerald border border-[#10b981]/20',
      ghost: 'bg-transparent border border-transparent text-gray-400 hover:text-white hover:border-white/10',
      outline: 'bg-transparent border border-white/6 text-white hover:border-[#10b981]/40',
      danger: 'bg-rose-600 text-white font-bold hover:bg-rose-500 shadow-lg shadow-rose-950/20 border border-rose-600/20',
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 disabled:opacity-50 disabled:pointer-events-none disabled:animate-none select-none',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...(props as any)}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
