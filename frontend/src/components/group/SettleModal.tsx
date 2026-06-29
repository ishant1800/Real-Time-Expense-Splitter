import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { useToastStore } from '@/store/useToastStore';
import { balanceApi } from '@/services/groupApi';
import { groupKeys } from '@/hooks/useGroupQueries';
import type { Group } from '@/types';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: Group;
  groups?: Group[];
  currentUserId: string;
  onSuccess?: () => void;
  preFill?: {
    fromUserId?: string;
    toUserId?: string;
    amount?: number;
  };
}

export function SettleModal({
  isOpen,
  onClose,
  group: initialGroup,
  groups = [],
  currentUserId,
  onSuccess,
  preFill,
}: SettleModalProps) {
  const queryClient = useQueryClient();
  const toast = useToastStore();

  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(initialGroup);
  const [fromUserId, setFromUserId] = useState(currentUserId);
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync selected group on initialGroup prop change
  useEffect(() => {
    setSelectedGroup(initialGroup);
  }, [initialGroup]);

  // Handle prefill values or reset on open
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialGroup) {
        setSelectedGroup(initialGroup);
      } else if (groups.length > 0) {
        setSelectedGroup(groups[0]);
      }

      if (preFill) {
        setFromUserId(preFill.fromUserId || currentUserId);
        setToUserId(preFill.toUserId || '');
        setAmount(preFill.amount ? String(preFill.amount) : '');
      } else {
        setFromUserId(currentUserId);
        setToUserId('');
        setAmount('');
      }
    }
  }, [isOpen, initialGroup, groups, preFill, currentUserId]);

  const handleGroupChange = (groupId: string) => {
    const found = groups.find((g) => g._id === groupId);
    setSelectedGroup(found);
    setToUserId('');
    setAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) {
      setError('Please select a group');
      return;
    }
    if (!fromUserId || !toUserId) {
      setError('Select who is paying and who is receiving');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await balanceApi.createSettlement(selectedGroup._id, {
        from: fromUserId,
        to: toUserId,
        amount: parsedAmount,
      });

      queryClient.invalidateQueries({ queryKey: groupKeys.balances(selectedGroup._id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.settlements(selectedGroup._id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });

      toast.success('Settled up successfully');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to record settlement';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const members = selectedGroup?.members || [];
  const otherMembers = members.filter((m) => m.userId._id !== fromUserId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Card - centered 480px */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-[480px] bg-[#111] border border-white/6 rounded-2xl shadow-2xl z-10 overflow-hidden text-left"
          >
            
            {/* Header */}
            <div className="p-6 border-b border-white/5 select-none">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">Record Settlement</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
                    {selectedGroup ? `Settling in ${selectedGroup.name}` : 'Record a payment'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <form id="settle-form" onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-450">
                  {error}
                </div>
              )}

              {/* Group Selector (Dashboard mode) */}
              {!initialGroup && groups.length > 0 && (
                <div className="space-y-1.5 select-none">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Select Group</label>
                  <select
                    value={selectedGroup?._id || ''}
                    onChange={(e) => handleGroupChange(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-xs text-white rounded-xl px-4 py-3 cursor-pointer outline-none focus:border-[#10b981]/50 transition-all"
                  >
                    {groups.map((g) => (
                      <option key={g._id} value={g._id} className="bg-[#111]">{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* From/To selectors with Avatars */}
              <div className="grid grid-cols-2 gap-4">
                {/* From member (Payer) */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block select-none">
                    Payer (From)
                  </label>
                  <select
                    value={fromUserId}
                    onChange={(e) => {
                      setFromUserId(e.target.value);
                      setToUserId('');
                    }}
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-xs text-white rounded-xl px-3 py-2.5 cursor-pointer outline-none"
                  >
                    {members.map((m) => (
                      <option key={m.userId._id} value={m.userId._id} className="bg-[#111]">
                        {m.userId.name} {m.userId._id === currentUserId && '(You)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* To member (Receiver) */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block select-none">
                    Receiver (To)
                  </label>
                  <select
                    value={toUserId}
                    onChange={(e) => setToUserId(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-xs text-white rounded-xl px-3 py-2.5 cursor-pointer outline-none"
                    disabled={otherMembers.length === 0}
                  >
                    <option value="" className="bg-[#111]">Select...</option>
                    {otherMembers.map((m) => (
                      <option key={m.userId._id} value={m.userId._id} className="bg-[#111]">
                        {m.userId.name} {m.userId._id === currentUserId && '(You)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Show selected user avatars flow */}
              <div className="flex items-center justify-center gap-6 p-4 bg-white/[0.01] border border-white/5 rounded-2xl select-none">
                {/* From user avatar */}
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <Avatar
                    name={members.find((m) => m.userId._id === fromUserId)?.userId.name || 'Payer'}
                    src={members.find((m) => m.userId._id === fromUserId)?.userId.avatarUrl}
                    size="md"
                  />
                  <span className="text-[10px] text-gray-400 font-bold truncate max-w-[90px]">
                    {fromUserId === currentUserId ? 'You' : members.find((m) => m.userId._id === fromUserId)?.userId.name.split(' ')[0]}
                  </span>
                </div>

                {/* Arrow */}
                <span className="text-gray-500 text-lg">➔</span>

                {/* To user avatar */}
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <Avatar
                    name={members.find((m) => m.userId._id === toUserId)?.userId.name || 'Receiver'}
                    src={members.find((m) => m.userId._id === toUserId)?.userId.avatarUrl}
                    size="md"
                  />
                  <span className="text-[10px] text-gray-400 font-bold truncate max-w-[90px]">
                    {toUserId ? (toUserId === currentUserId ? 'You' : members.find((m) => m.userId._id === toUserId)?.userId.name.split(' ')[0]) : 'Select...'}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block select-none">
                  Amount to Settle (INR)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3 select-none">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-transparent text-xs font-bold text-gray-500 hover:text-white transition-all select-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="settle-form"
                disabled={isLoading || !selectedGroup || !toUserId || !amount}
                className="px-5 py-2.5 bg-[#10b981] hover:bg-[#0ea572] text-[#0a0a0a] font-bold text-xs rounded-lg uppercase tracking-wider transition-all select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {isLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                )}
                <span>{isLoading ? 'Saving...' : 'Record Settlement'}</span>
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
