import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useAuthQueries';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import '../styles/Landing.css';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginFormData = z.infer<typeof loginSchema>;

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

  // Stagger variants for the left illustration panel
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
      
      {/* Background Parallax Blurred Orbs */}
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

        {/* Center illustration contents */}
        <div className="my-auto flex flex-col items-start gap-10">
          <motion.div variants={itemVariants}>
            <h1 className="font-heading text-white font-extrabold text-4xl lg:text-[52px] leading-tight select-none">
              Welcome back.
            </h1>
            <p className="text-gray-400 text-base lg:text-lg mt-2">
              Your groups are waiting.
            </p>
          </motion.div>

          {/* Floating Goa Trip Card */}
          <motion.div
            variants={itemVariants}
            animate={{ y: [0, -14, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="w-[330px] bg-[#111]/90 border border-white/6 rounded-2xl p-5 shadow-2xl backdrop-blur-sm select-none"
          >
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
              <div>
                <h3 className="text-white font-bold text-sm tracking-tight">🏖️ Goa Trip</h3>
                <p className="text-[10px] text-gray-500">4 members</p>
              </div>
              <Badge variant="live" />
            </div>

            {/* Balances */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-white/[0.02] pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-emerald-950/40 text-emerald-300 font-bold text-[10px] flex items-center justify-center border border-[#10b981]/20">
                    AS
                  </div>
                  <span className="text-gray-300 font-semibold">Arjun Sharma</span>
                </div>
                <span className="font-bold text-[#10b981]">+₹5,000</span>
              </div>

              <div className="flex justify-between items-center text-xs border-b border-white/[0.02] pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-rose-950/40 text-rose-300 font-bold text-[10px] flex items-center justify-center border border-rose-500/20">
                    PN
                  </div>
                  <span className="text-gray-300 font-semibold">Priya Nair</span>
                </div>
                <span className="font-bold text-rose-500">-₹5,000</span>
              </div>

              <div className="flex justify-between items-center text-xs pb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-white/5 text-gray-300 font-bold text-[10px] flex items-center justify-center border border-white/10">
                    RG
                  </div>
                  <span className="text-gray-300 font-semibold">Rahul Gupta</span>
                </div>
                <span className="font-bold text-rose-500">-₹2,500</span>
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
            <h2 className="font-heading text-white text-2xl font-bold">Sign in</h2>
            <p className="text-xs text-gray-400">
              New here?{' '}
              <Link to="/register" className="text-[#10b981] hover:text-[#0ea572] font-semibold transition ml-0.5">
                Create an account
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Password</label>
                <a href="#forgot" className="text-xs text-[#10b981] hover:text-[#0ea572] font-semibold transition">
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                icon={<LockIcon />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loginMutation.isPending}
              className="w-full mt-2"
            >
              {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
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
