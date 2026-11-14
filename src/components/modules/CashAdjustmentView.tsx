import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  Check,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { CashAdjustment, AdjustmentType } from '../../types/treasury';

export const CashAdjustmentView: React.FC = () => {
  const {
    adjustments,
    bankAccounts,
    currentUser,
    createAdjustment,
    approveAdjustment,
    postAdjustment,
    reverseAdjustment,
  } = useTreasury();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [selectedAdj, setSelectedAdj] = useState<CashAdjustment | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Adjustment Form State
  const [accId, setAccId] = useState(bankAccounts[0]?.id || '');
  const [adjType, setAdjType] = useState<AdjustmentType>('BANK_FEE');
  const [direction, setDirection] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [amount, setAmount] = useState<number>(25000);
  const [reason, setReason] = useState('Reconciliation fee adjustment per bank statement');
  const [refTxn, setRefTxn] = useState('STMT-ADJ-REF-01');

  const targetAcc = bankAccounts.find((a) => a.id === accId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = createAdjustment({
      accountId: accId,
      adjustmentType: adjType,
      direction,
      amount: Number(amount),
      reason,
      referenceTransaction: refTxn,
      supportingDocName: 'Supporting_Documentation_Audit.pdf',
    });

    if (res.success) {
      setIsModalOpen(false);
      setSuccessMessage('Adjustment created and queued for checker approval.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(res.error || 'Failed to create adjustment');
    }
  };

  const handleApprove = (id: string) => {
    setErrorMessage(null);
    const res = approveAdjustment(id);
    if (!res.success) setErrorMessage(res.error || 'Approval failed');
    else {
      setSuccessMessage('Adjustment approved by checker.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handlePost = (id: string) => {
    setErrorMessage(null);
    const res = postAdjustment(id);
    if (!res.success) setErrorMessage(res.error || 'Posting failed');
    else {
      setSuccessMessage('Adjustment posted: Bank balance updated and balanced general ledger journal generated.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleConfirmReversal = () => {
    if (!selectedAdj) return;
    setErrorMessage(null);

    const res = reverseAdjustment(selectedAdj.id, reversalReason || 'Correction of prior accounting period entry');
    if (!res.success) {
      setErrorMessage(res.error || 'Reversal failed');
    } else {
      setSuccessMessage(`Adjustment ${selectedAdj.id} reversed with immutable reversing journal.`);
      setReverseModalOpen(false);
      setSelectedAdj(null);
      setReversalReason('');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const columns: Column<CashAdjustment>[] = [
    {
      key: 'id',
      header: 'Adjustment ID',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{row.id}</span>
          <div className="text-[10px] text-slate-500">{row.adjustmentType.replace(/_/g, ' ')}</div>
        </div>
      ),
    },
    {
      key: 'account',
      header: 'Account & IBAN',
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
      header: 'Direction',
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
      header: 'Adjustment Amount',
      render: (row) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(row.amount, row.currency)}
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason / Ref',
      render: (row) => (
        <div className="max-w-[200px] truncate" title={row.reason}>
          <div className="text-slate-800 font-medium">{row.reason}</div>
          <div className="text-[10px] text-slate-400 font-mono">{row.referenceTransaction}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.status === 'PENDING_APPROVAL' && (
            <button
              onClick={() => handleApprove(row.id)}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 rounded hover:bg-emerald-800 transition"
            >
              Approve
            </button>
          )}

          {row.status === 'APPROVED' && (
            <button
              onClick={() => handlePost(row.id)}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-navy-900 rounded hover:bg-navy-800 transition"
            >
              Post to GL
            </button>
          )}

          {row.status === 'POSTED' && (
            <button
              onClick={() => {
                setSelectedAdj(row);
                setReverseModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition"
              title="Reverse posted adjustment via immutable reversing entry"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reverse Entry</span>
            </button>
          )}

          {row.status === 'REVERSED' && (
            <span className="text-[11px] font-mono text-slate-400 italic">Reversed in GL</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Cash Adjustment Management
          </h1>
          <p className="text-xs text-slate-500">
            Manual and system-generated balance adjustments, interest/fee postings, and immutable reversal workflows
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition shadow-xs"
        >
          <Plus className="w-4 h-4 text-teal-300" />
          <span>New Cash Adjustment</span>
        </button>
      </div>

      {successMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Accounting Invariant Notice */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 flex items-start gap-3">
        <Shield className="w-5 h-5 text-navy-800 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-900">Strict General Ledger Immutability Rule:</p>
          <p className="text-slate-600 mt-0.5">
            In compliance with Sarbanes-Oxley & IFRS accounting controls, posted adjustments cannot be directly edited or deleted.
            Corrections must be executed strictly through balanced reversal entries preserving complete audit trails.
          </p>
        </div>
      </div>

      {/* Adjustments Table */}
      <DataTable
        columns={columns}
        data={adjustments}
        searchPlaceholder="Search adjustments by ID, account, reason..."
        searchKey={(a) => `${a.id} ${a.accountId} ${a.reason} ${a.adjustmentType}`}
        exportFileName="gcms_cash_adjustments"
        pageSize={10}
      />

      {/* Create Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Cash Balance Adjustment"
        subtitle="Post a fee, interest, or correction adjustment to an account"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Bank Account</label>
            <select
              value={accId}
              onChange={(e) => setAccId(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 bg-white font-medium text-slate-900"
              required
            >
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountName} ({a.currency} • Current Book: {formatCurrency(a.bookBalance, a.currency)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Adjustment Type</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as AdjustmentType)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-900"
              >
                <option value="BANK_FEE">Bank Fee Adjustment</option>
                <option value="INTEREST">Interest Adjustment</option>
                <option value="FX_ADJUSTMENT">FX Revaluation Adjustment</option>
                <option value="SUSPENSE_ACCOUNT">Suspense Account Clearance</option>
                <option value="RECONCILIATION_ADJUSTMENT">Reconciliation Adjustment</option>
                <option value="CORRECTION_ENTRY">Correction Entry</option>
                <option value="INTERCOMPANY">Intercompany Settlement</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Direction</label>
              <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-md">
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="direction"
                    value="DEBIT"
                    checked={direction === 'DEBIT'}
                    onChange={() => setDirection('DEBIT')}
                  />
                  <span>Debit (Reduce Account)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="direction"
                    value="CREDIT"
                    checked={direction === 'CREDIT'}
                    onChange={() => setDirection('CREDIT')}
                  />
                  <span>Credit (Increase Account)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Adjustment Amount ({targetAcc?.currency || 'USD'})
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 p-2 font-mono font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference Transaction / Invoice</label>
              <input
                type="text"
                value={refTxn}
                onChange={(e) => setRefTxn(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 font-mono text-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Adjustment Reason & Audit Justification</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-slate-900"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 font-semibold shadow-xs"
            >
              Submit for Approval
            </button>
          </div>
        </form>
      </Modal>

      {/* Reversal Confirmation Modal */}
      <Modal
        isOpen={reverseModalOpen}
        onClose={() => setReverseModalOpen(false)}
        title="Execute Accounting Reversal Entry"
        subtitle={`Generate immutable balanced reversal for ${selectedAdj?.id}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            This operation will create a mirror reversal journal entry in the General Ledger and revert the account balance.
          </p>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Regulatory Reversal Reason</label>
            <textarea
              rows={3}
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="e.g. Bank credit advice received, reversing prior suspense fee"
              className="w-full rounded-md border border-slate-300 p-2 text-slate-900"
              required
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button
              onClick={() => setReverseModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReversal}
              className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-medium hover:bg-rose-800 shadow-2xs"
            >
              Post Immutable Reversal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
