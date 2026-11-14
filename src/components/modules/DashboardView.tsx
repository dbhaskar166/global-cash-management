import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Zap,
  Workflow,
  Ship,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { KpiCard } from '../common/KpiCard';
import { convertFx } from '../../services/financialMath';

interface DashboardViewProps {
  onNavigate: (module: string) => void;
}

const COLORS = ['#102A43', '#00A6A6', '#2D3748', '#3182CE', '#D69E2E', '#38A169', '#E53E3E', '#805AD5', '#DD6B20', '#319795'];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    bankAccounts,
    fxRates,
    selectedCurrency,
    selectedEntityId,
    realignments,
    fundings,
    adjustments,
    payments,
    statementLines,
    nostroAccounts,
    cashFlows,
    simulateFxFluctuation,
  } = useTreasury();

  // Filter accounts by entity if selected
  const filteredAccounts = bankAccounts.filter((a) =>
    selectedEntityId === 'ALL' ? true : a.entityId === selectedEntityId
  );

  // Convert account amount to selected base currency
  const toBase = (amount: number, fromCcy: string) => {
    return convertFx(amount, fromCcy as any, selectedCurrency, fxRates).convertedAmount;
  };

  // Aggregated KPI Calculations
  const totalBookCash = filteredAccounts.reduce((sum, a) => sum + toBase(a.bookBalance, a.currency), 0);
  const totalAvailableCash = filteredAccounts.reduce((sum, a) => sum + toBase(a.availableBalance, a.currency), 0);
  const totalRestrictedCash = filteredAccounts.reduce((sum, a) => sum + toBase(a.restrictedBalance, a.currency), 0);
  const totalValueDatedCash = filteredAccounts.reduce((sum, a) => sum + toBase(a.valueDatedBalance, a.currency), 0);

  // Free Cash: Available - Restricted - Target/Minimum
  const totalFreeCash = Math.max(0, totalAvailableCash - totalRestrictedCash - 25000000);

  // Inflows & Outflows from cash flows
  const totalInflows = cashFlows
    .filter((cf) => cf.flowType.includes('INCOMING'))
    .reduce((sum, cf) => sum + toBase(cf.amount, cf.currency), 0);
  const totalOutflows = cashFlows
    .filter((cf) => cf.flowType.includes('OUTGOING'))
    .reduce((sum, cf) => sum + toBase(cf.amount, cf.currency), 0);
  const netCashPosition = totalInflows - totalOutflows;

  // Funded Amount
  const totalFunded = fundings
    .filter((f) => f.status === 'EXECUTED')
    .reduce((sum, f) => sum + toBase(f.requiredAmount, f.currency), 0);

  // Pending Realignments
  const pendingRealignmentsCount = realignments.filter((r) => r.status === 'PENDING_APPROVAL' || r.status === 'PROPOSED').length;
  const pendingAdjustmentsCount = adjustments.filter((a) => a.status === 'PENDING_APPROVAL').length;
  const unmatchedPaymentsCount = payments.filter((p) => p.matchStatus === 'UNMATCHED').length;
  const unreconciledTxnCount = statementLines.filter((s) => s.matchStatus === 'UNMATCHED' || s.matchStatus === 'EXCEPTION').length;

  // Nostro total balance
  const totalNostroBalance = nostroAccounts.reduce((sum, n) => sum + toBase(n.bookBalance, n.currency), 0);

  // Visualizations:
  // 1. By Currency
  const ccyMap: Record<string, number> = {};
  filteredAccounts.forEach((acc) => {
    ccyMap[acc.currency] = (ccyMap[acc.currency] || 0) + toBase(acc.bookBalance, acc.currency);
  });
  const currencyData = Object.entries(ccyMap).map(([name, value]) => ({ name, value }));

  // 2. By Bank
  const bankMap: Record<string, number> = {};
  filteredAccounts.forEach((acc) => {
    const bankShort = acc.bankName.split(' ')[0] || acc.bankName;
    bankMap[bankShort] = (bankMap[bankShort] || 0) + toBase(acc.bookBalance, acc.currency);
  });
  const bankData = Object.entries(bankMap).map(([name, value]) => ({ name, value }));

  // 3. 7, 30, 90 Day Projections Trend
  const forecastTrendData = [
    { day: 'Day 0', Actual: totalAvailableCash, Forecast: totalAvailableCash, Optimistic: totalAvailableCash, Pessimistic: totalAvailableCash },
    { day: 'Day 7', Forecast: totalAvailableCash * 1.02, Optimistic: totalAvailableCash * 1.05, Pessimistic: totalAvailableCash * 0.98 },
    { day: 'Day 15', Forecast: totalAvailableCash * 1.04, Optimistic: totalAvailableCash * 1.08, Pessimistic: totalAvailableCash * 0.96 },
    { day: 'Day 30', Forecast: totalAvailableCash * 1.07, Optimistic: totalAvailableCash * 1.12, Pessimistic: totalAvailableCash * 0.94 },
    { day: 'Day 60', Forecast: totalAvailableCash * 1.11, Optimistic: totalAvailableCash * 1.18, Pessimistic: totalAvailableCash * 0.91 },
    { day: 'Day 90', Forecast: totalAvailableCash * 1.15, Optimistic: totalAvailableCash * 1.24, Pessimistic: totalAvailableCash * 0.88 },
  ];

  // 4. Inflow vs Outflow
  const flowBarData = [
    { category: 'Operating', Inflows: 14500000, Outflows: 8200000 },
    { category: 'Intercompany', Inflows: 10000000, Outflows: 10000000 },
    { category: 'Tax & Treasury', Inflows: 1250000, Outflows: 3200000 },
    { category: 'Financing', Inflows: 5000000, Outflows: 1800000 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Live Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Global Cash Management Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Real-time multi-currency liquidity consolidation, Nostro monitoring, and operational controls
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={simulateFxFluctuation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs"
            title="Simulate realistic FX rate ticks"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Tick FX Rates</span>
          </button>

          <button
            onClick={() => onNavigate('cash-realignment')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-teal-300" />
            <span>New Realignment</span>
          </button>
        </div>
      </div>

      {/* Featured Treasury Engine Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div
          onClick={() => onNavigate('payment-flow')}
          className="group cursor-pointer rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 to-white p-4 transition-all hover:border-indigo-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Workflow className="h-4 w-4" />
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 group-hover:translate-x-0.5 transition-transform">
              Launch Engine <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <h2 className="mt-2.5 text-sm font-bold text-slate-900">Payment Flow Dashboard</h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Trace payment lifecycle hops across internal accounts, Fedwire/TARGET2 RTGS, Nostro settlement, and GL postings.
          </p>
        </div>

        <div
          onClick={() => onNavigate('trade-projections')}
          className="group cursor-pointer rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white p-4 transition-all hover:border-emerald-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Ship className="h-4 w-4" />
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
              View Forecast <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <h2 className="mt-2.5 text-sm font-bold text-slate-900">Trade & Cash Flow Projection</h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Consolidate LCs, Supply Chain Financing, and Trade Receivables across 0-90+ day maturity waterfall buckets.
          </p>
        </div>

        <div
          onClick={() => onNavigate('knowledge-base')}
          className="group cursor-pointer rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-white p-4 transition-all hover:border-amber-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white shadow-xs">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 group-hover:translate-x-0.5 transition-transform">
              Explore Glossary <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <h2 className="mt-2.5 text-sm font-bold text-slate-900">Treasury Knowledge Base</h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Deep domain definitions, formulas, and worked numerical examples for Realignment, Cash Position, and Adjustments.
          </p>
        </div>
      </div>

      {/* 16 KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Total Global Cash"
          amount={totalBookCash}
          currency={selectedCurrency}
          changePercent={1.8}
          subtitle="Consolidated Book"
          onClick={() => onNavigate('cash-position')}
        />
        <KpiCard
          title="Available Cash"
          amount={totalAvailableCash}
          currency={selectedCurrency}
          changePercent={1.4}
          subtitle="Operational Buffer"
          onClick={() => onNavigate('cash-position')}
        />
        <KpiCard
          title="Free Cash"
          amount={totalFreeCash}
          currency={selectedCurrency}
          changePercent={2.6}
          subtitle="Investable Liquidity"
          onClick={() => onNavigate('free-cash')}
        />
        <KpiCard
          title="Restricted Cash"
          amount={totalRestrictedCash}
          currency={selectedCurrency}
          changePercent={0.0}
          subtitle="Escrow & Collateral"
          onClick={() => onNavigate('cash-position')}
        />
        <KpiCard
          title="Cash Inflows"
          amount={totalInflows}
          currency={selectedCurrency}
          changePercent={4.2}
          subtitle="Collections Today"
          onClick={() => onNavigate('cash-flow')}
        />
        <KpiCard
          title="Cash Outflows"
          amount={totalOutflows}
          currency={selectedCurrency}
          changePercent={-2.1}
          subtitle="Disbursements Today"
          onClick={() => onNavigate('cash-flow')}
        />
        <KpiCard
          title="Net Cash Position"
          amount={netCashPosition}
          currency={selectedCurrency}
          changePercent={3.5}
          subtitle="Net Daily Delta"
          onClick={() => onNavigate('cash-position')}
        />
        <KpiCard
          title="Nostro Balances"
          amount={totalNostroBalance}
          currency={selectedCurrency}
          changePercent={0.9}
          subtitle="Correspondent Banks"
          onClick={() => onNavigate('nostro')}
        />
      </div>

      {/* Secondary Operational Status KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div
          onClick={() => onNavigate('cash-realignment')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition shadow-2xs"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase">Pending Realignment</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">{pendingRealignmentsCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">Awaiting Execution</span>
        </div>

        <div
          onClick={() => onNavigate('cash-funding')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition shadow-2xs"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase">Total Funded Amount</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCurrency, maximumFractionDigits: 0 }).format(totalFunded)}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Overnight & Pool</span>
        </div>

        <div
          onClick={() => onNavigate('cash-adjustment')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition shadow-2xs"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase">Pending Adjustments</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">{pendingAdjustmentsCount}</p>
          <span className="text-[10px] text-blue-600 font-medium">Awaiting Review</span>
        </div>

        <div
          onClick={() => onNavigate('payment-matching')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition shadow-2xs"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase">Unmatched Payments</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">{unmatchedPaymentsCount}</p>
          <span className="text-[10px] text-orange-600 font-medium">Rule Engine Queue</span>
        </div>

        <div
          onClick={() => onNavigate('reconciliation')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition shadow-2xs"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase">Unreconciled Breaks</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">{unreconciledTxnCount}</p>
          <span className="text-[10px] text-rose-600 font-medium">Statement Variances</span>
        </div>

        <div
          onClick={() => onNavigate('liquidity')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition shadow-2xs"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase">Liquidity Coverage</p>
          <p className="text-lg font-bold font-mono text-emerald-700 mt-1">218%</p>
          <span className="text-[10px] text-slate-500">Basel III Buffer</span>
        </div>

        <div
          onClick={() => onNavigate('cash-projection')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition shadow-2xs"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase">Forecast 30-Day</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">+7.0%</p>
          <span className="text-[10px] text-emerald-600 font-medium">Surplus Trend</span>
        </div>

        <div
          onClick={() => onNavigate('accounting-ledger')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition shadow-2xs"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase">General Ledger</p>
          <p className="text-lg font-bold font-mono text-emerald-700 mt-1">100% Balanced</p>
          <span className="text-[10px] text-slate-500 font-mono">Debits === Credits</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Currency Concentration Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cash Position by Currency</h2>
              <p className="text-xs text-slate-500">Valued in {selectedCurrency}</p>
            </div>
            <button
              onClick={() => onNavigate('multi-currency')}
              className="text-xs text-teal-700 hover:underline font-medium"
            >
              FX Rates →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {currencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [
                    `${new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCurrency }).format(Number(val || 0))}`,
                    'Balance',
                  ]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash by Bank Concentration */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cash Position by Major Bank</h2>
              <p className="text-xs text-slate-500">Commercial & Correspondent Counterparties</p>
            </div>
            <button
              onClick={() => onNavigate('bank-accounts')}
              className="text-xs text-teal-700 hover:underline font-medium"
            >
              All Accounts →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankData} layout="vertical" margin={{ top: 5, right: 20, left: 35, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`}
                  tick={{ fontSize: 10 }}
                />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [
                    `${new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCurrency }).format(Number(val || 0))}`,
                    'Balance',
                  ]}
                />
                <Bar dataKey="value" fill="#102A43" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7, 30, 90 Day Projections */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cash Projection (7 / 30 / 90 Days)</h2>
              <p className="text-xs text-slate-500">Base, Optimistic & Pessimistic Scenarios</p>
            </div>
            <button
              onClick={() => onNavigate('cash-projection')}
              className="text-xs text-teal-700 hover:underline font-medium"
            >
              Detailed Models →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(val: any) => [
                    `${new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCurrency }).format(Number(val || 0))}`,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Forecast" stroke="#102A43" strokeWidth={2} dot />
                <Line type="monotone" dataKey="Optimistic" stroke="#38A169" strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="Pessimistic" stroke="#E53E3E" strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Inflow vs Outflow & Liquidity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Inflows vs Outflows by Category</h2>
              <p className="text-xs text-slate-500">Operating, Intercompany, Tax & Financing</p>
            </div>
            <button
              onClick={() => onNavigate('cash-flow')}
              className="text-xs text-teal-700 hover:underline font-medium"
            >
              Cash Flows →
            </button>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(val: any) => [
                    `${new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCurrency }).format(Number(val || 0))}`,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Inflows" fill="#00A6A6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Outflows" fill="#E53E3E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Free Cash vs Required Operational Reserves */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Free Cash Optimization Engine</h2>
                <p className="text-xs text-slate-500">Idle vs Trapped vs Investable Liquidity</p>
              </div>
              <button
                onClick={() => onNavigate('free-cash')}
                className="text-xs text-teal-700 hover:underline font-medium"
              >
                Optimize Liquidity →
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Investable Free Cash</span>
                  <span className="font-mono text-emerald-700">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCurrency }).format(totalFreeCash * 0.75)} (75%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Surplus Idle Cash (Yield Drag)</span>
                  <span className="font-mono text-amber-700">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCurrency }).format(totalFreeCash * 0.18)} (18%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '18%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Trapped / Regulatory Capital</span>
                  <span className="font-mono text-rose-700">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCurrency }).format(totalFreeCash * 0.07)} (7%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: '7%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-teal-50/80 border border-teal-200/80 p-3 text-xs text-teal-900 flex items-center justify-between">
            <div>
              <p className="font-semibold">Automated Realignment Recommendation:</p>
              <p className="text-[11px] text-teal-800">
                Sweep $10M surplus from US Collections to Overnight MMF investment yielding 4.95%.
              </p>
            </div>
            <button
              onClick={() => onNavigate('cash-realignment')}
              className="ml-3 px-3 py-1.5 bg-teal-700 text-white font-medium rounded-md hover:bg-teal-800 shrink-0 text-xs shadow-2xs"
            >
              Review Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
