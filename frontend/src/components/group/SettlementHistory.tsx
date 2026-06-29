import { motion, Variants } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Settlement } from '@/types';

interface SettlementHistoryProps {
  settlements: Settlement[];
  currentUserId: string;
}

export function SettlementHistory({ settlements, currentUserId }: SettlementHistoryProps) {
  const sorted = [...settlements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 220, damping: 20 },
    },
  };

  if (settlements.length === 0) {
    return (
      <div className="bg-[#111] border border-white/6 rounded-xl p-16 text-center space-y-2 select-none">
        <span className="text-4xl">🤝</span>
        <h3 className="font-heading text-base font-bold text-white mt-2">No settlements yet</h3>
        <p className="text-gray-500 text-xs">Once members settle up, history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <div className="pb-2 select-none">
        <h2 className="font-heading text-lg font-bold text-white">Settlement History</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
          {settlements.length} total settlements recorded
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {sorted.map((s) => {
          const isFromMe = s.from._id === currentUserId;
          const isToMe = s.to._id === currentUserId;

          return (
            <motion.div
              key={s._id}
              variants={itemVariants}
              whileHover={{ y: -1, borderColor: 'rgba(16, 185, 129, 0.25)' }}
              className="bg-[#111] border border-white/6 rounded-xl p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-[0_15px_30px_rgba(16,185,129,0.02)]"
            >
              {/* Avatars Flow */}
              <div className="flex items-center gap-4.5">
                {/* From User */}
                <div className="flex items-center gap-2">
                  <Avatar name={s.from.name} src={s.from.avatarUrl} size="xs" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white truncate max-w-[80px] block">
                      {isFromMe ? 'You' : s.from.name.split(' ')[0]}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 font-bold block">Sent</span>
                  </div>
                </div>

                {/* Arrow */}
                <span className="text-gray-500 text-sm select-none">➔</span>

                {/* To User */}
                <div className="flex items-center gap-2">
                  <Avatar name={s.to.name} src={s.to.avatarUrl} size="xs" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white truncate max-w-[80px] block">
                      {isToMe ? 'You' : s.to.name.split(' ')[0]}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 font-bold block">Received</span>
                  </div>
                </div>
              </div>

              {/* Middle Date/Time */}
              <div className="hidden sm:block text-left">
                <span className="text-[10px] text-gray-400 font-medium">
                  {formatDate(s.createdAt)}
                </span>
              </div>

              {/* Right: Amount & settled status */}
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm font-extrabold text-[#10b981]">
                  {formatCurrency(s.amount)}
                </span>
                <Badge variant="success">Settled</Badge>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
