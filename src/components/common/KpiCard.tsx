import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { CurrencyCode } from '../../types/treasury';

interface KpiCardProps {
  title: string;
  amount: number;
  currency: CurrencyCode;
  changePercent?: number;
  previousAmount?: number;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  onClick?: () => void;
  accentColor?: 'navy' | 'teal' | 'amber' | 'emerald' | 'rose' | 'indigo';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  amount,
  currency,
  changePercent,
  previousAmount,
  trend,
  subtitle,
  onClick,
}) => {
  const fullAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);

  // Compact display for large millions
  const compactAmount = () => {
    if (Math.abs(amount) >= 1000000) {
      const millions = amount / 1000000;
      const formatted = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 1,
      }).format(millions);
      // Get currency symbol
      const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
      return `${symbol}${formatted}M`;
    }
    return fullAmount;
  };

  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      title={`${title}: ${fullAmount}`}
      className={`relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 ${
        isClickable
          ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate" title={title}>
          {title}
        </p>
        {changePercent !== undefined && (
          <div
            className={`inline-flex items-center gap-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 shrink-0 ${
              changePercent > 0
                ? 'bg-emerald-50 text-emerald-700'
                : changePercent < 0
                ? 'bg-rose-50 text-rose-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {changePercent > 0 ? (
              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
            ) : changePercent < 0 ? (
              <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>{Math.abs(changePercent)}%</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
          {compactAmount()}
        </h3>
        {Math.abs(amount) >= 1000000 && (
          <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
            ({fullAmount})
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
        <span className="truncate">{subtitle || 'vs previous business day'}</span>
      </div>
    </div>
  );
};
