import { motion, AnimatePresence, Variants } from 'framer-motion';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { ActivityItem, ActivityType } from '@/types';

interface ActivityFeedProps {
  items: ActivityItem[];
}

function getActivityMeta(item: ActivityItem): { icon: string; text: React.ReactNode; color: string } {
  const amount = item.amount ? formatCurrency(item.amount) : '';

  switch (item.type as ActivityType) {
    case 'expense_added':
      return {
        icon: '➕',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        text: (
          <span>
            <strong className="text-white">{item.actorName}</strong>
            {' added '}
            <strong className="text-white">"{item.description}"</strong>
            {' ('}
            <span className="text-gray-400">{amount}</span>
            {') in '}
            <span className="text-[#10b981]">{item.groupName}</span>
          </span>
        ),
      };
    case 'expense_updated':
      return {
        icon: '✏️',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        text: (
          <span>
            <strong className="text-white">{item.actorName}</strong>
            {' updated '}
            <strong className="text-white">"{item.description}"</strong>
            {' in '}
            <span className="text-[#10b981]">{item.groupName}</span>
          </span>
        ),
      };
    case 'expense_deleted':
      return {
        icon: '🗑️',
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        text: (
          <span>
            <strong className="text-white">{item.actorName}</strong>
            {' deleted an expense in '}
            <span className="text-[#10b981]">{item.groupName}</span>
          </span>
        ),
      };
    case 'settlement_completed':
      return {
        icon: '✅',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        text: (
          <span>
            <strong className="text-white">{item.actorName}</strong>
            {' paid '}
            <strong className="text-white">{item.targetName}</strong>
            {' '}
            <span className="text-[#10b981] font-semibold">{amount}</span>
            {' in '}
            <span className="text-[#10b981]">{item.groupName}</span>
          </span>
        ),
      };
    case 'member_joined':
      return {
        icon: '👋',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        text: (
          <span>
            <strong className="text-white">{item.actorName}</strong>
            {' joined '}
            <span className="text-[#10b981]">{item.groupName}</span>
          </span>
        ),
      };
    case 'member_removed':
      return {
        icon: '👤',
        color: 'bg-rose-500/10 text-rose-450 border-rose-500/20',
        text: (
          <span>
            <strong className="text-white">{item.actorName}</strong>
            {' removed '}
            <strong className="text-white">{item.targetName}</strong>
            {' from '}
            <span className="text-[#10b981]">{item.groupName}</span>
          </span>
        ),
      };
    default:
      return { icon: '📌', color: 'bg-white/5 border-white/10 text-gray-300', text: <span>Activity</span> };
  }
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 200, damping: 20 },
    },
    exit: { opacity: 0, x: 10, transition: { duration: 0.2 } },
  };

  return (
    <div className="bg-[#111] border border-white/6 rounded-xl p-6 text-left space-y-5">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-2 select-none">
        <div>
          <h2 className="font-heading text-lg font-bold text-white">Recent Activity</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
            real-time group stream
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#10b981] font-bold">Active</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-xs">
          No activities registered yet.
        </div>
      ) : (
        <div className="relative border-l border-white/5 pl-6 ml-3 space-y-5 py-1">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const { icon, text } = getActivityMeta(item);

              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="relative group"
                >
                  {/* Timeline Dot */}
                  <span className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-[#10b981] border-2 border-[#111] group-hover:scale-125 transition-transform duration-200" />
                  
                  {/* Content area */}
                  <div className="flex items-start gap-3">
                    <span className="text-sm select-none mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">
                        {text}
                      </p>
                      <p className="text-[9px] text-gray-600 font-semibold mt-1">
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
