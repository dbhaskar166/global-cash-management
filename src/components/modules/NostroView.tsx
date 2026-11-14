import React, { useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  AlertOctagon,
  ArrowRightLeft,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { NostroAccount } from '../../types/treasury';

export const NostroView: React.FC = () => {
  const { nostroAccounts, createFunding } = useTreasury();

  const [notification, setNotification] = useState<string | null>(null);

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleFundNostro = (nostro: NostroAccount) => {
    setNotification(`Nostro funding request generated for ${nostro.correspondentBank}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const columns: Column<NostroAccount>[] = [
    {
      key: 'correspondentBank',
      header: 'Correspondent Bank & Account',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.correspondentBank}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            {row.accountNumber} • BIC: {row.swiftBic}
          </div>
        </div>
      ),
    },
    {
      key: 'currency',
      header: 'CCY',
      render: (row) => <span className="font-mono font-bold text-slate-700">{row.currency}</span>,
    },
    {
      key: 'bookBalance',
      header: 'Internal Book Balance',
      render: (row) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(row.bookBalance, row.currency)}
        </div>
      ),
    },
    {
      key: 'statementBalance',
      header: 'Correspondent Stmt Balance',
      render: (row) => {
        const delta = row.bookBalance - row.statementBalance;
        const hasBreak = Math.abs(delta) > 0.01;
        return (
          <div className="text-right font-mono">
            <div className={`font-semibold ${hasBreak ? 'text-amber-800' : 'text-slate-800'}`}>
              {formatCurrency(row.statementBalance, row.currency)}
            </div>
            {hasBreak && (
              <div className="text-[10px] text-rose-600 font-bold">
                Break: {formatCurrency(Math.abs(delta), row.currency)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'expectedFlows',
      header: 'Expected Inflows / Outflows',
      render: (row) => (
        <div className="text-xs font-mono">
          <div className="text-emerald-700">+{formatCurrency(row.expectedInflows, row.currency)}</div>
          <div className="text-rose-700">-{formatCurrency(row.expectedOutflows, row.currency)}</div>
        </div>
      ),
    },
    {
      key: 'forecastedBalance',
      header: 'Forecasted Position',
      render: (row) => (
        <div className="text-right font-mono font-bold text-navy-900">
          {formatCurrency(row.forecastedBalance, row.currency)}
        </div>
      ),
    },
    {
      key: 'reconciliationStatus',
      header: 'Reconciliation',
      render: (row) => <StatusBadge status={row.reconciliationStatus} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      sortable: false,
      render: (row) => (
        <button
          onClick={() => handleFundNostro(row)}
          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition"
        >
          Nostro Funding
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Nostro Account Management & Correspondent Banking
          </h1>
          <p className="text-xs text-slate-500">
            Monitoring foreign currency Nostro balances with JPMorgan, Citibank, Deutsche Bank, HSBC and BNP Paribas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 bg-slate-100 rounded-md text-slate-700 font-semibold">
            {nostroAccounts.length} Active Nostro Correspondent Facilities
          </span>
        </div>
      </div>

      {notification && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Nostro Table */}
      <DataTable
        columns={columns}
        data={nostroAccounts}
        searchPlaceholder="Search Nostro accounts by correspondent bank or currency..."
        searchKey={(n) => `${n.correspondentBank} ${n.accountNumber} ${n.swiftBic} ${n.currency}`}
        exportFileName="gcms_nostro_accounts"
        pageSize={10}
      />
    </div>
  );
};
