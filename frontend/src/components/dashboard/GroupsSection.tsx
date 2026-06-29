import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
import { AvatarGroup } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { groupKeys } from '@/hooks/useGroupQueries';
import type { Group, Expense } from '@/types';

interface GroupsSectionProps {
  groups: Group[];
  currentUserId: string;
  onNewGroup?: () => void;
}

export function GroupsSection({ groups, currentUserId, onNewGroup }: GroupsSectionProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 200, damping: 18 },
    },
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg lg:text-xl font-bold text-white">Your Groups</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
            {groups.length} active groups
          </p>
        </div>
        <button
          onClick={onNewGroup}
          className="px-4 py-2 border border-white/6 hover:border-[#10b981]/40 text-xs font-bold rounded-lg uppercase tracking-wider text-white bg-transparent transition-all select-none cursor-pointer"
        >
          New Group +
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-[#111] border border-white/6 rounded-xl p-12 text-center space-y-4">
          <p className="text-gray-400 text-sm">No groups yet. Create a group to get started!</p>
          <button
            onClick={onNewGroup}
            className="px-5 py-2.5 bg-[#10b981] text-[#0a0a0a] font-bold text-xs rounded-lg uppercase tracking-wider transition hover:bg-[#0ea572]"
          >
            Create a Group
          </button>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {groups.map((group) => {
            const myRole = group.members.find((m) => m.userId._id === currentUserId)?.role;
            const memberNames = group.members.map((m) => ({
              name: m.userId.name,
              avatarUrl: m.userId.avatarUrl,
            }));

            // Sync query data from React Query cache
            const groupExpenses = queryClient.getQueryData<Expense[]>(groupKeys.expenses(group._id)) || [];
            const groupBalances = queryClient.getQueryData<any[]>(groupKeys.balances(group._id)) || [];

            const totalSpent = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            
            const myBalanceItem = groupBalances.find((b) => b.userId === currentUserId);
            const myBalance = myBalanceItem ? myBalanceItem.balance : 0;

            return (
              <motion.div
                key={group._id}
                variants={cardVariants}
                whileHover={{ y: -4, borderColor: 'rgba(16, 185, 129, 0.3)' }}
                onClick={() => navigate(`/groups/${group._id}`)}
                className="bg-[#111] border border-white/6 rounded-xl p-6 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(16,185,129,0.06)] cursor-pointer text-left"
              >
                {/* Top Title/Role */}
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="font-heading text-base font-bold text-white group-hover:text-[#10b981] transition-colors leading-snug">
                      {group.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
                      {group.members.length} members
                    </p>
                  </div>
                  {myRole === 'owner' && <Badge variant="success">Owner</Badge>}
                </div>

                {/* Overlapping member avatars */}
                <div className="mb-6 select-none">
                  <AvatarGroup members={memberNames} max={5} size="sm" />
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">Group Spent</p>
                    <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(totalSpent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">Your Balance</p>
                    {myBalance > 0 ? (
                      <p className="text-sm font-bold text-[#10b981] mt-0.5">+{formatCurrency(myBalance)}</p>
                    ) : myBalance < 0 ? (
                      <p className="text-sm font-bold text-rose-500 mt-0.5">-{formatCurrency(Math.abs(myBalance))}</p>
                    ) : (
                      <p className="text-sm font-bold text-gray-400 mt-0.5">Settled</p>
                    )}
                  </div>
                </div>

                {/* View Group button overlay */}
                <div className="absolute right-6 top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#10b981] flex items-center gap-1.5">
                    View Group
                    <span>→</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
