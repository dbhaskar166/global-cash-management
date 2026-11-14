import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Filter,
  Printer,
  Calendar,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { convertFx } from '../../services/financialMath';
import { ArchitectureBlueprintViewer } from './ArchitectureBlueprintViewer';

interface ReportDefinition {
  id: string;
  name: string;
  category: 'CASH_POSITION' | 'OPERATIONS' | 'ACCOUNTING' | 'RECONCILIATION' | 'ARCHITECTURE';
  description: string;
}

const REPORT_CATALOG: ReportDefinition[] = [
  {
    id: 'RPT-ARCH',
    name: 'GCMS Enterprise Architecture & Domain-Driven Design (DDD) Blueprint',
    category: 'ARCHITECTURE',
    description: 'Comprehensive 16-deliverable enterprise specification: Strategic & Tactical DDD, 22 Bounded Contexts, Microservices, Sagas, Double-Entry GL, and ADRs',
  },
  { id: 'RPT-01', name: 'Global Consolidated Cash Position Report', category: 'CASH_POSITION', description: 'Consolidated balances across all 15 multinational entities and 30 bank accounts' },
  { id: 'RPT-02', name: 'Daily Multi-Currency Cash Position Report', category: 'CASH_POSITION', description: 'Currencies breakdown with real-time foreign exchange valuation' },
  { id: 'RPT-03', name: 'Intraday Value-Dated Cash Report', category: 'CASH_POSITION', description: 'Cleared vs unsettled intraday cash balances per banking calendar' },
  { id: 'RPT-04', name: 'Cash Position by Legal Entity & Region', category: 'CASH_POSITION', description: 'Breakdown by parent holding and child operating entities' },
  { id: 'RPT-05', name: 'Cash Realignment & Sweep Execution Audit', category: 'OPERATIONS', description: 'Comprehensive log of all intercompany sweeps and maker-checker approvals' },
  { id: 'RPT-06', name: 'Cash Funding & Liquidity Deficit Report', category: 'OPERATIONS', description: 'Deficit identification, overnight funding, and pool replenishment' },
  { id: 'RPT-07', name: 'Free Cash & Yield Optimization Summary', category: 'OPERATIONS', description: 'Idle, trapped, and investable liquidity allocations' },
  { id: 'RPT-08', name: 'Cash Flow Forecast vs Actual Variance Report', category: 'OPERATIONS', description: 'Comparison of scheduled receivables and payables against statement credits' },
  { id: 'RPT-09', name: 'Payment Matching & Clearing Performance Report', category: 'RECONCILIATION', description: 'Match rates, rule engine performance, and manual matching evidence' },
  { id: 'RPT-10', name: 'Bank Statement Reconciliation Breaks Report', category: 'RECONCILIATION', description: 'Outstanding exceptions, bank fee adjustments, and timing differences' },
  { id: 'RPT-11', name: 'Nostro Correspondent Bank Balances Report', category: 'RECONCILIATION', description: 'External clearing account balances and correspondent charges' },
  { id: 'RPT-12', name: 'General Ledger Trial Balance Report', category: 'ACCOUNTING', description: 'Double-entry trial balance with debits and credits verification' },
  { id: 'RPT-13', name: 'Cash Adjustment & Reversal Journal Report', category: 'ACCOUNTING', description: 'Immutable fee adjustments, interest credits, and reversal entries' },
  { id: 'RPT-14', name: 'Intercompany Bilateral Cash Matrix', category: 'OPERATIONS', description: 'Internal borrowing and lending obligations across global entities' },
];

