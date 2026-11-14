import React, { useState } from 'react';
import {
  Droplets,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Play,
  Settings,
  Scale,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { StatusBadge } from '../common/StatusBadge';
import { LiquidityPool } from '../../types/treasury';

export const LiquidityManagementView: React.FC = () => {
  const { liquidityPools, bankAccounts, createRealignment } = useTreasury();

  const [notification, setNotification] = useState<string | null>(null);

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleTriggerSweep = (pool: LiquidityPool) => {
    const masterAcc = bankAccounts.find((a) => a.id === pool.masterAccountId);
    if (!masterAcc) return;

    setNotification(`End-of-day cash sweep triggered for "${pool.name}". Subordinate participant accounts leveled to target.`);
    setTimeout(() => setNotification(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Global Liquidity Management & Cash Pooling
          </h1>
          <p className="text-xs text-slate-500">
            Automated Zero Balance Accounts (ZBA), target balancing headers, notional interest netting, and cross-border physical sweeps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 bg-slate-100 rounded-md text-slate-700 font-semibold">
            {liquidityPools.length} Configured Global Liquidity Pools
          </span>
        </div>
      </div>

      {notification && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Liquidity Structure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {liquidityPools.map((pool) => {
          const masterAcc = bankAccounts.find((a) => a.id === pool.masterAccountId);
          return (
            <div key={pool.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    {pool.type.replace(/_/g, ' ')}
                  </span>
                  <StatusBadge status={pool.status} size="sm" />
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{pool.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Frequency: {pool.sweepFrequency} • Cross-Border: {pool.crossBorder ? 'Yes (Multi-Tax)' : 'Domestic'}
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Master Concentration Header:</span>
                    <span className="font-bold text-slate-900">{masterAcc?.currency || pool.currency}</span>
                  </div>
                  <p className="text-[11px] font-sans font-medium text-slate-800 truncate">
                    {masterAcc?.accountName}
                  </p>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                    <span>Concentrated Pool Balance:</span>
                    <span className="text-teal-900">{formatCurrency(pool.totalPoolBalance, pool.currency)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subordinate Sweep Accounts ({pool.participantAccountIds.length})
                  </p>
                  <div className="space-y-1 text-xs">
                    {pool.participantAccountIds.map((accId) => {
                      const acc = bankAccounts.find((a) => a.id === accId);
                      return (
                        <div key={accId} className="flex justify-between items-center p-1.5 rounded bg-slate-50/70 border border-slate-100 font-mono text-[11px]">
                          <span className="truncate max-w-[170px] text-slate-700 font-sans">{acc?.accountName}</span>
                          <span className="font-bold text-slate-900">{formatCurrency(acc?.bookBalance || 0, acc?.currency || pool.currency)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleTriggerSweep(pool)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-teal-300" />
                  <span>Execute Intraday Sweep & Balancing</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
