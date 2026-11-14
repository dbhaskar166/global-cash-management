import React, { useState, useMemo } from 'react';
import { useTreasury } from '../../context/TreasuryContext';
import {
  TradeProjection,
  TradeInstrumentType,
  CurrencyCode,
} from '../../types/treasury';
import {
  TrendingUp,
  Ship,
  Shield,
  Calendar,
  AlertCircle,
  Plus,
  Filter,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Building2,
  FileCheck2,
} from 'lucide-react';

export const TradeCashFlowProjectionView: React.FC = () => {
  const {
    tradeProjections,
    addTradeProjection,
    cashFlows,
    bankAccounts,
    selectedCurrency,
    selectedEntityId,
  } = useTreasury();

  // Filters & Toggles
  const [instrumentFilter, setInstrumentFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');
  const [stressScenarioDelayed, setStressScenarioDelayed] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Trade Deal Form
  const [newInstrument, setNewInstrument] = useState<TradeInstrumentType>('LETTER_OF_CREDIT');
  const [newReference, setNewReference] = useState<string>('LC/IMP/2026/99310');
  const [newCounterparty, setNewCounterparty] = useState<string>('Schneider Electric SE');
  const [newDirection, setNewDirection] = useState<'RECEIVABLE' | 'PAYABLE'>('PAYABLE');
  const [newAmount, setNewAmount] = useState<number>(5500000);
  const [newCcy, setNewCcy] = useState<CurrencyCode>('EUR');
  const [newMaturityDate, setNewMaturityDate] = useState<string>('2026-11-25');
  const [newTradeBank, setNewTradeBank] = useState<string>('BNP Paribas Paris');
  const [newRiskRating, setNewRiskRating] = useState<'AAA' | 'AA' | 'A' | 'BBB'>('AA');
  const [newCollateralPct, setNewCollateralPct] = useState<number>(10);
  const [newNotes, setNewNotes] = useState<string>('Import LC for smart grid distribution modules');

  // Filtered Projections
  const filteredProjections = useMemo(() => {
    return tradeProjections.filter((tp) => {
      const matchInst = instrumentFilter === 'ALL' || tp.instrumentType === instrumentFilter;
      const matchDir = directionFilter === 'ALL' || tp.direction === directionFilter;
      const matchEntity = selectedEntityId === 'ALL' || tp.entityId === selectedEntityId;
      return matchInst && matchDir && matchEntity;
    });
  }, [tradeProjections, instrumentFilter, directionFilter, selectedEntityId]);

  // USD Conversion approximate helper for uniform rollup
  const toUsd = (amount: number, ccy: CurrencyCode) => {
    switch (ccy) {
      case 'USD':
        return amount;
      case 'EUR':
        return amount * 1.085;
      case 'GBP':
        return amount * 1.285;
      case 'JPY':
        return amount / 152.0;
      case 'CHF':
        return amount * 1.13;
      case 'SGD':
        return amount * 0.76;
      case 'AUD':
        return amount * 0.66;
      case 'CAD':
        return amount * 0.73;
      default:
        return amount;
    }
  };

  // Maturity Buckets Calculation
  const maturityBuckets = useMemo(() => {
    const buckets = {
      '0-7 Days': { receivables: 0, payables: 0, count: 0 },
      '8-30 Days': { receivables: 0, payables: 0, count: 0 },
      '31-60 Days': { receivables: 0, payables: 0, count: 0 },
      '61-90 Days': { receivables: 0, payables: 0, count: 0 },
      '90+ Days': { receivables: 0, payables: 0, count: 0 },
    };

    filteredProjections.forEach((tp) => {
      // Calculate days to settlement (baseline date 2026-11-05)
      const baseDate = new Date('2026-11-05');
      let targetDate = new Date(tp.projectedSettlementDate);

      // If stress test is active, delay by 15 days
      if (stressScenarioDelayed) {
        targetDate = new Date(targetDate.getTime() + 15 * 86400000);
      }

      const diffDays = Math.max(0, Math.round((targetDate.getTime() - baseDate.getTime()) / 86400000));
      const amountUsd = toUsd(tp.amount, tp.currency) * tp.probability;

      if (diffDays <= 7) {
        if (tp.direction === 'RECEIVABLE') buckets['0-7 Days'].receivables += amountUsd;
        else buckets['0-7 Days'].payables += amountUsd;
        buckets['0-7 Days'].count += 1;
      } else if (diffDays <= 30) {
        if (tp.direction === 'RECEIVABLE') buckets['8-30 Days'].receivables += amountUsd;
        else buckets['8-30 Days'].payables += amountUsd;
        buckets['8-30 Days'].count += 1;
      } else if (diffDays <= 60) {
        if (tp.direction === 'RECEIVABLE') buckets['31-60 Days'].receivables += amountUsd;
        else buckets['31-60 Days'].payables += amountUsd;
        buckets['31-60 Days'].count += 1;
      } else if (diffDays <= 90) {
        if (tp.direction === 'RECEIVABLE') buckets['61-90 Days'].receivables += amountUsd;
        else buckets['61-90 Days'].payables += amountUsd;
        buckets['61-90 Days'].count += 1;
      } else {
        if (tp.direction === 'RECEIVABLE') buckets['90+ Days'].receivables += amountUsd;
        else buckets['90+ Days'].payables += amountUsd;
        buckets['90+ Days'].count += 1;
      }
    });

    return buckets;
  }, [filteredProjections, stressScenarioDelayed]);

  // Aggregate stats
  const totals = useMemo(() => {
    let totRecUsd = 0;
    let totPayUsd = 0;
    let totCollateralUsd = 0;

    filteredProjections.forEach((tp) => {
      const usdVal = toUsd(tp.amount, tp.currency);
      if (tp.direction === 'RECEIVABLE') {
        totRecUsd += usdVal;
      } else {
        totPayUsd += usdVal;
        totCollateralUsd += usdVal * (tp.collateralPercentage / 100);
      }
    });

    return {
      totalReceivables: totRecUsd,
      totalPayables: totPayUsd,
      netCashImpact: totRecUsd - totPayUsd,
      collateralLocked: totCollateralUsd,
    };
  }, [filteredProjections]);

  // Bank exposure concentration
  const bankExposures = useMemo(() => {
    const exposures: Record<string, { totalUsd: number; count: number }> = {};
    filteredProjections.forEach((tp) => {
      const bank = tp.tradeBank.split(' ')[0] + ' ' + (tp.tradeBank.split(' ')[1] || '');
      const usd = toUsd(tp.amount, tp.currency);
      if (!exposures[bank]) exposures[bank] = { totalUsd: 0, count: 0 };
      exposures[bank].totalUsd += usd;
      exposures[bank].count += 1;
    });
    return Object.entries(exposures)
      .map(([bank, data]) => ({ bank, ...data }))
      .sort((a, b) => b.totalUsd - a.totalUsd);
  }, [filteredProjections]);

  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault();
    addTradeProjection({
      instrumentType: newInstrument,
      reference: newReference,
      counterparty: newCounterparty,
      direction: newDirection,
      amount: Number(newAmount),
      currency: newCcy,
      issuanceDate: '2026-11-05',
      maturityDate: newMaturityDate,
      projectedSettlementDate: newMaturityDate,
      tradeBank: newTradeBank,
      riskRating: newRiskRating,
      collateralPercentage: Number(newCollateralPct),
      notes: newNotes,
      status: 'COMMITTED',
      probability: 0.98,
    });
    setShowAddModal(false);
  };

  const getInstrumentBadge = (type: TradeInstrumentType) => {
    switch (type) {
      case 'LETTER_OF_CREDIT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">LC</span>;
      case 'SUPPLY_CHAIN_FINANCE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">SCF</span>;
      case 'DOCUMENTARY_COLLECTION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">DOC COLL</span>;
      case 'TRADE_INVOICE_DISCOUNTING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">INVOICE DISC</span>;
      case 'FX_FORWARD_SETTLEMENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">FX FWD</span>;
      case 'STANDBY_LC':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">SBLC</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trade Finance & Cash Flow Projections</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Maturity Waterfall
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Reconciles trade finance commitments (Letters of Credit, Supply Chain Financing, Documentary Collections, FX Forwards) against operational cash flows across maturity time horizons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Stress Scenario Toggle */}
          <button
            onClick={() => setStressScenarioDelayed(!stressScenarioDelayed)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-all shadow-xs ${
              stressScenarioDelayed
                ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title="Simulate 15-day supply chain logistics delay across all trade settlements"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {stressScenarioDelayed ? 'Stress Active: +15d Supply Chain Delay' : 'Simulate +15d Delay'}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Trade Commitment
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Projected Trade Receivables</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
            +${(totals.totalReceivables / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Confirmed export LCs & customer trade acceptances
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Committed Trade Payables</span>
            <span className="p-1.5 rounded-md bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2 font-mono">
            -${(totals.totalPayables / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Import LCs & approved supplier financing maturities
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Net Trade Cash Impact</span>
            <span
              className={`p-1.5 rounded-md ${
                totals.netCashImpact >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div
            className={`text-2xl font-bold mt-2 font-mono ${
              totals.netCashImpact >= 0 ? 'text-indigo-600' : 'text-amber-600'
            }`}
          >
            {totals.netCashImpact >= 0 ? '+' : ''}${(totals.netCashImpact / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Net liquidity contribution to group cash pool
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Collateral / Margin Pledged</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <Shield className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            ${(totals.collateralLocked / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-amber-700 mt-1 font-medium">
            Restricted cash held by issuing trade banks
          </div>
        </div>
      </div>

      {/* Maturity Waterfall Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Trade Finance Maturity Waterfall & Liquidity Buckets
            </h2>
            <p className="text-xs text-slate-500">
              Weighted net cash flows segregated by contractual settlement horizon.
              {stressScenarioDelayed && (
                <span className="text-amber-600 font-semibold ml-1">
                  (Simulating +15-day supply chain delivery delay)
                </span>
              )}
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Valuation Base Date: <span className="font-semibold text-slate-800">2026-11-05</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(maturityBuckets).map(([bucketName, data]) => {
            const net = data.receivables - data.payables;
            const isPositive = net >= 0;

            return (
              <div
                key={bucketName}
                className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      {bucketName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {data.count} deals
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-emerald-700">
                      <span>Rec:</span>
                      <span>+${(data.receivables / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-rose-700">
                      <span>Pay:</span>
                      <span>-${(data.payables / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-mono">
                  <span className="text-[11px] text-slate-500 font-sans font-medium">Net Flow:</span>
                  <span
                    className={`text-sm font-bold ${
                      isPositive ? 'text-indigo-600' : 'text-rose-600'
                    }`}
                  >
                    {isPositive ? '+' : ''}${(net / 1000000).toFixed(2)}M
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Trade Commitments Table & Bank Concentration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Commitments Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Trade Finance Commitments</h2>
              <span className="text-xs text-slate-500">
                Showing {filteredProjections.length} active trade instruments
              </span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={instrumentFilter}
                onChange={(e) => setInstrumentFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Instruments</option>
                <option value="LETTER_OF_CREDIT">Letters of Credit</option>
                <option value="SUPPLY_CHAIN_FINANCE">Supply Chain Finance</option>
                <option value="DOCUMENTARY_COLLECTION">Documentary Collection</option>
                <option value="TRADE_INVOICE_DISCOUNTING">Invoice Discounting</option>
                <option value="FX_FORWARD_SETTLEMENT">FX Forwards</option>
              </select>

              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Flows</option>
                <option value="RECEIVABLE">Receivables Inflow</option>
                <option value="PAYABLE">Payables Outflow</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Type & Ref</th>
                  <th className="py-2.5 px-3">Counterparty</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Settlement Date</th>
                  <th className="py-2.5 px-3">Trade Bank</th>
                  <th className="py-2.5 px-3">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredProjections.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          <div>{getInstrumentBadge(item.instrumentType)}</div>
                          <span className="font-mono text-[11px] text-slate-600 font-medium">
                            {item.reference}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{item.counterparty}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          Rating: <span className="font-mono font-bold text-slate-700">{item.riskRating}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {item.direction === 'RECEIVABLE' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <ArrowDownRight className="w-3.5 h-3.5" /> Inflow
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Outflow
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 text-xs">
                        {item.currency} {item.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-800">
                          {stressScenarioDelayed ? (
                            <span className="text-amber-700 font-bold">
                              {new Date(new Date(item.projectedSettlementDate).getTime() + 15 * 86400000)
                                .toISOString()
                                .substring(0, 10)}
                            </span>
                          ) : (
                            item.projectedSettlementDate
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Prob: {(item.probability * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 truncate max-w-[140px]">
                        {item.tradeBank}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {item.collateralPercentage > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            {item.collateralPercentage}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0%</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Bank Exposure Concentration (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" /> Trade Bank Concentration
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Basel III Limits</span>
            </div>

            <div className="space-y-3">
              {bankExposures.map((be) => {
                const pct = Math.min(100, Math.round((be.totalUsd / (totals.totalPayables + totals.totalReceivables || 1)) * 100));
                return (
                  <div key={be.bank} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{be.bank}</span>
                      <span className="font-mono font-bold text-slate-900">
                        ${(be.totalUsd / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{be.count} instruments</span>
                      <span>{pct}% share</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational vs Trade Blended Note */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              Corporate Treasury Best Practice
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Trade finance cash flows should be combined with ERP accounts payable/receivable batches to prevent artificial funding deficits. Irrevocable export LCs provide verified liquidity backing that can offset commercial debt facilities.
            </p>
          </div>
        </div>
      </div>

      {/* Add Trade Commitment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Register Trade Commitment</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTrade} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Instrument Type
                  </label>
                  <select
                    value={newInstrument}
                    onChange={(e) => setNewInstrument(e.target.value as TradeInstrumentType)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="LETTER_OF_CREDIT">Letter of Credit (LC)</option>
                    <option value="SUPPLY_CHAIN_FINANCE">Supply Chain Finance (SCF)</option>
                    <option value="DOCUMENTARY_COLLECTION">Documentary Collection</option>
                    <option value="TRADE_INVOICE_DISCOUNTING">Trade Invoice Discounting</option>
                    <option value="FX_FORWARD_SETTLEMENT">FX Forward Settlement</option>
                    <option value="STANDBY_LC">Standby LC (SBLC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cash Flow Direction
                  </label>
                  <select
                    value={newDirection}
                    onChange={(e) => setNewDirection(e.target.value as 'RECEIVABLE' | 'PAYABLE')}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="PAYABLE">Payable (Outflow / Import)</option>
                    <option value="RECEIVABLE">Receivable (Inflow / Export)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reference #</label>
                  <input
                    type="text"
                    required
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Counterparty</label>
                  <input
                    type="text"
                    required
                    value={newCounterparty}
                    onChange={(e) => setNewCounterparty(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Currency</label>
                  <select
                    value={newCcy}
                    onChange={(e) => setNewCcy(e.target.value as CurrencyCode)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Contractual Settlement Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newMaturityDate}
                    onChange={(e) => setNewMaturityDate(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Issuing / Advising Bank
                  </label>
                  <input
                    type="text"
                    required
                    value={newTradeBank}
                    onChange={(e) => setNewTradeBank(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Counterparty Risk Rating
                  </label>
                  <select
                    value={newRiskRating}
                    onChange={(e) => setNewRiskRating(e.target.value as 'AAA' | 'AA' | 'A' | 'BBB')}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="AAA">AAA (Prime Sovereign / Multilateral)</option>
                    <option value="AA">AA (High Grade Multinationals)</option>
                    <option value="A">A (Upper Medium Grade)</option>
                    <option value="BBB">BBB (Investment Grade)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cash Margin / Collateral Pledged (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newCollateralPct}
                    onChange={(e) => setNewCollateralPct(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  placeholder="e.g. Commercial invoice or underlying commodity trade"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Save Trade Commitment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
