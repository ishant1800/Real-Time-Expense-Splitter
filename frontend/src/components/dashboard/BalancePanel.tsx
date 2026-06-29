import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';
import type { NetBalance } from '@/types';

interface BalancePanelProps {
  balances: NetBalance[];
  onSettle?: () => void;
}

export function BalancePanel({ balances, onSettle }: BalancePanelProps) {
  return (
    <div className="bg-[#111] border border-white/6 rounded-xl p-6 text-left space-y-5">
      {/* Header */}
      <div className="pb-2">
        <h2 className="font-heading text-lg font-bold text-white">Net Balances</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
          outstanding balances across all groups
        </p>
      </div>

      {balances.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-xs">
          🎉 All settled up! No outstanding balances.
        </div>
      ) : (
        <div className="space-y-3.5">
          {balances.map((b) => {
            const isPositive = b.balance > 0;

            return (
              <div
                key={b.userId}
                className="flex items-center justify-between gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                {/* Avatar and name */}
                <div className="flex items-center gap-3">
                  <Avatar name={b.name} src={b.avatarUrl} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-white leading-snug">{b.name}</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                      {isPositive ? 'Owes you' : 'You owe'}
                    </p>
                  </div>
                </div>

                {/* Amount and Settle actions */}
                <div className="text-right space-y-1">
                  <p className={`text-sm font-extrabold leading-none ${isPositive ? 'text-[#10b981]' : 'text-rose-500'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(b.balance)}
                  </p>
                  {onSettle && (
                    <button
                      onClick={onSettle}
                      className="text-[9px] uppercase tracking-wider font-bold text-[#10b981] hover:text-[#0ea572] transition"
                    >
                      Settle →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
