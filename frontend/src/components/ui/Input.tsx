import React, { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, icon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === 'password';
    const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="space-y-1.5 w-full text-left">
        <div className="relative w-full">
          {/* Left Icon Slot */}
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}

          {/* Input field */}
          <motion.input
            ref={ref}
            type={currentType}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-[#64748B] text-sm rounded-xl py-3.5 px-4 outline-none transition-all duration-200',
              icon && 'pl-11',
              isPassword && 'pr-12',
              isFocused && 'border-[#10b981]/60 shadow-[0_0_15px_rgba(16,185,129,0.25)] bg-white/[0.06]',
              error && 'border-rose-500/60 focus:border-rose-500/80 focus:shadow-[0_0_15px_rgba(244,63,94,0.25)]',
              className
            )}
            {...(props as any)}
          />

          {/* Password visibility toggle button */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-rose-500 mt-0.5">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
