import React, { useState } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
  Download,
  Filter,
  Check,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { BankStatementLine } from '../../types/treasury';

export const ReconciliationView: React.FC = () => {
  const { statementLines, bankAccounts, createAdjustment } = useTreasury();

  const [notification, setNotification] = useState<string | null>(null);

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleResolveBreakWithAdjustment = (stmt: BankStatementLine) => {
    const acc = bankAccounts.find((a) => a.id === stmt.accountId);
    if (!acc) return;

    createAdjustment({
      accountId: acc.id,
      adjustmentType: 'BANK_FEE',
      direction: stmt.direction === 'DEBIT' ? 'DEBIT' : 'CREDIT',
      amount: stmt.amount,
      reason: `Reconciliation break resolution for statement ref ${stmt.transactionReference}`,
      referenceTransaction: stmt.transactionReference,
    });

    setNotification(`Adjustment created for statement break ${stmt.transactionReference}. Sent to checker queue.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const columns: Column<BankStatementLine>[] = [
    {
      key: 'statementNumber',
      header: 'Statement & Ref',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{row.statementNumber}</span>
          <div className="text-[10px] text-slate-500 font-mono">{row.transactionReference}</div>
        </div>
      ),
    },
    {
      key: 'counterparty',
      header: 'Counterparty & Narrative',
      render: (row) => (
        <div className="max-w-[240px] truncate" title={row.narrative}>
          <div className="font-semibold text-slate-800">{row.counterparty}</div>
          <div className="text-[10px] text-slate-400 font-mono">{row.narrative}</div>
        </div>
      ),
    },
    {
      key: 'account',
      header: 'Bank Account',
      render: (row) => {
        const acc = bankAccounts.find((a) => a.id === row.accountId);
        return (
          <div>
            <div className="font-medium text-slate-800">{acc?.accountName || row.accountId}</div>
            <div className="text-[10px] text-slate-500 font-mono">{acc?.iban}</div>
          </div>
        );
      },
    },
    {
      key: 'direction',
      header: 'Type',
      render: (row) => (
        <span
          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
            row.direction === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          {row.direction}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Statement Amount',
      render: (row) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(row.amount, row.currency)}
        </div>
      ),
    },
    {
      key: 'matchStatus',
      header: 'Reconciliation Status',
      render: (row) => <StatusBadge status={row.matchStatus} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      sortable: false,
      render: (row) => (
        <div>
          {row.matchStatus === 'EXCEPTION' && (
            <button
              onClick={() => handleResolveBreakWithAdjustment(row)}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-700 rounded hover:bg-amber-800 transition"
              title="Create Adjustment to resolve break"
            >
              Resolve Break
            </button>
          )}
          {row.matchStatus === 'MATCHED' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Reconciled
            </span>
          )}
        </div>
      ),
    },
  ];

  const totalLines = statementLines.length;
  const matchedLines = statementLines.filter((s) => s.matchStatus === 'MATCHED' || s.matchStatus === 'MANUALLY_MATCHED').length;
  const breakLines = statementLines.filter((s) => s.matchStatus === 'EXCEPTION' || s.matchStatus === 'UNMATCHED').length;
  const reconRate = totalLines > 0 ? Math.round((matchedLines / totalLines) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Bank Statement Reconciliation & Break Analysis
          </h1>
          <p className="text-xs text-slate-500">
            Automated comparison of external MT940 / camt.053 statement items against internal ledger cash postings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-mono">
            Automated Match Rate: {reconRate}%
          </span>
        </div>
      </div>

      {notification && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Statement Items</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalLines}</p>
          <p className="text-[11px] text-slate-500 mt-1">Processed from Daily Feeds</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Successfully Reconciled</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{matchedLines}</p>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">{reconRate}% Clearance Rate</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outstanding Breaks & Exceptions</p>
          <p className="text-2xl font-bold font-mono text-rose-700 mt-1">{breakLines}</p>
          <p className="text-[11px] text-rose-600 mt-1">Requires Operator Resolution</p>
        </div>
      </div>

      {/* Reconciliation Table */}
      <DataTable
        columns={columns}
        data={statementLines}
        searchPlaceholder="Filter statements by reference, counterparty, narrative..."
        searchKey={(s) => `${s.statementNumber} ${s.transactionReference} ${s.counterparty} ${s.narrative}`}
        exportFileName="gcms_bank_reconciliation"
        pageSize={10}
      />
    </div>
  );
};
