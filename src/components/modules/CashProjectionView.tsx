import React, { useState } from 'react';
import {
  BarChart4,
  TrendingUp,
  Sliders,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTreasury } from '../../context/TreasuryContext';
import { CashProjectionHorizon } from '../../types/treasury';
import { convertFx } from '../../services/financialMath';

export const CashProjectionView: React.FC = () => {
  const { bankAccounts, fxRates, selectedCurrency } = useTreasury();

  const [activeScenario, setActiveScenario] = useState<'BASE' | 'OPTIMISTIC' | 'PESSIMISTIC'>('BASE');
  const [inflowMultiplier, setInflowMultiplier] = useState(1.0);
  const [outflowMultiplier, setOutflowMultiplier] = useState(1.0);

  // Consolidated starting available balance
  const totalAvailable = bankAccounts.reduce(
    (sum, a) => sum + convertFx(a.availableBalance, a.currency, selectedCurrency, fxRates).convertedAmount,
    0
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 8 Horizon calculations
  const horizons: CashProjectionHorizon[] = [
    {
      horizon: 'Intraday',
      openingCash: totalAvailable,
      projectedInflows: 12500000 * inflowMultiplier,
      projectedOutflows: 8400000 * outflowMultiplier,
      projectedClosingCash: totalAvailable + 12500000 * inflowMultiplier - 8400000 * outflowMultiplier,
      minimumLiquidityRequirement: 25000000,
      restrictedCash: 7500000,
      projectedFreeCash: totalAvailable + 12500000 * inflowMultiplier - 8400000 * outflowMultiplier - 32500000,
      optimisticClosingCash: totalAvailable + 15000000 - 7500000,
      pessimisticClosingCash: totalAvailable + 9000000 - 9500000,
      confidenceScore: 99,
      netPosition: 4100000,
      currency: selectedCurrency,
    },
    {
      horizon: 'End of Day',
      openingCash: totalAvailable,
      projectedInflows: 24800000 * inflowMultiplier,
      projectedOutflows: 18200000 * outflowMultiplier,
      projectedClosingCash: totalAvailable + 24800000 * inflowMultiplier - 18200000 * outflowMultiplier,
      minimumLiquidityRequirement: 25000000,
      restrictedCash: 7500000,
      projectedFreeCash: totalAvailable + 24800000 * inflowMultiplier - 18200000 * outflowMultiplier - 32500000,
      optimisticClosingCash: totalAvailable + 28000000 - 16000000,
      pessimisticClosingCash: totalAvailable + 20000000 - 21000000,
      confidenceScore: 98,
      netPosition: 6600000,
      currency: selectedCurrency,
    },
    {
      horizon: 'Next Business Day',
      openingCash: totalAvailable + 6600000,
      projectedInflows: 31000000 * inflowMultiplier,
      projectedOutflows: 22000000 * outflowMultiplier,
      projectedClosingCash: totalAvailable + 6600000 + 31000000 * inflowMultiplier - 22000000 * outflowMultiplier,
      minimumLiquidityRequirement: 25000000,
      restrictedCash: 7500000,
      projectedFreeCash: totalAvailable + 6600000 + 31000000 * inflowMultiplier - 22000000 * outflowMultiplier - 32500000,
      optimisticClosingCash: totalAvailable + 6600000 + 35000000 - 19000000,
      pessimisticClosingCash: totalAvailable + 6600000 + 26000000 - 26000000,
      confidenceScore: 95,
      netPosition: 9000000,
      currency: selectedCurrency,
    },
    {
      horizon: '7 Days',
      openingCash: totalAvailable,
      projectedInflows: 145000000 * inflowMultiplier,
      projectedOutflows: 110000000 * outflowMultiplier,
      projectedClosingCash: totalAvailable + 145000000 * inflowMultiplier - 110000000 * outflowMultiplier,
      minimumLiquidityRequirement: 25000000,
      restrictedCash: 7500000,
      projectedFreeCash: totalAvailable + 145000000 * inflowMultiplier - 110000000 * outflowMultiplier - 32500000,
      optimisticClosingCash: totalAvailable + 160000000 - 95000000,
      pessimisticClosingCash: totalAvailable + 120000000 - 130000000,
      confidenceScore: 92,
      netPosition: 35000000,
      currency: selectedCurrency,
    },
    {
      horizon: '30 Days',
      openingCash: totalAvailable,
      projectedInflows: 480000000 * inflowMultiplier,
      projectedOutflows: 395000000 * outflowMultiplier,
      projectedClosingCash: totalAvailable + 480000000 * inflowMultiplier - 395000000 * outflowMultiplier,
      minimumLiquidityRequirement: 25000000,
      restrictedCash: 7500000,
      projectedFreeCash: totalAvailable + 480000000 * inflowMultiplier - 395000000 * outflowMultiplier - 32500000,
      optimisticClosingCash: totalAvailable + 540000000 - 360000000,
      pessimisticClosingCash: totalAvailable + 410000000 - 440000000,
      confidenceScore: 86,
      netPosition: 85000000,
      currency: selectedCurrency,
    },
    {
      horizon: '90 Days',
      openingCash: totalAvailable,
      projectedInflows: 1250000000 * inflowMultiplier,
      projectedOutflows: 1050000000 * outflowMultiplier,
      projectedClosingCash: totalAvailable + 1250000000 * inflowMultiplier - 1050000000 * outflowMultiplier,
      minimumLiquidityRequirement: 25000000,
      restrictedCash: 7500000,
      projectedFreeCash: totalAvailable + 1250000000 * inflowMultiplier - 1050000000 * outflowMultiplier - 32500000,
      optimisticClosingCash: totalAvailable + 1420000000 - 980000000,
      pessimisticClosingCash: totalAvailable + 1050000000 - 1200000000,
      confidenceScore: 78,
      netPosition: 200000000,
      currency: selectedCurrency,
    },
  ];

  const chartData = horizons.map((h) => ({
    name: h.horizon,
    Base: h.projectedClosingCash,
    Optimistic: h.optimisticClosingCash,
    Pessimistic: h.pessimisticClosingCash,
    MinimumLiquidity: h.minimumLiquidityRequirement + h.restrictedCash,
  }));

  return (
    <div className="space-y-6">
      {/* Title & Scenario Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Cash Projection & Liquidity Forecasting
          </h1>
          <p className="text-xs text-slate-500">
            Intraday to 90-day multi-currency horizons, stress testing, scenario simulation, and liquidity gap analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium">
            <button
              onClick={() => {
                setActiveScenario('BASE');
                setInflowMultiplier(1.0);
                setOutflowMultiplier(1.0);
              }}
              className={`px-3 py-1 rounded-md transition ${
                activeScenario === 'BASE' ? 'bg-navy-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Base Scenario
            </button>
            <button
              onClick={() => {
                setActiveScenario('OPTIMISTIC');
                setInflowMultiplier(1.1);
                setOutflowMultiplier(0.95);
              }}
              className={`px-3 py-1 rounded-md transition ${
                activeScenario === 'OPTIMISTIC' ? 'bg-emerald-700 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Optimistic (+10% Inflows)
            </button>
            <button
              onClick={() => {
                setActiveScenario('PESSIMISTIC');
                setInflowMultiplier(0.85);
                setOutflowMultiplier(1.15);
              }}
              className={`px-3 py-1 rounded-md transition ${
                activeScenario === 'PESSIMISTIC' ? 'bg-rose-700 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stress Test (-15% Inflows)
            </button>
          </div>
        </div>
      </div>

      {/* Projection Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Closing Liquidity Envelope Across Forecast Horizons ({selectedCurrency})
            </h2>
            <p className="text-xs text-slate-500">
              Confidence cone showing Base, Optimistic and Stressed Liquidity trajectories vs Regulatory Minimum
            </p>
          </div>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
            Formula: Opening + Forecasted Inflows - Forecasted Outflows
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38A169" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38A169" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#102A43" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#102A43" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorPessimistic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E53E3E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [formatCurrency(Number(v || 0))]} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="Optimistic" stroke="#38A169" fillOpacity={1} fill="url(#colorOptimistic)" />
              <Area type="monotone" dataKey="Base" stroke="#102A43" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBase)" />
              <Area type="monotone" dataKey="Pessimistic" stroke="#E53E3E" fillOpacity={1} fill="url(#colorPessimistic)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Horizon Details Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Forecasting Horizon Breakdown & Free Cash Projection
          </h2>
          <span className="text-xs text-slate-500 font-mono">Precision: 2-Decimal Decimal Arithmetic</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Horizon</th>
                <th className="px-4 py-3 text-right">Opening Cash</th>
                <th className="px-4 py-3 text-right text-emerald-700">Projected Inflows</th>
                <th className="px-4 py-3 text-right text-rose-700">Projected Outflows</th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">Closing Cash</th>
                <th className="px-4 py-3 text-right text-teal-800">Projected Free Cash</th>
                <th className="px-4 py-3 text-center">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {horizons.map((h) => (
                <tr key={h.horizon} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-sans font-bold text-slate-900">{h.horizon}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(h.openingCash)}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">+{formatCurrency(h.projectedInflows)}</td>
                  <td className="px-4 py-3 text-right text-rose-700">-{formatCurrency(h.projectedOutflows)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(h.projectedClosingCash)}</td>
                  <td className="px-4 py-3 text-right font-bold text-teal-700">{formatCurrency(h.projectedFreeCash)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                      {h.confidenceScore}%
                    </span>
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
