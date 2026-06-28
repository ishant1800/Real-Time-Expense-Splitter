import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useAuthQueries';
import { cn } from '../lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMsg('');
      await loginMutation.mutateAsync(data);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Login failed'
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h2>
          <p className="text-sm text-foreground-subtle">
            Sign in to split expenses with friends
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger animate-fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground-muted">Password</label>
              <a href="#forgot" className="text-xs text-accent-light hover:underline">
                Forgot password?
              </a>
            </div>
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

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2"
          >
            {loginMutation.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-foreground-subtle pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent-light hover:underline font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
