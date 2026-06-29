import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';

import { groupApi, expenseApi, balanceApi } from '@/services/groupApi';
import { groupKeys } from '@/hooks/useGroupQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { CreateGroupModal } from '@/components/group/CreateGroupModal';
import { Modal } from '@/components/ui/Modal';
import PageWrapper from '@/components/ui/PageWrapper';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';

export default function Groups() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || '';
  const toast = useToastStore();

  // Modals / rename states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renamingGroupId, setRenamingGroupId] = useState('');
  const [renamingName, setRenamingName] = useState('');

  // Join group input state
  const [inviteCode, setInviteCode] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Auto-fill invite code from URL query parameter
  useEffect(() => {
    const code = searchParams.get('join');
    if (code) {
      setInviteCode(code);
    }
  }, [searchParams]);

  // 1. Fetch user's groups
  const { data: apiGroups, isLoading: isLoadingGroups } = useQuery({
    queryKey: groupKeys.all,
    queryFn: () => groupApi.listGroups(),
    retry: false,
  });

  const groups = apiGroups ?? [];

  // 2. Fetch expenses for all groups
  const expensesQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: groupKeys.expenses(g._id),
      queryFn: () => expenseApi.listExpenses(g._id),
      enabled: !!g._id,
    })),
  });

  // 3. Fetch balances for all groups
  const balancesQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: groupKeys.balances(g._id),
      queryFn: () => balanceApi.getBalances(g._id),
      enabled: !!g._id,
    })),
  });

  const isLoadingExpenses = expensesQueries.some((q) => q.isLoading);
  const isLoadingBalances = balancesQueries.some((q) => q.isLoading);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (name: string) => groupApi.createGroup(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      setIsCreateOpen(false);
      toast.success('Group created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to create group');
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => groupApi.renameGroup(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      setIsRenameOpen(false);
      setRenamingGroupId('');
      setRenamingName('');
      toast.success('Group renamed');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to rename group');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupApi.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      toast.success('Group deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete group');
    },
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => groupApi.joinGroup(code),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      toast.success('Joined group successfully!');
      setInviteCode('');
      navigate(`/groups/${newGroup._id}`);
    },
    onError: (err: any) => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      toast.error(err.response?.data?.message || err.message || 'Invalid invite code');
    },
  });

  // Handlers
  const handleCreateGroup = async (name: string) => {
    await createMutation.mutateAsync(name);
  };

  const handleRenameGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingName.trim() || !renamingGroupId) return;
    renameMutation.mutate({ id: renamingGroupId, name: renamingName.trim() });
  };

  const handleDeleteGroup = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this group? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    joinMutation.mutate(inviteCode.trim());
  };

  const handleCopyInviteLink = (e: React.MouseEvent, inviteCode: string) => {
    e.stopPropagation();
    const inviteLink = `${window.location.origin}/groups?join=${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied');
  };

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const gridVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08 },
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

  if (isLoadingGroups || isLoadingExpenses || isLoadingBalances) {
    return (
      <div className="space-y-8 py-4 text-left animate-fade-in">
        <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
        </div>
      </div>
    );
  }

  return (
    <PageWrapper className="min-h-0 bg-transparent space-y-8 pb-10">
      
      {/* 1. Header slideInDown */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between flex-wrap gap-5 border-b border-white/5 pb-6 text-left select-none"
      >
        <div>
          <h1 className="font-heading text-white font-extrabold text-2xl tracking-tight leading-tight">
            Your Groups
          </h1>
          <p className="text-gray-500 text-xs mt-1 font-semibold">
            Manage your shared expenses with custom groups
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} variant="primary" size="md">
          New Group +
        </Button>
      </motion.div>

      {/* 2. Grid (3 col desktop, 2 col tablet, 1 col mobile) */}
      {groups.length === 0 ? (
        // Empty state with scaleIn
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[#111] border border-white/6 rounded-2xl p-16 text-center space-y-5"
        >
          <div className="w-16 h-16 bg-[#10b981]/10 rounded-full flex items-center justify-center text-3xl mx-auto shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            👥
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-white">No groups yet</h3>
            <p className="text-gray-500 text-xs mt-1">Create your first group to start splitting expenses</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 bg-[#10b981] text-[#0a0a0a] font-bold text-xs rounded-lg uppercase tracking-wider transition hover:bg-[#0ea572] cursor-pointer"
          >
            Create Group
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {/* Create new group dashed card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ y: -6, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.01)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreateOpen(true)}
              className="border-2 border-dashed border-white/10 rounded-2xl p-7 flex flex-col items-center justify-center text-center gap-3.5 cursor-pointer min-h-[220px] transition-colors duration-300 select-none"
            >
              <div className="w-12 h-12 rounded-full bg-[#10b981]/10 flex items-center justify-center text-lg text-[#10b981] font-bold">
                +
              </div>
              <span className="text-xs font-bold text-gray-300">Create new group</span>
            </motion.div>

            {/* Live groups cards */}
            {groups.map((group, index) => {
              const myRole = group.members.find((m) => m.userId._id === currentUserId)?.role;
              const isOwner = myRole === 'owner';

              // Sync variables from parallel query indexes
              const groupExpenses = expensesQueries[index]?.data || [];
              const groupBalances = balancesQueries[index]?.data || [];

              const totalSpent = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
              const expenseCount = groupExpenses.length;

              const myBalanceItem = groupBalances.find((b) => b.userId === currentUserId);
              const myBalance = myBalanceItem ? myBalanceItem.balance : 0;

              return (
                <motion.div
                  key={group._id}
                  variants={cardVariants}
                  whileHover={{ y: -6, borderColor: 'rgba(16, 185, 129, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/groups/${group._id}`)}
                  className="bg-[#111] border border-white/6 rounded-2xl p-7 flex flex-col justify-between gap-5 transition-all duration-300 relative group hover:shadow-[0_20px_40px_rgba(16,185,129,0.06)] select-none text-left"
                >
                  
                  {/* Card Top: title + options menu */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-heading text-base font-bold text-white leading-snug group-hover:text-[#10b981] transition-colors truncate max-w-[170px]">
                        {group.name}
                      </h3>
                      {myRole === 'owner' && (
                        <Badge variant="success" className="mt-1 text-[8px] py-0">Owner</Badge>
                      )}
                    </div>

                    {/* Simple Options Dots Menu */}
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === group._id ? null : group._id);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition cursor-pointer select-none"
                      >
                        •••
                      </button>
                      <AnimatePresence>
                        {activeMenuId === group._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 mt-1 w-32 bg-[#161616] border border-white/6 rounded-lg shadow-xl p-1 z-20"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingGroupId(group._id);
                                  setRenamingName(group.name);
                                  setIsRenameOpen(true);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300 hover:bg-white/5 hover:text-white rounded"
                              >
                                Rename
                              </button>
                              {isOwner && (
                                <button
                                  onClick={(e) => {
                                    setActiveMenuId(null);
                                    handleDeleteGroup(e, group._id);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 rounded"
                                >
                                  Delete
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Overlapping member avatars list */}
                  <div>
                    <div className="flex items-center -space-x-1.5">
                      {group.members.slice(0, 4).map((m) => (
                        <Avatar key={m.userId._id} name={m.userId.name} src={m.userId.avatarUrl} size="xs" />
                      ))}
                      {group.members.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] text-gray-400 font-bold shrink-0">
                          +{group.members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider line */}
                  <div className="border-t border-white/6 my-0.5" />

                  {/* Stats list */}
                  <div className="grid grid-cols-3 gap-2 text-left">
                    <div>
                      <span className="text-[7px] uppercase tracking-wider text-gray-500 font-bold block">Spent</span>
                      <span className="text-xs font-bold text-white block mt-0.5 truncate">{formatCurrency(totalSpent)}</span>
                    </div>
                    <div>
                      <span className="text-[7px] uppercase tracking-wider text-gray-500 font-bold block">Expenses</span>
                      <span className="text-xs font-bold text-white block mt-0.5">{expenseCount}</span>
                    </div>
                    <div>
                      <span className="text-[7px] uppercase tracking-wider text-gray-500 font-bold block">Members</span>
                      <span className="text-xs font-bold text-white block mt-0.5">{group.members.length}</span>
                    </div>
                  </div>

                  {/* Your balance block */}
                  <div className="pt-1.5">
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 font-semibold block">Your Balance</span>
                    {myBalance > 0 ? (
                      <div className="mt-1">
                        <span className="text-base font-extrabold text-[#10b981]">{formatCurrency(myBalance)}</span>
                        <span className="text-[8px] text-[#10b981] font-bold uppercase tracking-wider ml-1.5">you get back</span>
                      </div>
                    ) : myBalance < 0 ? (
                      <div className="mt-1">
                        <span className="text-base font-extrabold text-rose-500">{formatCurrency(myBalance)}</span>
                        <span className="text-[8px] text-rose-500 font-bold uppercase tracking-wider ml-1.5">you owe</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-gray-400 mt-1 block">Settled</span>
                    )}
                  </div>

                  {/* Bottom: View Group + copy invite button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-extrabold text-[#10b981] uppercase tracking-wider flex items-center gap-1">
                      View Group →
                    </span>
                    <button
                      onClick={(e) => handleCopyInviteLink(e, group.inviteCode)}
                      className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:border-[#10b981]/40 flex items-center justify-center text-xs hover:bg-[#10b981]/5 transition select-none cursor-pointer"
                      title="Copy Invite Link"
                    >
                      📋
                    </button>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 3. Join Group Section */}
      <div className="pt-6 border-t border-white/5 text-left">
        <div className="max-w-md space-y-3">
          <div>
            <h3 className="font-heading text-base font-bold text-white">Have an invite code?</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
              enter code to instantly join your team
            </p>
          </div>

          <motion.form
            onSubmit={handleJoinSubmit}
            animate={isShaking ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="flex gap-3"
          >
            <div className="flex-1">
              <Input
                placeholder="e.g. BAR-2024"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="font-mono tracking-wider text-xs placeholder:text-gray-600"
              />
            </div>
            <button
              type="submit"
              disabled={joinMutation.isPending || !inviteCode.trim()}
              className="px-5 py-2.5 bg-[#10b981] hover:bg-[#0ea572] text-[#0a0a0a] font-bold text-xs rounded-xl uppercase tracking-wider transition-all select-none cursor-pointer disabled:opacity-50"
            >
              {joinMutation.isPending ? 'Joining...' : 'Join Group'}
            </button>
          </motion.form>
        </div>
      </div>

      {/* Modals mount layer */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateGroup}
        isLoading={createMutation.isPending}
      />

      {/* Rename group modal frame */}
      <Modal
        isOpen={isRenameOpen}
        onClose={() => {
          setIsRenameOpen(false);
          setRenamingGroupId('');
          setRenamingName('');
        }}
        title="Rename Group"
        subtitle="Provide a new title for this shared space"
        footer={
          <>
            <button
              onClick={() => setIsRenameOpen(false)}
              className="px-4 py-2 border border-transparent text-xs font-bold text-gray-500 hover:text-white transition cursor-pointer select-none"
            >
              Cancel
            </button>
            <button
              onClick={handleRenameGroupSubmit}
              disabled={renameMutation.isPending || !renamingName.trim()}
              className="px-5 py-2.5 bg-[#10b981] hover:bg-[#0ea572] text-[#0a0a0a] font-bold text-xs rounded-lg uppercase tracking-wider transition select-none cursor-pointer disabled:opacity-50"
            >
              Rename
            </button>
          </>
        }
      >
        <form onSubmit={handleRenameGroupSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 select-none">New Name</label>
            <Input
              value={renamingName}
              onChange={(e) => setRenamingName(e.target.value)}
              placeholder="e.g. Barcelona Trip, Housemates"
              autoFocus
            />
          </div>
        </form>
      </Modal>

    </PageWrapper>
  );
}
