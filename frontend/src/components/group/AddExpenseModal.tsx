import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import type { Group } from '@/types';
import type { CreateExpensePayload } from '@/services/groupApi';

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
  { value: 'equal', label: 'Equal', desc: 'Divide evenly' },
  { value: 'exact', label: 'Exact', desc: 'Specify amount' },
  { value: 'percentage', label: 'Percent', desc: 'Split by %' },
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

export function AddExpenseModal({
  isOpen,
  onClose,
  group,
  groups = [],
  currentUserId,
  onSubmit,
  isLoading = false,
}: AddExpenseModalProps) {
  const [step, setStep] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(group);

  // Form Fields State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage' | 'shares'>('equal');

  // Custom Splits State
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  // Receipt File upload state (Cloudinary mock)
  const [fileName, setFileName] = useState('');

  const [validationError, setValidationError] = useState('');

  // Sync selected group from props
  useEffect(() => {
    if (group) {
      setSelectedGroup(group);
    } else if (groups.length > 0) {
      setSelectedGroup(groups[0]);
    }
  }, [group, groups]);

  // Reset modal on open/close
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDescription('');
      setAmount('');
      setCategory('');
      setPaidBy(currentUserId);
      setSplitType('equal');
      setCustomSplits({});
      setFileName('');
      setValidationError('');
      if (group) {
        setSelectedGroup(group);
      } else if (groups.length > 0) {
        setSelectedGroup(groups[0]);
      }
    }
  }, [isOpen, group, groups, currentUserId]);

  // Handle selectedGroup changes to update paidBy defaults
  useEffect(() => {
    if (selectedGroup && selectedGroup.members.length > 0) {
      const hasMe = selectedGroup.members.some((m) => m.userId._id === currentUserId);
      setPaidBy(hasMe ? currentUserId : selectedGroup.members[0].userId._id);
    }
  }, [selectedGroup, currentUserId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const validateStep = () => {
    setValidationError('');
    if (step === 1) {
      if (!description.trim()) {
        setValidationError('Description is required');
        return false;
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setValidationError('Enter a valid amount greater than 0');
        return false;
      }
      if (!category) {
        setValidationError('Select a category');
        return false;
      }
      if (!selectedGroup) {
        setValidationError('Select a group');
        return false;
      }
    }
    if (step === 2) {
      if (!paidBy) {
        setValidationError('Select who paid');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setValidationError('');
    setStep((s) => s - 1);
  };

  const handleFormSubmit = async () => {
    if (!selectedGroup) return;

    // Validate splits matching split types
    const members = selectedGroup.members;
    const parsedAmount = parseFloat(amount);
    const splitDetails: { userId: string; amount?: number; percentage?: number; shares?: number }[] = [];

    if (splitType !== 'equal') {
      let totalValue = 0;
      for (const m of members) {
        const valStr = customSplits[m.userId._id] || '0';
        const val = parseFloat(valStr) || 0;
        totalValue += val;

        splitDetails.push({
          userId: m.userId._id,
          amount: splitType === 'exact' ? val : undefined,
          percentage: splitType === 'percentage' ? val : undefined,
          shares: splitType === 'shares' ? val : undefined,
        });
      }

      if (splitType === 'exact' && Math.abs(totalValue - parsedAmount) > 0.05) {
        setValidationError(`Sum of exact splits (${formatCurrency(totalValue)}) must equal total amount (${formatCurrency(parsedAmount)})`);
        return;
      }

      if (splitType === 'percentage' && Math.abs(totalValue - 100) > 0.1) {
        setValidationError(`Total percentage split must equal 100% (currently ${totalValue}%)`);
        return;
      }

      if (splitType === 'shares' && totalValue <= 0) {
        setValidationError('Please assign at least 1 share in total');
        return;
      }
    }

    try {
      setValidationError('');
      await onSubmit({
        groupId: selectedGroup._id,
        paidBy,
        amount: parsedAmount,
        description: description.trim(),
        category,
        splitType,
        splits: splitType !== 'equal' ? splitDetails : undefined,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.response?.data?.message || err.message || 'Failed to add expense');
    }
  };

  const members = selectedGroup?.members || [];

  // Steps transition slide variants
  const slideVariants: Variants = {
    initial: { x: 40, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { x: -40, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Panel - Full screen on mobile, 480px on desktop */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative w-full h-full md:h-auto md:max-w-[480px] bg-[#111] border-0 md:border md:border-white/6 rounded-none md:rounded-2xl shadow-2xl z-10 flex flex-col justify-between overflow-hidden text-left"
          >
            
            {/* 1. Top header and steps indicator */}
            <div className="p-6 border-b border-white/5 space-y-4 select-none shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">Add Expense</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
                    {selectedGroup ? `Adding to ${selectedGroup.name}` : 'New expense details'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Step indicator: 3 dots */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {[1, 2, 3].map((s) => (
                  <span
                    key={s}
                    className={`
                      w-2 h-2 rounded-full transition-all duration-300
                      ${step === s ? 'bg-[#10b981] w-4' : 'bg-white/10'}
                    `}
                  />
                ))}
              </div>
            </div>

            {/* 2. Scrollable Body Content */}
            <div className="flex-1 p-6 overflow-y-auto min-h-[300px]">
              
              {/* Validation alert box */}
              {validationError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-400 mb-4">
                  {validationError}
                </div>
              )}

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* Dashboard mode: group selector */}
                    {!group && groups.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Select Group</label>
                        <select
                          value={selectedGroup?._id || ''}
                          onChange={(e) => {
                            const found = groups.find((g) => g._id === e.target.value);
                            setSelectedGroup(found);
                          }}
                          className="w-full bg-white/[0.04] border border-white/[0.08] text-xs text-white rounded-xl px-4 py-3 cursor-pointer outline-none focus:border-[#10b981]/50 transition-all"
                        >
                          {groups.map((g) => (
                            <option key={g._id} value={g._id} className="bg-[#111]">{g.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Description</label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Dinner at La Paloma"
                      />
                    </div>

                    {/* Amount & Category */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Amount (INR)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/[0.08] text-xs text-white rounded-xl px-4 py-3 cursor-pointer outline-none focus:border-[#10b981]/50 transition-all"
                        >
                          <option value="" className="bg-[#111]">Select...</option>
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value} className="bg-[#111]">{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Receipt upload (Cloudinary mock file button) */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block">Receipt</label>
                      <label className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-dashed border-white/10 hover:border-[#10b981] hover:bg-white/[0.07] rounded-xl text-xs text-gray-400 cursor-pointer transition select-none">
                        <svg className="w-4 h-4 text-[#10b981]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 0l-3.536 3.536m3.536-3.536L15 12M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{fileName ? `Attached: ${fileName}` : 'Upload Receipt'}</span>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-3"
                  >
                    <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block select-none mb-1">
                      Who Paid?
                    </label>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {members.map((m) => {
                        const isSelected = paidBy === m.userId._id;
                        return (
                          <div
                            key={m.userId._id}
                            onClick={() => setPaidBy(m.userId._id)}
                            className={`
                              flex items-center justify-between p-3 border rounded-xl cursor-pointer transition
                              ${isSelected ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]' : 'bg-white/[0.01] border-white/5 text-gray-400 hover:border-white/10'}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar name={m.userId.name} src={m.userId.avatarUrl} size="sm" />
                              <span className="text-xs font-bold text-white">
                                {m.userId.name} {m.userId._id === currentUserId && '(You)'}
                              </span>
                            </div>
                            {isSelected && <span className="text-xs font-extrabold text-[#10b981]">✓ Selected</span>}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* Split selector tabs */}
                    <div className="space-y-1.5 select-none">
                      <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Split Mode</label>
                      <div className="grid grid-cols-4 gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-1 shrink-0">
                        {SPLIT_TYPES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setSplitType(s.value)}
                            className={`
                              py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all select-none cursor-pointer
                              ${splitType === s.value ? 'bg-[#10b981]/15 text-[#10b981]' : 'text-gray-500 hover:text-white'}
                            `}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Member amount inputs list for custom splits */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-gray-500 font-bold select-none mb-1">
                        <span>Group Member</span>
                        <span>
                          {splitType === 'equal' ? 'Share (Equal)' : splitType === 'exact' ? 'Amount (₹)' : splitType === 'percentage' ? 'Percent (%)' : 'Ratio (shares)'}
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {members.map((m) => {
                          const isMe = m.userId._id === currentUserId;
                          
                          // Equal split display
                          if (splitType === 'equal') {
                            const divided = (parseFloat(amount) || 0) / Math.max(members.length, 1);
                            return (
                              <div key={m.userId._id} className="flex items-center justify-between p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
                                <div className="flex items-center gap-2.5">
                                  <Avatar name={m.userId.name} src={m.userId.avatarUrl} size="xs" />
                                  <span className="text-xs text-gray-300 font-semibold">{m.userId.name} {isMe && '(You)'}</span>
                                </div>
                                <span className="text-xs text-white font-bold">{formatCurrency(divided)}</span>
                              </div>
                            );
                          }

                          // Custom splits input
                          return (
                            <div key={m.userId._id} className="flex items-center justify-between gap-4 p-2 bg-white/[0.01] border border-white/5 rounded-xl">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={m.userId.name} src={m.userId.avatarUrl} size="xs" />
                                <span className="text-xs text-gray-300 font-semibold">{m.userId.name} {isMe && '(You)'}</span>
                              </div>
                              <div className="w-24">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={customSplits[m.userId._id] || ''}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCustomSplits((prev) => ({ ...prev, [m.userId._id]: val }));
                                  }}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-right text-white focus:outline-none focus:border-[#10b981] transition-all"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Footer actions bar */}
            <div className="p-6 border-t border-white/5 flex items-center justify-between shrink-0">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 border border-white/6 hover:border-white/10 text-xs font-bold rounded-lg uppercase tracking-wider text-white bg-transparent transition-all select-none cursor-pointer"
                  >
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-transparent text-xs font-bold text-gray-500 hover:text-white transition-all select-none cursor-pointer"
                >
                  Cancel
                </button>
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-[#10b981] hover:bg-[#0ea572] text-[#0a0a0a] font-bold text-xs rounded-lg uppercase tracking-wider transition-all select-none cursor-pointer"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFormSubmit}
                    disabled={isLoading || !selectedGroup}
                    className="px-5 py-2.5 bg-[#10b981] hover:bg-[#0ea572] text-[#0a0a0a] font-bold text-xs rounded-lg uppercase tracking-wider transition-all select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                  >
                    {isLoading && (
                      <span className="w-3.5 h-3.5 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                    )}
                    <span>{isLoading ? 'Saving...' : 'Add Expense'}</span>
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
