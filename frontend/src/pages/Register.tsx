import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../hooks/useAuthQueries';
import { cn } from '../lib/utils';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import '../styles/Landing.css';

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

const UserIcon = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default function Register() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setErrorMsg('');
      const { confirmPassword, ...registerDetails } = data;
      await registerMutation.mutateAsync(registerDetails);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Registration failed'
      );
    }
  };

  // Watch password for real-time strength bar calculations
  const passwordValue = watch('password', '');

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-transparent', width: '0%', textColor: 'text-gray-500' };

    let types = 0;
    if (/[a-zA-Z]/.test(pwd)) types++;
    if (/[0-9]/.test(pwd)) types++;
    if (/[^a-zA-Z0-9]/.test(pwd)) types++;

    if (pwd.length < 6 || types <= 1) {
      return { score: 1, label: 'Weak', color: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]', width: '33%', textColor: 'text-rose-450' };
    }
    if (pwd.length >= 8 && types >= 3) {
      return { score: 3, label: 'Strong', color: 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.3)]', width: '100%', textColor: 'text-[#10b981]' };
    }
    return { score: 2, label: 'Fair', color: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]', width: '66%', textColor: 'text-amber-500' };
  };

  const strength = getPasswordStrength(passwordValue);

  // Stagger animation settings
  const panelVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex w-full font-body overflow-hidden relative">
      
      {/* Background Blurs */}
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] rounded-full blur-[100px] blur-orb-emerald-1 pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full blur-[100px] blur-orb-emerald-2 pointer-events-none z-0" />

      {/* LEFT PANEL: 55% split on desktop, 45% on tablet, hidden on mobile */}
      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className="hidden md:flex md:w-[45%] lg:w-[55%] min-h-screen relative flex-col justify-between p-12 lg:p-16 border-r border-white/5 bg-[#0a0a0a]/40 bg-dot-grid z-10"
      >
        {/* Brand Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_12px_#10b981]" />
          <span className="font-heading text-lg tracking-tight text-white select-none">
            SplitWise
          </span>
        </motion.div>

        {/* Center illustration content */}
        <div className="my-auto flex flex-col items-start gap-10">
          <motion.div variants={itemVariants}>
            <h1 className="font-heading text-white font-extrabold text-4xl lg:text-[52px] leading-tight select-none">
              Start splitting.
            </h1>
            <p className="text-gray-400 text-base lg:text-lg mt-2">
              Fair and square, every time.
            </p>
          </motion.div>

          {/* Floating Create Group Dialog Card */}
          <motion.div
            variants={itemVariants}
            animate={{ y: [0, -14, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="w-[330px] bg-[#111]/90 border border-white/6 rounded-2xl p-5.5 shadow-2xl backdrop-blur-sm select-none text-left space-y-4"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-white font-bold text-sm">👥 Create Group</span>
              <Badge variant="success">Invite Ready</Badge>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Group Name</span>
                <div className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3.5 text-xs text-white font-semibold flex items-center gap-2">
                  <span>🏖️</span>
                  <span>Goa Trip 2026</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Shareable Invite Link</span>
                <div className="w-full bg-white/[0.02] border border-white/5 rounded-lg py-2 px-3 flex justify-between items-center text-[10px] text-gray-400 font-semibold font-mono">
                  <span>splitwise.in/join/goa-2026</span>
                  <span className="text-[#10b981] font-bold text-[9px] uppercase tracking-widest bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom statistics */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-6 lg:gap-8 border-t border-white/5 pt-6 max-w-sm"
        >
          <div>
            <div className="font-heading text-lg lg:text-xl text-white font-bold">10K+</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mt-1">Active groups</div>
          </div>
          <div>
            <div className="font-heading text-lg lg:text-xl text-white font-bold">₹2Cr+</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mt-1">Settled monthly</div>
          </div>
          <div>
            <div className="font-heading text-lg lg:text-xl text-white font-bold">4.9★</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mt-1">User rating</div>
          </div>
        </motion.div>
      </motion.div>

      {/* RIGHT PANEL: Centered Form Panel (45% split on desktop, 55% on tablet, full width on mobile) */}
      <div className="w-full md:w-[55%] lg:w-[45%] min-h-screen flex items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Form Card wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md bg-[#111] border border-white/6 rounded-2xl p-12 space-y-6 shadow-2xl backdrop-blur-sm relative"
        >
          {/* Logo brand & Titles */}
          <div className="text-center space-y-2.5">
            <div className="flex items-center justify-center gap-2 select-none mb-1">
              <span className="w-3.5 h-3.5 rounded-full bg-[#10b981] shadow-[0_0_12px_#10b981]" />
              <span className="font-heading text-2xl tracking-tight text-white font-bold">
                SplitWise
              </span>
            </div>
            <h2 className="font-heading text-white text-2xl font-bold">Create account</h2>
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-[#10b981] hover:text-[#0ea572] font-semibold transition ml-0.5">
                Sign in
              </Link>
            </p>
          </div>

          {/* AnimatePresence for Error Box alerts */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-450 flex items-start gap-2.5">
                  <svg className="w-4 h-4 shrink-0 fill-current mt-0.5" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Full Name field */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                icon={<UserIcon />}
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            {/* Email field */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Email Address</label>
              <Input
                type="email"
                placeholder="name@example.com"
                icon={<MailIcon />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            {/* Password field */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                icon={<LockIcon />}
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Password strength indicator */}
              {passwordValue && (
                <div className="space-y-1.5 mt-1.5 text-left">
                  <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold text-gray-500">
                    <span>Complexity</span>
                    <span className={cn('font-bold', strength.textColor)}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: strength.width }}
                      transition={{ duration: 0.3 }}
                      className={cn('h-full transition-colors duration-300 rounded-full', strength.color)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password field */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                icon={<LockIcon />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            {/* Create Account Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={registerMutation.isPending}
              className="w-full mt-3"
            >
              {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center select-none">
            <div className="flex-grow border-t border-white/5" />
            <span className="flex-shrink mx-4 text-gray-600 text-[9px] uppercase font-bold tracking-widest">or continue with</span>
            <div className="flex-grow border-t border-white/5" />
          </div>

          {/* Google SSO Button */}
          <GoogleSignInButton onError={(err) => setErrorMsg(err)} />
        </motion.div>
      </div>
    </div>
  );
}
