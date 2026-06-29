import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  isLoading?: boolean;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setError('');
      await onSubmit(name.trim());
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create group');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Group"
      subtitle="Start a new shared expense space"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost border border-surface-border">
            Cancel
          </button>
          <button
            type="submit"
            form="create-group-form"
            disabled={isLoading || !name.trim()}
            className="btn-primary min-w-[100px]"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </>
      }
    >
      <form id="create-group-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger animate-fade-in">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground-muted">Group Name</label>
          <input
            type="text"
            placeholder="e.g. Barcelona Trip, Housemates"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
}