export const ReportingAnalyticsView: React.FC = () => {
  const { bankAccounts, entities, fxRates, selectedCurrency, realignments, fundings, journalEntries } = useTreasury();

  const [selectedReportId, setSelectedReportId] = useState<string>('RPT-01');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const selectedReport = REPORT_CATALOG.find((r) => r.id === selectedReportId) || REPORT_CATALOG[0];

  const formatCurrency = (val: number, ccy: string = selectedCurrency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const toBase = (amount: number, ccy: string) => {
    return convertFx(amount, ccy as any, selectedCurrency, fxRates).convertedAmount;
  };

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (selectedReport.category === 'ARCHITECTURE') {
      // Direct download of the comprehensive architecture blueprint markdown document
      fetch('/api/v1/architecture-blueprint')
        .then((res) => res.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'GCMS_ENTERPRISE_ARCHITECTURE_DDD_BLUEPRINT.md';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        })
        .catch(() => {
          window.open('/docs/GCMS_ENTERPRISE_ARCHITECTURE_DDD_BLUEPRINT.md', '_blank');
        });
      return;
    }

    if (selectedReport.category === 'CASH_POSITION') {
      headers = ['Account Name', 'IBAN', 'Entity', 'Currency', 'Book Balance', `Equivalent in ${selectedCurrency}`];
      rows = bankAccounts.map((a) => {
        const ent = entities.find((e) => e.id === a.entityId);
        return [
          `"${a.accountName}"`,
          `"${a.iban}"`,
          `"${ent?.name || a.entityId}"`,
          `"${a.currency}"`,
          `"${a.bookBalance}"`,
          `"${toBase(a.bookBalance, a.currency)}"`,
        ];
      });
    } else if (selectedReport.category === 'OPERATIONS') {
      headers = ['Realignment ID', 'Type', 'Amount', 'Currency', 'Status', 'Maker', 'Checker', 'Reason'];
      rows = realignments.map((r) => [
        `"${r.id}"`,
        `"${r.realignmentType}"`,
        `"${r.amount}"`,
        `"${r.sourceCurrency}"`,
        `"${r.status}"`,
        `"${r.makerName}"`,
        `"${r.checkerName || '-'}"`,
        `"${r.reason}"`,
      ]);
    } else {
      headers = ['Journal #', 'Event ID', 'Reference', 'Currency', 'Total Debit', 'Total Credit', 'Status'];
      rows = journalEntries.map((j) => [
        `"${j.journalNumber}"`,
        `"${j.accountingEventId}"`,
        `"${j.transactionReference}"`,
        `"${j.currency}"`,
        `"${j.totalDebit}"`,
        `"${j.totalCredit}"`,
        `"${j.postingStatus}"`,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReport.id}_${selectedReport.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCatalog = REPORT_CATALOG.filter((r) => {
    if (filterCategory === 'ALL') return true;
    return r.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Title & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Reporting & Treasury Analytics Platform
          </h1>
          <p className="text-xs text-slate-500">
            Comprehensive suite of standardized corporate banking reports, executive summaries, and regulatory audit extracts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Report (CSV)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Report Catalog Selector */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Report Catalog ({filteredCatalog.length})
            </h2>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="ARCHITECTURE">Enterprise Architecture</option>
              <option value="CASH_POSITION">Cash Position</option>
              <option value="OPERATIONS">Operations</option>
              <option value="RECONCILIATION">Reconciliation</option>
              <option value="ACCOUNTING">Accounting</option>
            </select>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredCatalog.map((rpt) => (
              <button
                key={rpt.id}
                onClick={() => setSelectedReportId(rpt.id)}
                className={`w-full text-left rounded-lg p-2.5 transition text-xs ${
                  selectedReportId === rpt.id
                    ? 'bg-navy-900 text-white font-semibold shadow-2xs'
                    : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono ${selectedReportId === rpt.id ? 'text-teal-300' : 'text-slate-400'}`}>
                    {rpt.id}
                  </span>
                  <span className={`text-[9px] font-mono px-1 rounded ${selectedReportId === rpt.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {rpt.category}
                  </span>
                </div>
                <p className="mt-1 font-medium leading-tight">{rpt.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live Rendered Report Document or Architecture Blueprint */}
        <div className="lg:col-span-8">
          {selectedReport.category === 'ARCHITECTURE' ? (
            <ArchitectureBlueprintViewer />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              {/* Document Header */}
              <div className="border-b border-slate-200 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      OFFICIAL TREASURY REPORT • {selectedReport.id}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedReport.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedReport.description}</p>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-500">
                    <div>Date: 2026-11-05</div>
                    <div>Base Currency: {selectedCurrency}</div>
                    <div className="text-emerald-700 font-bold">Status: Certified</div>
                  </div>
                </div>
              </div>

              {/* Render Data Rows */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="px-3 py-2.5">Account / Item</th>
                      <th className="px-3 py-2.5">Institution / Ref</th>
                      <th className="px-3 py-2.5">Currency</th>
                      <th className="px-3 py-2.5 text-right">Native Balance</th>
                      <th className="px-3 py-2.5 text-right font-bold text-navy-900">
                        Equivalent in {selectedCurrency}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                    {bankAccounts.slice(0, 10).map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 font-sans font-medium text-slate-900">{a.accountName}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-sans">{a.bankName}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-700">{a.currency}</td>
                        <td className="px-3 py-2.5 text-right">{formatCurrency(a.bookBalance, a.currency)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-navy-900">
                          {formatCurrency(toBase(a.bookBalance, a.currency), selectedCurrency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Showing top 10 consolidated positions. Click "Export Report (CSV)" for full multi-entity dataset.</span>
                <span className="font-mono text-slate-400">GCMS Reporting Engine v2.4</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
