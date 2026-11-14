import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  AlertCircle,
  Clock,
  Check,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { CashRealignment, RealignmentType, RealignmentPriority } from '../../types/treasury';
import { convertFx } from '../../services/financialMath';

export const CashRealignmentView: React.FC = () => {
  const {
    realignments,
    bankAccounts,
    entities,
    fxRates,
    currentUser,
    createRealignment,
    submitRealignment,
    approveRealignment,
    executeRealignment,
    rejectRealignment,
  } = useTreasury();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CashRealignment | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Proposal Form State
  const [sourceAccId, setSourceAccId] = useState(bankAccounts[0]?.id || '');
  const [destAccId, setDestAccId] = useState(bankAccounts[1]?.id || '');
  const [amount, setAmount] = useState<number>(1000000);
  const [realignmentType, setRealignmentType] = useState<RealignmentType>('INTERCOMPANY_TRANSFER');
  const [priority, setPriority] = useState<RealignmentPriority>('HIGH');
  const [reason, setReason] = useState('Routine end-of-day concentration & deficit funding');

  const sourceAcc = bankAccounts.find((a) => a.id === sourceAccId);
  const destAcc = bankAccounts.find((a) => a.id === destAccId);

  // Calculate live FX preview
  const fxPreview = sourceAcc && destAcc ? convertFx(amount, sourceAcc.currency, destAcc.currency, fxRates) : null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = createRealignment({
      sourceAccountId: sourceAccId,
      destinationAccountId: destAccId,
      amount: Number(amount),
      realignmentType,
      priority,
      reason,
    });

    if (res.success) {
      setIsModalOpen(false);
      setSuccessMessage('Realignment proposal submitted successfully for checker approval.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(res.error || 'Failed to create realignment');
    }
  };

  const handleApprove = (id: string) => {
    setErrorMessage(null);
    const res = approveRealignment(id);
    if (!res.success) {
      setErrorMessage(res.error || 'Approval rejected.');
    } else {
      setSuccessMessage('Realignment approved by checker.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleExecute = (id: string) => {
    setErrorMessage(null);
    const res = executeRealignment(id);
    if (!res.success) {
      setErrorMessage(res.error || 'Execution failed.');
    } else {
      setSuccessMessage('Realignment successfully executed! Account balances adjusted and balanced GL journal posted.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleReject = () => {
    if (!selectedItem) return;
    rejectRealignment(selectedItem.id, rejectionReason || 'Realigned rejected by checker.');
    setRejectModalOpen(false);
    setSelectedItem(null);
    setRejectionReason('');
  };

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const columns: Column<CashRealignment>[] = [
    {
      key: 'id',
      header: 'Realignment ID',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{row.id}</span>
          <div className="text-[10px] text-slate-500">{row.realignmentType.replace(/_/g, ' ')}</div>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source Account',
      render: (row) => {
        const acc = bankAccounts.find((a) => a.id === row.sourceAccountId);
        return (
          <div>
            <div className="font-medium text-slate-800">{acc?.accountName || row.sourceAccountId}</div>
            <div className="text-[10px] text-slate-500 font-mono">
              Avail: {formatCurrency(row.sourceAvailableBalance, row.sourceCurrency)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'destination',
      header: 'Destination Account',
      render: (row) => {
        const acc = bankAccounts.find((a) => a.id === row.destinationAccountId);
        return (
          <div>
            <div className="font-medium text-slate-800">{acc?.accountName || row.destinationAccountId}</div>
            <div className="text-[10px] text-slate-500 font-mono">{acc?.iban}</div>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Transfer Amount',
      render: (row) => (
        <div className="text-right">
          <div className="font-mono font-bold text-slate-900">
            {formatCurrency(row.amount, row.sourceCurrency)}
          </div>
          {row.sourceCurrency !== row.destinationCurrency && (
            <div className="text-[10px] text-teal-700 font-mono">
              ≈ {formatCurrency(row.convertedAmount, row.destinationCurrency)} (FX {row.fxRate})
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <StatusBadge status={row.priority} size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'makerChecker',
      header: 'Maker / Checker',
      render: (row) => (
        <div className="text-[11px] text-slate-600">
          <div>M: {row.makerName}</div>
          <div className="text-slate-400">C: {row.checkerName || 'Pending sign-off'}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.status === 'PROPOSED' && (
            <>
              <button
                onClick={() => handleApprove(row.id)}
                className="px-2 py-1 text-xs font-medium text-white bg-emerald-700 rounded hover:bg-emerald-800 transition"
                title="Approve Proposal (Checker)"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setSelectedItem(row);
                  setRejectModalOpen(true);
                }}
                className="px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition"
                title="Reject Proposal"
              >
                Reject
              </button>
            </>
          )}

          {row.status === 'APPROVED' && (
            <button
              onClick={() => handleExecute(row.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-navy-900 rounded hover:bg-navy-800 transition shadow-2xs"
              title="Execute & Post GL Journal"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Execute</span>
            </button>
          )}

          {row.status === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Posted
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Proposal Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Cash Realignment & Liquidity Sweeps
          </h1>
          <p className="text-xs text-slate-500">
            Automated multi-currency cash redistribution, intercompany transfers, and segregation-of-duties maker-checker controls
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition shadow-xs"
        >
          <Plus className="w-4 h-4 text-teal-300" />
          <span>New Realignment Proposal</span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* Maker-Checker Role Banner */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs">
            {currentUser.name.slice(0, 1)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              Active Session: {currentUser.name} ({currentUser.role})
            </p>
            <p className="text-slate-500">
              {currentUser.canApprove
                ? `Checker Authority: Can approve realignments up to $${currentUser.approvalThresholdUSD.toLocaleString()} USD (excluding self-created items).`
                : 'Maker Persona: Can draft and propose realignments. Segregation of duties prevents self-approval.'}
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-[11px] text-slate-500">
          Maker cannot approve own transaction • Dual Authorization Enforced
        </div>
      </div>

      {/* Realignments Table */}
      <DataTable
        columns={columns}
        data={realignments}
        searchPlaceholder="Search by realignment ID, accounts, reason..."
        searchKey={(r) => `${r.id} ${r.sourceAccountId} ${r.destinationAccountId} ${r.reason}`}
        onRowClick={(row) => setSelectedItem(row)}
        exportFileName="gcms_cash_realignments"
        pageSize={10}
      />

      {/* Create Proposal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Cash Realignment Proposal"
        subtitle="Initiate intercompany or inter-account transfer with real-time FX calculation"
        maxWidth="xl"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Source Bank Account</label>
              <select
                value={sourceAccId}
                onChange={(e) => setSourceAccId(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white font-medium text-slate-900"
                required
              >
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} ({a.currency} • Avail: {a.availableBalance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Destination Bank Account</label>
              <select
                value={destAccId}
                onChange={(e) => setDestAccId(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white font-medium text-slate-900"
                required
              >
                {bankAccounts
                  .filter((a) => a.id !== sourceAccId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} ({a.currency})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Transfer Amount ({sourceAcc?.currency || 'USD'})
              </label>
              <input
                type="number"
                min="1000"
                step="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 p-2 font-mono font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Realignment Type</label>
              <select
                value={realignmentType}
                onChange={(e) => setRealignmentType(e.target.value as RealignmentType)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-900"
              >
                <option value="INTERCOMPANY_TRANSFER">Intercompany Transfer</option>
                <option value="ACCOUNT_TO_ACCOUNT">Account to Account</option>
                <option value="PARENT_TO_CHILD">Parent to Child</option>
                <option value="CHILD_TO_PARENT">Child to Parent</option>
                <option value="CROSS_BORDER">Cross Border</option>
                <option value="LIQUIDITY_POOL_REALIGNMENT">Liquidity Pool Realignment</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RealignmentPriority)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-900"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* FX Conversion Preview */}
          {fxPreview && sourceAcc && destAcc && (
            <div className="rounded-lg bg-teal-50/70 border border-teal-200 p-3 space-y-1 font-mono text-[11px] text-teal-950">
              <div className="flex justify-between">
                <span>Direct / Cross FX Rate:</span>
                <span className="font-bold">1 {sourceAcc.currency} = {fxPreview.rateUsed} {destAcc.currency}</span>
              </div>
              <div className="flex justify-between font-bold text-teal-900 text-xs">
                <span>Estimated Destination Credit:</span>
                <span>{formatCurrency(fxPreview.convertedAmount, destAcc.currency)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business Justification / Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Funding vendor disbursements due next business day"
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
              Submit for Checker Approval
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Realignment Proposal"
        subtitle={`Provide regulatory reason for rejecting ${selectedItem?.id}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Rejection</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="State reason (e.g., Exceeds intercompany bilateral limit, incorrect value date...)"
              className="w-full rounded-md border border-slate-300 p-2 text-slate-900"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-medium hover:bg-rose-800"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
