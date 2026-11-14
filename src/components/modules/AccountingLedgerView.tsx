import React, { useState } from 'react';
import {
  BookOpenCheck,
  Scale,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  DollarSign,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { JournalEntry, ChartOfAccountItem } from '../../types/treasury';
import { validateDoubleEntryBalance } from '../../services/financialMath';

export const AccountingLedgerView: React.FC = () => {
  const { journalEntries, chartOfAccounts, selectedEntityId } = useTreasury();

  const [activeTab, setActiveTab] = useState<'JOURNALS' | 'TRIAL_BALANCE' | 'COA'>('JOURNALS');
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const filteredJournals = journalEntries.filter((j) => {
    if (selectedEntityId !== 'ALL' && j.entityId !== selectedEntityId) return false;
    return true;
  });

  const journalColumns: Column<JournalEntry>[] = [
    {
      key: 'journalNumber',
      header: 'Journal Entry # & Event',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{row.journalNumber}</span>
          <div className="text-[10px] text-slate-500 font-mono">{row.accountingEventId}</div>
        </div>
      ),
    },
    {
      key: 'sourceSystem',
      header: 'Source Module',
      render: (row) => (
        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
          {row.sourceSystem}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Transaction Ref',
      render: (row) => (
        <span className="font-mono text-slate-700 font-semibold">{row.transactionReference}</span>
      ),
    },
    {
      key: 'totalDebit',
      header: 'Total Debit',
      render: (row) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(row.totalDebit, row.currency)}
        </div>
      ),
    },
    {
      key: 'totalCredit',
      header: 'Total Credit',
      render: (row) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(row.totalCredit, row.currency)}
        </div>
      ),
    },
    {
      key: 'balanceCheck',
      header: 'Double-Entry Proof',
      render: (row) => {
        const balance = validateDoubleEntryBalance(row.lines);
        return (
          <div className="flex items-center gap-1 font-mono text-xs">
            {balance.isBalanced ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Balanced (Δ=0.00)
              </span>
            ) : (
              <span className="text-rose-700 font-bold">Unbalanced</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Posting Status',
      render: (row) => <StatusBadge status={row.postingStatus} size="sm" />,
    },
  ];

  // Derive Trial Balance from Journal entries
  const trialBalanceMap: Record<string, { name: string; type: string; debits: number; credits: number }> = {};
  chartOfAccounts.forEach((coa) => {
    trialBalanceMap[coa.accountCode] = { name: coa.accountName, type: coa.type, debits: 0, credits: 0 };
  });

  filteredJournals.forEach((j) => {
    j.lines.forEach((line) => {
      if (!trialBalanceMap[line.glAccount]) {
        trialBalanceMap[line.glAccount] = { name: line.glAccountName, type: 'ASSET', debits: 0, credits: 0 };
      }
      trialBalanceMap[line.glAccount].debits += line.debit;
      trialBalanceMap[line.glAccount].credits += line.credit;
    });
  });

  const trialBalanceRows = Object.entries(trialBalanceMap).map(([code, data]) => ({
    accountCode: code,
    ...data,
  }));

  const totalTbDebits = trialBalanceRows.reduce((s, r) => s + r.debits, 0);
  const totalTbCredits = trialBalanceRows.reduce((s, r) => s + r.credits, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Accounting Engine & General Ledger (GL)
          </h1>
          <p className="text-xs text-slate-500">
            Immutable double-entry subledger, balanced journal validation, Chart of Accounts, and Trial Balance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('JOURNALS')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'JOURNALS' ? 'bg-navy-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Journal Entries ({filteredJournals.length})
            </button>
            <button
              onClick={() => setActiveTab('TRIAL_BALANCE')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'TRIAL_BALANCE' ? 'bg-navy-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trial Balance
            </button>
            <button
              onClick={() => setActiveTab('COA')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'COA' ? 'bg-navy-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chart of Accounts
            </button>
          </div>
        </div>
      </div>

      {/* Double Entry Status Banner */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-emerald-950 font-mono">
        <div className="flex items-center gap-2.5">
          <Scale className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <p className="font-bold font-sans text-emerald-900">Double-Entry Accounting Invariant Enforced:</p>
            <p className="text-emerald-800 font-sans text-[11px]">
              Every financial transaction generates matching debit and credit leg entries. Out-of-balance entries cannot be committed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <span>Total Debits: ${totalTbDebits.toLocaleString()}</span>
          <span>=</span>
          <span>Total Credits: ${totalTbCredits.toLocaleString()}</span>
          <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-sans text-[10px]">
            Zero Variance
          </span>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'JOURNALS' && (
        <div className="space-y-4">
          <DataTable
            columns={journalColumns}
            data={filteredJournals}
            searchPlaceholder="Search journal entries by number, event, or reference..."
            searchKey={(j) => `${j.journalNumber} ${j.accountingEventId} ${j.transactionReference}`}
            onRowClick={(row) => setSelectedJournal(row)}
            exportFileName="gcms_journal_entries"
            pageSize={10}
          />

          {/* Journal Entry Detail Inspector */}
          {selectedJournal && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Journal Entry Breakdown: {selectedJournal.journalNumber}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Ref: {selectedJournal.transactionReference} • Value Date: {selectedJournal.valueDate} • Maker: {selectedJournal.makerId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJournal(null)}
                  className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Close Inspector
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">GL Account</th>
                      <th className="px-3 py-2">Account Title</th>
                      <th className="px-3 py-2">Line Description</th>
                      <th className="px-3 py-2 text-right">Debit ({selectedJournal.currency})</th>
                      <th className="px-3 py-2 text-right">Credit ({selectedJournal.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                    {selectedJournal.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="px-3 py-2 font-bold text-navy-900">{line.glAccount}</td>
                        <td className="px-3 py-2 font-sans font-medium text-slate-800">{line.glAccountName}</td>
                        <td className="px-3 py-2 font-sans text-slate-600">{line.description}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {line.debit > 0 ? formatCurrency(line.debit, line.currency) : '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {line.credit > 0 ? formatCurrency(line.credit, line.currency) : '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                      <td colSpan={3} className="px-3 py-2 text-right font-sans">
                        Balanced Entry Totals:
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-800">
                        {formatCurrency(selectedJournal.totalDebit, selectedJournal.currency)}
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-800">
                        {formatCurrency(selectedJournal.totalCredit, selectedJournal.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'TRIAL_BALANCE' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              General Ledger Trial Balance Report
            </h2>
            <span className="text-xs font-mono text-slate-500">Effective Date: 2026-11-05</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Account Code</th>
                  <th className="px-4 py-3">Account Description</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3 text-right">Debit Balance</th>
                  <th className="px-4 py-3 text-right">Credit Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                {trialBalanceRows.map((r) => (
                  <tr key={r.accountCode} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-bold text-navy-900">{r.accountCode}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-900">{r.name}</td>
                    <td className="px-4 py-2.5 font-sans">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                      {r.debits > 0 ? `$${r.debits.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                      {r.credits > 0 ? `$${r.credits.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                  <td colSpan={3} className="px-4 py-3 font-sans text-right">
                    Trial Balance Sum:
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-800 font-bold">
                    ${totalTbDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-800 font-bold">
                    ${totalTbCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'COA' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Standard Chart of Accounts (COA) Registry
            </h2>
            <span className="text-xs font-mono text-slate-500">Global Holding Master Template</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">GL Account Code</th>
                  <th className="px-4 py-3">Account Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Financial Type</th>
                  <th className="px-4 py-3">Base Currency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {chartOfAccounts.map((coa) => (
                  <tr key={coa.accountCode} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-mono font-bold text-navy-900">{coa.accountCode}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{coa.accountName}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                        {coa.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{coa.type}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-600">{coa.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
