import React, { useState } from 'react';
import {
  GitCompare,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Check,
  Link,
  Unlink,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { StatusBadge } from '../common/StatusBadge';
import { PaymentTransaction, BankStatementLine } from '../../types/treasury';

export const PaymentMatchingView: React.FC = () => {
  const {
    payments,
    statementLines,
    matchPaymentManually,
    unmatchPayment,
    runAutoPaymentMatching,
  } = useTreasury();

  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const handleRunAutoMatch = () => {
    const res = runAutoPaymentMatching();
    setNotification(`Auto-matching engine completed: Successfully paired ${res.matchedCount} transaction(s).`);
    setTimeout(() => setNotification(null), 4500);
  };

  const handleManualMatch = () => {
    if (!selectedPaymentId || !selectedStatementId) return;
    const res = matchPaymentManually(selectedPaymentId, selectedStatementId);
    if (res.success) {
      setNotification('Manual pairing successful. Transactions reconciled.');
      setSelectedPaymentId(null);
      setSelectedStatementId(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleUnmatch = (paymentId: string) => {
    const res = unmatchPayment(paymentId);
    if (res.success) {
      setNotification('Transaction unlinked. Match reversed to UNMATCHED.');
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const visiblePayments = payments.filter((p) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'UNMATCHED') return p.matchStatus === 'UNMATCHED' || p.matchStatus === 'POTENTIAL_MATCH';
    if (filterStatus === 'MATCHED') return p.matchStatus === 'MATCHED' || p.matchStatus === 'MANUALLY_MATCHED';
    return true;
  });

  const selectedPayment = payments.find((p) => p.id === selectedPaymentId);
  const selectedStatement = statementLines.find((s) => s.id === selectedStatementId);

  return (
    <div className="space-y-6">
      {/* Title & Engine Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Real-Time Payment Matching & Clearing Engine
          </h1>
          <p className="text-xs text-slate-500">
            Automated and manual reconciliation of SWIFT pacs.008, Fedwire, and ERP instructions against camt.053 bank statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAutoMatch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition shadow-xs"
          >
            <Zap className="w-4 h-4 text-teal-200" />
            <span>Run Automated Matching Engine</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Manual Matching Workbench (Side-by-Side Comparison) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Side-by-Side Manual Matching Workbench</h2>
            <p className="text-xs text-slate-500">
              Select one Internal Payment and one Bank Statement Line from the columns below to confirm manual match
            </p>
          </div>

          <button
            disabled={!selectedPaymentId || !selectedStatementId}
            onClick={handleManualMatch}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            <Link className="w-4 h-4 text-teal-300" />
            <span>Confirm Manual Pairing</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column: Internal Payments */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 flex flex-col h-96">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Internal Payment Instructions ({visiblePayments.length})
              </span>
              <span className="text-[11px] font-mono text-slate-500">SWIFT / Fedwire / ERP</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {visiblePayments.map((pmt) => {
                const isSelected = selectedPaymentId === pmt.id;
                const isMatched = pmt.matchStatus === 'MATCHED' || pmt.matchStatus === 'MANUALLY_MATCHED';
                return (
                  <div
                    key={pmt.id}
                    onClick={() => !isMatched && setSelectedPaymentId(isSelected ? null : pmt.id)}
                    className={`rounded-lg border p-2.5 transition text-xs ${
                      isSelected
                        ? 'border-navy-900 bg-navy-50 ring-2 ring-navy-900/20'
                        : isMatched
                        ? 'border-slate-200 bg-slate-100/70 opacity-60'
                        : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{pmt.businessReference}</span>
                      <StatusBadge status={pmt.matchStatus} size="sm" />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-slate-600">
                      <span>{pmt.creditorName}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(pmt.amount, pmt.currency)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>UETR: {pmt.uetr.slice(0, 16)}...</span>
                      <span>Val: {pmt.valueDate}</span>
                    </div>

                    {isMatched && (
                      <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between items-center text-[10px]">
                        <span className="text-emerald-700 font-semibold">Matched with Stmt</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmatch(pmt.id);
                          }}
                          className="text-rose-600 hover:underline font-sans"
                        >
                          Unlink Match
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Bank Statement Lines */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 flex flex-col h-96">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Ingested Bank Statement Lines ({statementLines.length})
              </span>
              <span className="text-[11px] font-mono text-slate-500">camt.053 / MT940</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {statementLines.map((stmt) => {
                const isSelected = selectedStatementId === stmt.id;
                const isMatched = stmt.matchStatus === 'MATCHED' || stmt.matchStatus === 'MANUALLY_MATCHED';
                return (
                  <div
                    key={stmt.id}
                    onClick={() => !isMatched && setSelectedStatementId(isSelected ? null : stmt.id)}
                    className={`rounded-lg border p-2.5 transition text-xs ${
                      isSelected
                        ? 'border-navy-900 bg-navy-50 ring-2 ring-navy-900/20'
                        : isMatched
                        ? 'border-slate-200 bg-slate-100/70 opacity-60'
                        : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{stmt.transactionReference}</span>
                      <StatusBadge status={stmt.matchStatus} size="sm" />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-slate-600">
                      <span className="truncate max-w-[200px]">{stmt.counterparty}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {stmt.direction === 'DEBIT' ? '-' : '+'}
                        {formatCurrency(stmt.amount, stmt.currency)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="truncate max-w-[200px]">{stmt.narrative}</span>
                      <span>Val: {stmt.valueDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pairing Comparison Tray */}
        {(selectedPayment || selectedStatement) && (
          <div className="mt-4 rounded-lg bg-teal-50 border border-teal-200 p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-teal-800">Selected Payment</p>
                <p className="font-bold text-teal-950 font-mono">
                  {selectedPayment ? `${selectedPayment.businessReference} (${formatCurrency(selectedPayment.amount, selectedPayment.currency)})` : 'None selected'}
                </p>
              </div>

              <div className="h-6 w-px bg-teal-300"></div>

              <div>
                <p className="text-[10px] uppercase font-bold text-teal-800">Selected Statement Line</p>
                <p className="font-bold text-teal-950 font-mono">
                  {selectedStatement ? `${selectedStatement.transactionReference} (${formatCurrency(selectedStatement.amount, selectedStatement.currency)})` : 'None selected'}
                </p>
              </div>
            </div>

            {selectedPayment && selectedStatement && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-teal-900">
                  Amount Delta: {formatCurrency(Math.abs(selectedPayment.amount - selectedStatement.amount), selectedPayment.currency)}
                </span>
                <button
                  onClick={handleManualMatch}
                  className="px-3 py-1 bg-teal-800 text-white rounded font-medium hover:bg-teal-900 shadow-2xs"
                >
                  Pair & Reconcile
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
