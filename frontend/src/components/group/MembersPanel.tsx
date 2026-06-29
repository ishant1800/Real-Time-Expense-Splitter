import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { groupKeys } from '@/hooks/useGroupQueries';
import { useToastStore } from '@/store/useToastStore';
import { formatCurrency } from '@/lib/utils';
import type { Group, GroupMember } from '@/types';

interface MembersPanelProps {
  group: Group;
  currentUserId: string;
  onRemoveMember?: (userId: string) => void;
  isRemoving?: boolean;
  isSidebar?: boolean;
}

export function MembersPanel({
  group,
  currentUserId,
  onRemoveMember,
  isRemoving,
  isSidebar = false,
}: MembersPanelProps) {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const toast = useToastStore();
  const queryClient = useQueryClient();

  const myRole = group.members.find((m) => m.userId._id === currentUserId)?.role;
  const isOwner = myRole === 'owner';

  // Read balances from cache
  const balances = queryClient.getQueryData<any[]>(groupKeys.balances(group._id)) || [];

  const handleRemove = (member: GroupMember) => {
    if (confirmRemove === member.userId._id) {
      onRemoveMember?.(member.userId._id);
      setConfirmRemove(null);
    } else {
      setConfirmRemove(member.userId._id);
      setTimeout(() => setConfirmRemove(null), 3000);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/groups?join=${group.inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard');
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 220, damping: 20 },
    },
  };

  // ─── Sidebar Render (Compact List) ────────────────────────────────────────
  if (isSidebar) {
    return (
      <div className="bg-[#111] border border-white/6 rounded-xl p-5 text-left space-y-4">
        <div className="flex justify-between items-center pb-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold select-none">
            Members list
          </span>
          <span className="text-[10px] text-gray-400 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded">
            {group.members.length} people
          </span>
        </div>

        <div className="space-y-2">
          {group.members.map((member) => {
            const isMe = member.userId._id === currentUserId;
            return (
              <div key={member.userId._id} className="flex items-center gap-2.5 p-2 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                <Avatar name={member.userId.name} src={member.userId.avatarUrl} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {member.userId.name} {isMe && '(You)'}
                  </p>
                </div>
                <Badge variant={member.role === 'owner' ? 'success' : 'neutral'} className="text-[8px] py-0 px-1 rounded-sm">
                  {member.role === 'owner' ? 'Owner' : 'Member'}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Members Tab Render (Full Grid + Invite Card) ───────────────────────
  return (
    <div className="space-y-6 text-left">
      <div className="pb-1 select-none">
        <h2 className="font-heading text-lg font-bold text-white">Group Members</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
          manage group roster and invitations
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Roster members cards */}
        {group.members.map((member) => {
          const isMe = member.userId._id === currentUserId;
          const canRemove = isOwner && !isMe && member.role !== 'owner';

          // Get net balance with this member
          const memberBalanceItem = balances.find((b) => b.userId === member.userId._id);
          const memberBalance = memberBalanceItem ? memberBalanceItem.balance : 0;

          return (
            <motion.div
              key={member.userId._id}
              variants={itemVariants}
              whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.25)' }}
              className="bg-[#111] border border-white/6 rounded-xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 relative group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={member.userId.name} src={member.userId.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {member.userId.name} {isMe && '(You)'}
                    </p>
                    <p className="text-[9px] text-gray-500 truncate">{member.userId.email}</p>
                  </div>
                </div>
                <Badge variant={member.role === 'owner' ? 'success' : 'neutral'}>
                  {member.role === 'owner' ? 'Owner' : 'Member'}
                </Badge>
              </div>

              {/* Balance display */}
              <div className="pt-3.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Net Balance</span>
                {memberBalance > 0 ? (
                  <span className="text-xs font-bold text-[#10b981]">+{formatCurrency(memberBalance)}</span>
                ) : memberBalance < 0 ? (
                  <span className="text-xs font-bold text-rose-500">-{formatCurrency(Math.abs(memberBalance))}</span>
                ) : (
                  <span className="text-xs font-bold text-gray-400">Settled</span>
                )}
              </div>

              {/* Owner member removal button */}
              {canRemove && (
                <div className="absolute right-4 top-4">
                  <button
                    onClick={() => handleRemove(member)}
                    disabled={isRemoving}
                    className={`
                      text-[9px] uppercase tracking-wider font-extrabold px-2 py-1 rounded transition-all cursor-pointer select-none
                      ${confirmRemove === member.userId._id
                        ? 'bg-rose-500/20 text-rose-450 border border-rose-500/30 animate-pulse'
                        : 'opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10'}
                    `}
                  >
                    {confirmRemove === member.userId._id ? 'Sure?' : 'Remove'}
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Invite Member card with dashed border */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.4)', backgroundColor: 'rgba(16,185,129,0.01)' }}
          onClick={handleCopyInviteLink}
          className="border border-dashed border-white/12 hover:border-[#10b981] bg-transparent rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer min-h-[120px] select-none text-center"
        >
          <span className="text-2xl">📋</span>
          <div>
            <p className="text-xs font-bold text-white">Invite Member</p>
            <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">
              Code: {group.inviteCode} · Copy Link
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
