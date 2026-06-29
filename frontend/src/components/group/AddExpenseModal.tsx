import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { Group } from '@/types';
import type { CreateExpensePayload } from '@/services/groupApi';

// ─── Zod validation schema ────────────────────────────────────────────────────
const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'Amount must be a positive number' },
  ),
  category: z.string().min(1, 'Pick a category'),
  splitType: z.enum(['equal', 'exact', 'percentage', 'shares']),
  paidBy: z.string().min(1, 'Select who paid'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const CATEGORIES = [
  { value: 'food', label: '🍔 Food' },
  { value: 'transport', label: '🚗 Transport' },
  { value: 'entertainment', label: '🎬 Entertainment' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'utilities', label: '💡 Utilities' },
  { value: 'rent', label: '🏠 Rent' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'health', label: '🏥 Health' },
  { value: 'other', label: '💰 Other' },
];

const SPLIT_TYPES = [
  { value: 'equal', label: 'Equal Split', desc: 'Divide evenly' },
  { value: 'exact', label: 'Exact Amounts', desc: 'Specify each share' },
  { value: 'percentage', label: 'Percentage', desc: 'Split by %' },
  { value: 'shares', label: 'Shares', desc: 'Split by ratio' },
] as const;

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: Group;
  groups?: Group[];
  currentUserId: string;
  onSubmit: (payload: CreateExpensePayload) => Promise<void>;
  isLoading?: boolean;
}

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground-muted">{label}</label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all';
const selectCls = `${inputCls} cursor-pointer appearance-none`;

export function AddExpenseModal({
  isOpen,
  onClose,
  group,
  groups = [],
  currentUserId,
  onSubmit,
  isLoading = false,
}: AddExpenseModalProps) {
  const [serverError, setServerError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(group);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      splitType: 'equal',
      paidBy: currentUserId,
    },
  });

  useEffect(() => {
    setSelectedGroup(group);
  }, [group]);

  useEffect(() => {
    if (isOpen) {
      setServerError('');
      reset({
        splitType: 'equal',
        paidBy: currentUserId,
      });

      if (group) {
        setSelectedGroup(group);
      } else if (groups.length > 0) {
        setSelectedGroup(groups[0]);
      }
    }
  }, [isOpen, group, groups, currentUserId, reset]);

  // Update paidBy default value when selectedGroup changes
  useEffect(() => {
    if (selectedGroup && selectedGroup.members.length > 0) {
      const hasCurrentUser = selectedGroup.members.some(m => m.userId._id === currentUserId);
      setValue('paidBy', hasCurrentUser ? currentUserId : selectedGroup.members[0].userId._id);
    }
  }, [selectedGroup, currentUserId, setValue]);

  const handleClose = () => {
    reset();
    setServerError('');
    onClose();
  };

  const onFormSubmit = async (data: ExpenseFormData) => {
    if (!selectedGroup) {
      setServerError('Please select a group');
      return;
    }

    try {
      setServerError('');
      await onSubmit({
        groupId: selectedGroup._id,
        paidBy: data.paidBy,
        amount: parseFloat(data.amount),
        description: data.description,
        category: data.category,
        splitType: data.splitType,
      });
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      setServerError(msg);
    }
  };

  const splitType = watch('splitType');
  const members = selectedGroup?.members || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Expense"
      subtitle={selectedGroup ? `Adding to ${selectedGroup.name}` : 'Add a new expense'}
      size="md"
      footer={
        <>
          <button type="button" onClick={handleClose} className="btn-ghost border border-surface-border">
            Cancel
          </button>
          <button
            id="submit-expense-btn"
            form="add-expense-form"
            type="submit"
            disabled={isLoading || !selectedGroup}
            className={cn(
              'btn-primary min-w-[110px] flex items-center justify-center gap-2',
              (isLoading || !selectedGroup) && 'opacity-60 cursor-not-allowed',
            )}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {isLoading ? 'Saving…' : 'Add Expense'}
          </button>
        </>
      }
    >
      <form id="add-expense-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger animate-fade-in">
            {serverError}
          </div>
        )}

        {/* Group Selector (Dashboard mode) */}
        {!group && groups.length > 0 && (
          <Field label="Select Group">
            <div className="relative">
              <select
                value={selectedGroup?._id || ''}
                onChange={(e) => {
                  const found = groups.find(g => g._id === e.target.value);
                  setSelectedGroup(found);
                }}
                className={selectCls}
              >
                {groups.map(g => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-foreground-subtle">
                ▼
              </div>
            </div>
          </Field>
        )}

        {/* Description */}
        <Field label="Description" error={errors.description?.message}>
          <input
            {...register('description')}
            id="expense-description"
            placeholder="e.g. Dinner at La Paloma"
            className={cn(inputCls, errors.description && 'border-danger/50') as string}
          />
        </Field>

        {/* Amount + Category row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (INR)" error={errors.amount?.message}>
            <input
              {...register('amount')}
              id="expense-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className={cn(inputCls, errors.amount && 'border-danger/50')}
            />
          </Field>

          <Field label="Category" error={errors.category?.message}>
            <div className="relative">
              <select
                {...register('category')}
                id="expense-category"
                className={selectCls}
              >
                <option value="">Select…</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-foreground-subtle">
                ▼
              </div>
            </div>
          </Field>
        </div>

        {/* Paid By */}
        <Field label="Paid By" error={errors.paidBy?.message}>
          <div className="relative">
            <select {...register('paidBy')} id="expense-paid-by" className={selectCls} disabled={members.length === 0}>
              {members.map(m => (
                <option key={m.userId._id} value={m.userId._id}>
                  {m.userId.name}{m.userId._id === currentUserId ? ' (You)' : ''}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-foreground-subtle">
              ▼
            </div>
          </div>
          {members.length === 0 && selectedGroup && (
            <p className="text-xs text-danger">No members in selected group.</p>
          )}
        </Field>

        {/* Split Type */}
        <Field label="Split Type" error={errors.splitType?.message}>
          <div className="grid grid-cols-2 gap-2">
            {SPLIT_TYPES.map(s => (
              <label
                key={s.value}
                className={cn(
                  'flex flex-col gap-0.5 p-3 rounded-xl border cursor-pointer transition-all',
                  splitType === s.value
                    ? 'border-accent/50 bg-accent/10 text-accent-light'
                    : 'border-surface-border hover:border-surface-border/80 text-foreground-muted',
                )}
              >
                <input
                  type="radio"
                  value={s.value}
                  {...register('splitType')}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-xs opacity-70">{s.desc}</span>
              </label>
            ))}
          </div>
        </Field>

        {/* Equal split note */}
        {splitType === 'equal' && selectedGroup && (
          <p className="text-xs text-foreground-subtle bg-surface-elevated border border-surface-border rounded-xl p-3">
            💡 Amount will be divided equally among all {members.length} members.
          </p>
        )}
        {splitType !== 'equal' && selectedGroup && (
          <p className="text-xs text-foreground-subtle bg-surface-elevated border border-surface-border rounded-xl p-3">
            ⚠️ Custom split amounts can be adjusted after creation from the expense detail view.
          </p>
        )}
      </form>
    </Modal>
  );
}
