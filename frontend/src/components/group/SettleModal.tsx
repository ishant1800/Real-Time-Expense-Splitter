import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToastStore } from '@/store/useToastStore';
import { balanceApi } from '@/services/groupApi';
import { useQueryClient } from '@tanstack/react-query';
import { groupKeys } from '@/hooks/useGroupQueries';
import type { Group } from '@/types';
import { cn } from '@/lib/utils';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: Group;
  groups?: Group[];
  currentUserId: string;
  onSuccess?: () => void;
}

const inputCls = 'w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all';
const selectCls = `${inputCls} cursor-pointer appearance-none`;

export function SettleModal({
  isOpen,
  onClose,
  group: initialGroup,
  groups = [],
  currentUserId,
  onSuccess,
}: SettleModalProps) {
  const queryClient = useQueryClient();
  const toast = useToastStore();

  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(initialGroup);
  const [targetUserId, setTargetUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync state if initialGroup changes (e.g. from undefined on Dashboard to defined on Group Detail)
  useEffect(() => {
    setSelectedGroup(initialGroup);
  }, [initialGroup]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setAmount('');
      setTargetUserId('');
      if (initialGroup) {
        setSelectedGroup(initialGroup);
      } else if (groups.length > 0) {
        setSelectedGroup(groups[0]);
      }
    }
  }, [isOpen, initialGroup, groups]);

  // Handle selected group change on Dashboard
  const handleGroupChange = (groupId: string) => {
    const found = groups.find((g) => g._id === groupId);
    setSelectedGroup(found);
    setTargetUserId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) {
      setError('Please select a group');
      return;
    }
    if (!targetUserId) {
      setError('Please select a member to pay');
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
        from: currentUserId,
        to: targetUserId,
        amount: parsedAmount,
      });

      // Invalidate queries to refresh lists and dashboard
      queryClient.invalidateQueries({ queryKey: groupKeys.balances(selectedGroup._id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.settlements(selectedGroup._id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });

      toast.success('Settled up successfully');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to record settlement';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const otherMembers = selectedGroup?.members.filter((m) => m.userId._id !== currentUserId) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settle Up"
      subtitle={selectedGroup ? `Record payment in ${selectedGroup.name}` : 'Record a payment to a member'}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost border border-surface-border">
            Cancel
          </button>
          <button
            type="submit"
            form="settle-form"
            disabled={isLoading || !selectedGroup || !targetUserId || !amount}
            className={cn(
              'btn-primary min-w-[110px] flex items-center justify-center gap-2',
              (isLoading || !selectedGroup || !targetUserId || !amount) && 'opacity-60 cursor-not-allowed',
            )}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {isLoading ? 'Saving...' : 'Record Settlement'}
          </button>
        </>
      }
    >
      <form id="settle-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger animate-fade-in">
            {error}
          </div>
        )}

        {/* Group Selector (Dashboard mode) */}
        {!initialGroup && groups.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground-muted">Select Group</label>
            <div className="relative">
              <select
                value={selectedGroup?._id || ''}
                onChange={(e) => handleGroupChange(e.target.value)}
                className={selectCls}
              >
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-foreground-subtle">
                ▼
              </div>
            </div>
          </div>
        )}

        {/* Target Member Selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground-muted">Pay To</label>
          <div className="relative">
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className={selectCls}
              disabled={otherMembers.length === 0}
            >
              <option value="">Select a member...</option>
              {otherMembers.map((m) => (
                <option key={m.userId._id} value={m.userId._id}>
                  {m.userId.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-foreground-subtle">
              ▼
            </div>
          </div>
          {otherMembers.length === 0 && selectedGroup && (
            <p className="text-xs text-danger">No other members in this group to pay.</p>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground-muted">Amount (INR)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputCls}
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
}
