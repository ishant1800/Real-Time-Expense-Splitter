import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../hooks/useAuthQueries';
import { cn } from '../lib/utils';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Full name is required').max(100, 'Name must be under 100 characters'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setErrorMsg('');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerDetails } = data;
      await registerMutation.mutateAsync(registerDetails);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Registration failed'
      );
    }
  };

  const inputCls =
    'w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md card p-8 relative overflow-hidden space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl shadow-glow mx-auto mb-4">
            💸
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h2>
          <p className="text-sm text-foreground-subtle">
            Get started splitting bills and settled balances
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger animate-fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground-muted">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              {...register('name')}
              className={cn(inputCls, errors.name && 'border-danger/50')}
            />
            {errors.name && (
              <p className="text-xs text-danger">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground-muted">Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className={cn(inputCls, errors.email && 'border-danger/50')}
            />
            {errors.email && (
              <p className="text-xs text-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground-muted">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={cn(inputCls, errors.password && 'border-danger/50')}
            />
            {errors.password && (
              <p className="text-xs text-danger">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground-muted">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              className={cn(inputCls, errors.confirmPassword && 'border-danger/50')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2"
          >
            {registerMutation.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {registerMutation.isPending ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-surface-border" />
          <span className="flex-shrink mx-4 text-foreground-subtle text-xs uppercase">Or</span>
          <div className="flex-grow border-t border-surface-border" />
        </div>

        <GoogleSignInButton onError={(err) => setErrorMsg(err)} />

        <p className="text-center text-sm text-foreground-subtle pt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-light hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
