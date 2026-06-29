import CountUp from 'react-countup';
import { motion, Variants } from 'framer-motion';
import type { DashboardStats } from '@/types';

interface StatsSectionProps {
  stats: DashboardStats;
  totalSpent: number;
}

const formatIndianNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

const formatInteger = (num: number) => {
  return String(Math.round(num));
};

export function StatsSection({ stats, totalSpent }: StatsSectionProps) {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 200, damping: 18 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* 1. Total Spent */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, borderColor: 'rgba(16, 185, 129, 0.3)' }}
        className="bg-[#111] border border-white/6 rounded-xl p-6 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(16,185,129,0.06)]"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">
            💸
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            ↑ 12%
          </span>
        </div>
        <div className="space-y-1 text-left">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Total Spent</p>
          <p className="text-2xl font-bold text-white tracking-tight font-heading">
            <CountUp end={totalSpent} formattingFn={formatIndianNumber} duration={1.5} />
          </p>
          <p className="text-[10px] text-gray-500">paid by you this month</p>
        </div>
      </motion.div>

      {/* 2. You Are Owed */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, borderColor: 'rgba(16, 185, 129, 0.3)' }}
        className="bg-[#111] border border-white/6 rounded-xl p-6 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(16,185,129,0.06)]"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">
            📥
          </div>
        </div>
        <div className="space-y-1 text-left">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">You Are Owed</p>
          <p className="text-2xl font-bold text-[#10b981] tracking-tight font-heading">
            <CountUp end={stats.totalReceivable} formattingFn={formatIndianNumber} duration={1.5} />
          </p>
          <p className="text-[10px] text-gray-500">across all groups</p>
        </div>
      </motion.div>

      {/* 3. You Owe */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, borderColor: 'rgba(16, 185, 129, 0.3)' }}
        className="bg-[#111] border border-white/6 rounded-xl p-6 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(16,185,129,0.06)]"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold shadow-lg">
            📤
          </div>
        </div>
        <div className="space-y-1 text-left">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">You Owe</p>
          <p className="text-2xl font-bold text-rose-500 tracking-tight font-heading">
            <CountUp end={stats.totalOwed} formattingFn={formatIndianNumber} duration={1.5} />
          </p>
          <p className="text-[10px] text-gray-500">pending settlement</p>
        </div>
      </motion.div>

      {/* 4. Active Groups */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, borderColor: 'rgba(16, 185, 129, 0.3)' }}
        className="bg-[#111] border border-white/6 rounded-xl p-6 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(16,185,129,0.06)]"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold shadow-lg">
            👥
          </div>
        </div>
        <div className="space-y-1 text-left">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Active Groups</p>
          <p className="text-2xl font-bold text-white tracking-tight font-heading">
            <CountUp end={stats.groupCount} formattingFn={formatInteger} duration={1.5} />
          </p>
          <p className="text-[10px] text-gray-500">you are a member of</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
