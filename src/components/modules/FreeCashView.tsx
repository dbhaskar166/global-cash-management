import React, { useState } from 'react';
import {
  PiggyBank,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { calculateFreeCash, convertFx } from '../../services/financialMath';
import { FreeCashAnalysis } from '../../types/treasury';

export const FreeCashView: React.FC = () => {
  const {
    bankAccounts,
    entities,
    fxRates,
    selectedCurrency,
    createRealignment,
  } = useTreasury();

  const [notification, setNotification] = useState<string | null>(null);

  const toBase = (amount: number, ccy: string) => {
    return convertFx(amount, ccy as any, selectedCurrency, fxRates).convertedAmount;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Derive Free Cash Breakdown across entities
  const analyses: FreeCashAnalysis[] = entities.map((ent) => {
    const entAccounts = bankAccounts.filter((a) => a.entityId === ent.id);
    const avail = entAccounts.reduce((s, a) => s + toBase(a.availableBalance, a.currency), 0);
    const restricted = entAccounts.reduce((s, a) => s + toBase(a.restrictedBalance, a.currency), 0);
    const minOperational = toBase(entAccounts.reduce((s, a) => s + a.minimumBalance, 0), ent.baseCurrency);
    const reserves = toBase(1000000, 'USD');

    const free = calculateFreeCash(avail, minOperational, restricted, reserves);

    // Identify trapped cash (e.g. India INR, UAE AED, or Brazil has currency controls)
    const isTrappedJurisdiction = ent.countryCode === 'IN' || ent.countryCode === 'AE';
    const trapped = isTrappedJurisdiction ? Math.max(0, free * 0.45) : 0;
    const investable = Math.max(0, free - trapped);
    const idle = Math.max(0, investable * 0.3);

    let recommendedAction = 'Maintain baseline liquidity buffers';
    if (investable > 5000000) {
      recommendedAction = `Sweep ${formatCurrency(investable * 0.8)} to Overnight Money Market Fund`;
    } else if (free < 0) {
      recommendedAction = 'Initiate Intercompany Funding injection from Regional Hub';
    }

    return {
      entityId: ent.id,
      entityName: ent.name,
      currency: ent.baseCurrency,
      eligibleAvailableCash: avail,
      minimumOperationalCash: minOperational,
      restrictedCash: restricted,
      requiredFundingReserves: reserves,
      freeCash: free,
      idleCash: idle,
      trappedCash: trapped,
      investableCash: investable,
      recommendedAction,
    };
  });

  const totalGlobalFreeCash = analyses.reduce((s, a) => s + a.freeCash, 0);
  const totalGlobalInvestable = analyses.reduce((s, a) => s + a.investableCash, 0);
  const totalGlobalIdle = analyses.reduce((s, a) => s + a.idleCash, 0);
  const totalGlobalTrapped = analyses.reduce((s, a) => s + a.trappedCash, 0);

  const handleExecuteOptimization = (analysis: FreeCashAnalysis) => {
    // Generate automated realignment proposal
    const sourceAcc = bankAccounts.find((a) => a.entityId === analysis.entityId && a.availableBalance > 1000000);
    const masterAcc = bankAccounts.find((a) => a.accountType === 'INVESTMENT' || a.accountType === 'POOL') || bankAccounts[0];

    if (sourceAcc && masterAcc) {
      const sweepAmount = Math.min(sourceAcc.availableBalance * 0.5, 5000000);
      createRealignment({
        sourceAccountId: sourceAcc.id,
        destinationAccountId: masterAcc.id,
        amount: Math.round(sweepAmount),
        realignmentType: 'SURPLUS_REALIGNMENT',
        priority: 'MEDIUM',
        reason: `Automated yield optimization sweep: ${analysis.recommendedAction}`,
      });
      setNotification(`Liquidity sweep proposal generated for ${analysis.entityName}: ${formatCurrency(sweepAmount)}.`);
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification('No eligible operating surplus account found for this entity.');
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Free Cash Management & Yield Optimization
          </h1>
          <p className="text-xs text-slate-500">
            Differentiate trapped, idle, and investable liquidity after operational reserves and minimum regulatory requirements
          </p>
        </div>

        <div className="rounded-md bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-mono font-bold text-teal-900">
          Formula: Eligible Avail - Min Operational - Restricted - Required Reserves
        </div>
      </div>

      {notification && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Global Consolidated Free Cash</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{formatCurrency(totalGlobalFreeCash)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Unencumbered Operational Capital</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Investable Liquidity (AAA MMF)</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{formatCurrency(totalGlobalInvestable)}</p>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Yielding 4.85% to 5.05%</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Idle Cash (Yield Drag)</p>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1">{formatCurrency(totalGlobalIdle)}</p>
          <p className="text-[11px] text-amber-600 mt-1">Opportunity Loss: ~4.9% annualized</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trapped / Regulatory Restricted</p>
          <p className="text-2xl font-bold font-mono text-rose-700 mt-1">{formatCurrency(totalGlobalTrapped)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Cross-Border Capital Controls</p>
        </div>
      </div>

      {/* Entity Free Cash Analysis Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Entity-by-Entity Free Cash & Recommendation Matrix
          </h2>
          <span className="text-xs text-slate-500 font-mono">Normalized to {selectedCurrency}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Legal Entity</th>
                <th className="px-4 py-3 text-right">Available Cash</th>
                <th className="px-4 py-3 text-right text-slate-500">Operational Reserves</th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">Calculated Free Cash</th>
                <th className="px-4 py-3 text-right text-emerald-700">Investable</th>
                <th className="px-4 py-3 text-right text-rose-700">Trapped</th>
                <th className="px-4 py-3">Recommended Optimization</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {analyses.map((a) => (
                <tr key={a.entityId} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-sans font-bold text-slate-900">{a.entityName}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(a.eligibleAvailableCash)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {formatCurrency(a.minimumOperationalCash + a.restrictedCash)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(a.freeCash)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(a.investableCash)}</td>
                  <td className="px-4 py-3 text-right text-rose-700">
                    {a.trappedCash > 0 ? formatCurrency(a.trappedCash) : '-'}
                  </td>
                  <td className="px-4 py-3 font-sans text-slate-600 max-w-[220px] truncate" title={a.recommendedAction}>
                    {a.recommendedAction}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.investableCash > 2000000 && (
                      <button
                        onClick={() => handleExecuteOptimization(a)}
                        className="px-2.5 py-1 bg-navy-900 text-white font-sans text-[11px] font-semibold rounded hover:bg-navy-800 transition"
                      >
                        Sweep & Invest
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
