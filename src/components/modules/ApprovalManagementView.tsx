import React, { useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Clock,
  Check,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { ApprovalRequest } from '../../types/treasury';

export const ApprovalManagementView: React.FC = () => {
  const {
    approvalRequests,
    currentUser,
    approveGenericRequest,
    rejectGenericRequest,
  } = useTreasury();

  const [selectedReq, setSelectedReq] = useState<ApprovalRequest | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleApprove = (id: string) => {
    setErrorMessage(null);
    const res = approveGenericRequest(id);
    if (!res.success) {
      setErrorMessage(res.error || 'Approval rejected by authorization rules.');
    } else {
      setNotification(`Request ${id} approved successfully.`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleConfirmReject = () => {
    if (!selectedReq) return;
    rejectGenericRequest(selectedReq.id, rejectionReason || 'Rejected by checker.');
    setRejectModalOpen(false);
    setSelectedReq(null);
    setRejectionReason('');
    setNotification('Request rejected.');
    setTimeout(() => setNotification(null), 4000);
  };

  const columns: Column<ApprovalRequest>[] = [
    {
      key: 'id',
      header: 'Approval Request ID',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{row.id}</span>
          <div className="text-[10px] text-slate-500 font-mono">Ref: {row.referenceId}</div>
        </div>
      ),
    },
    {
      key: 'workflowType',
      header: 'Workflow Domain',
      render: (row) => (
        <span className="font-mono text-[11px] font-semibold text-navy-900 bg-slate-100 px-2 py-0.5 rounded">
          {row.workflowType.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'entityName',
      header: 'Corporate Entity',
      render: (row) => <span className="font-medium text-slate-800">{row.entityName}</span>,
    },
    {
      key: 'amount',
      header: 'Transaction Value',
      render: (row) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(row.amount, row.currency)}
        </div>
      ),
    },
    {
      key: 'maker',
      header: 'Maker (Initiator)',
      render: (row) => (
        <div className="text-xs text-slate-700">
          <div className="font-medium">{row.makerName}</div>
          <div className="text-[10px] text-slate-400">{row.makerRole}</div>
        </div>
      ),
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (row) => <StatusBadge status={row.urgency} size="sm" />,
    },
    {
      key: 'status',
      header: 'Approval Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Checker Decision',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleApprove(row.id)}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 rounded hover:bg-emerald-800 transition"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setSelectedReq(row);
                  setRejectModalOpen(true);
                }}
                className="px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition"
              >
                Reject
              </button>
            </>
          )}

          {row.status === 'APPROVED' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Approved
            </span>
          )}

          {row.status === 'REJECTED' && (
            <span className="text-[11px] font-mono text-rose-600 font-semibold">Rejected</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Approval Management & Dual Authorization Matrix
          </h1>
          <p className="text-xs text-slate-500">
            Enterprise maker-checker controls, four-eyes principle enforcement, segregation of duties, and delegation ceilings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md">
            {approvalRequests.filter((a) => a.status === 'PENDING').length} Pending Checker Sign-Offs
          </span>
        </div>
      </div>

      {notification && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Segregation of Duties Banner */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs flex items-start gap-3">
        <Shield className="w-5 h-5 text-navy-800 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-900">Four-Eyes Principle / Maker-Checker Policy Enforced:</p>
          <p className="text-slate-600 mt-0.5">
            You are currently operating as <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.role}).
            {currentUser.canApprove
              ? ` You have Checker rights up to $${currentUser.approvalThresholdUSD.toLocaleString()} USD. Note: You cannot approve transactions initiated by your own account.`
              : ' You are currently in Maker role. To approve transactions, switch to a Checker persona (e.g. Sarah Jenkins - Global Treasury Manager) in the top-right header menu.'}
          </p>
        </div>
      </div>

      {/* Approvals Table */}
      <DataTable
        columns={columns}
        data={approvalRequests}
        searchPlaceholder="Filter approvals by ID, entity, maker, workflow..."
        searchKey={(a) => `${a.id} ${a.workflowType} ${a.entityName} ${a.makerName}`}
        exportFileName="gcms_approval_queue"
        pageSize={10}
      />

      {/* Reject Reason Modal */}
      {selectedReq && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title={`Reject Approval Request: ${selectedReq.id}`}
          subtitle={`Workflow: ${selectedReq.workflowType}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Formal Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State rejection rationale..."
                className="w-full rounded-md border border-slate-300 p-2 text-slate-900"
                required
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-rose-700 text-white font-semibold rounded hover:bg-rose-800"
              >
                Reject Transaction
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
