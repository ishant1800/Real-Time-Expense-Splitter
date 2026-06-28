import { useState } from 'react';
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
  { value: 'food', label: '🍔 Food', },
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
  group: Group;
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
  currentUserId,
  onSubmit,
  isLoading = false,
}: AddExpenseModalProps) {
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      splitType: 'equal',
      paidBy: currentUserId,
    },
  });

  const handleClose = () => {
    reset();
    setServerError('');
    onClose();
  };

  const onFormSubmit = async (data: ExpenseFormData) => {
    try {
      setServerError('');
      await onSubmit({
        groupId: group._id,
        paidBy: data.paidBy,
        amount: parseFloat(data.amount),
        description: data.description,
        category: data.category,
        splitType: data.splitType,
        // For equal split, no extra splits array needed — backend handles it
      });
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setServerError(msg);
    }
  };

  const splitType = watch('splitType');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Expense"
      subtitle={`Adding to ${group.name}`}
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
            disabled={isLoading}
            className={cn(
              'btn-primary min-w-[110px] flex items-center justify-center gap-2',
              isLoading && 'opacity-60 cursor-not-allowed',
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
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
            {serverError}
          </div>
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
          <Field label="Amount (USD)" error={errors.amount?.message}>
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
          </Field>
        </div>

        {/* Paid By */}
        <Field label="Paid By" error={errors.paidBy?.message}>
          <select {...register('paidBy')} id="expense-paid-by" className={selectCls}>
            {group.members.map(m => (
              <option key={m.userId._id} value={m.userId._id}>
                {m.userId.name}{m.userId._id === currentUserId ? ' (You)' : ''}
              </option>
            ))}
          </select>
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
        {splitType === 'equal' && (
          <p className="text-xs text-foreground-subtle bg-surface-elevated border border-surface-border rounded-xl p-3">
            💡 Amount will be divided equally among all {group.members.length} members.
          </p>
        )}
        {splitType !== 'equal' && (
          <p className="text-xs text-foreground-subtle bg-surface-elevated border border-surface-border rounded-xl p-3">
            ⚠️ Custom split amounts can be adjusted after creation from the expense detail view.
          </p>
        )}
      </form>
    </Modal>
  );
}
