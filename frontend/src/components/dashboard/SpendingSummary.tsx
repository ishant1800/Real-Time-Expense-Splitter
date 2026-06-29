import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import type { SpendingCategory } from '@/types';

interface SpendingSummaryProps {
  categories: SpendingCategory[];
  totalSpending: number;
}

export function SpendingSummary({ categories, totalSpending }: SpendingSummaryProps) {
  return (
    <div className="bg-[#111] border border-white/6 rounded-xl p-6 text-left space-y-5">
      {/* Header */}
      <div className="pb-2">
        <h2 className="font-heading text-lg font-bold text-white">This Month</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
          spending breakdown
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-xs">
          No spending registered this month.
        </div>
      ) : (
        <>
          {/* Stacked top bar layout using category colors */}
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 mb-6 select-none bg-white/5">
            {categories.map((cat) => (
              <div
                key={cat.category}
                className="transition-all duration-700 h-full"
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.color,
                }}
                title={`${cat.category}: ${cat.percentage}%`}
              />
            ))}
          </div>

          {/* List layout */}
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-gray-300 font-semibold">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-bold">{cat.percentage}%</span>
                    <span className="text-xs font-bold text-white w-20 text-right">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                </div>

                {/* Animated Emerald Progress Bar */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-[#10b981] rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total spent summary */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold">Total Spending</span>
            <span className="text-sm font-bold text-[#10b981]">{formatCurrency(totalSpending)}</span>
          </div>
        </>
      )}
    </div>
  );
}
