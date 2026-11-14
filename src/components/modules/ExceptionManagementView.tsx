import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Filter,
  Check,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { SystemException } from '../../types/treasury';

export const ExceptionManagementView: React.FC = () => {
  const { exceptions, resolveException } = useTreasury();

  const [selectedExc, setSelectedExc] = useState<SystemException | null>(null);
  const [rootCause, setRootCause] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleResolve = () => {
    if (!selectedExc) return;
    resolveException(selectedExc.id, rootCause || 'Root cause investigated', resolutionSummary || 'Resolved per operational procedure');
    setIsModalOpen(false);
    setSelectedExc(null);
    setRootCause('');
    setResolutionSummary('');
    setNotification(`Exception ${selectedExc.id} resolved successfully.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const columns: Column<SystemException>[] = [
    {
      key: 'id',
      header: 'Exception ID',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{row.id}</span>
          <div className="text-[10px] text-slate-500">{row.exceptionType.replace(/_/g, ' ')}</div>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (row) => <StatusBadge status={row.severity} size="sm" />,
    },
    {
      key: 'amount',
      header: 'Exposure Amount',
      render: (row) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(row.amount, row.currency)}
        </div>
      ),
    },
    {
      key: 'slaStatus',
      header: 'SLA Status',
      render: (row) => <StatusBadge status={row.slaStatus} size="sm" />,
    },
    {
      key: 'assignedTo',
      header: 'Assigned Specialist',
      render: (row) => <span className="font-medium text-slate-800">{row.assignedTo}</span>,
    },
    {
      key: 'status',
      header: 'Resolution Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      sortable: false,
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          {row.status !== 'RESOLVED' ? (
            <button
              onClick={() => {
                setSelectedExc(row);
                setIsModalOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-navy-900 rounded hover:bg-navy-800 transition"
            >
              Resolve
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Closed
            </span>
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
            Exception Management & Root-Cause Triage
          </h1>
          <p className="text-xs text-slate-500">
            Systematic tracking of payment breaks, balance variances, limit breaches, and SLA non-conformances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md">
            {exceptions.filter((e) => e.status !== 'RESOLVED').length} Open Exceptions
          </span>
        </div>
      </div>

      {notification && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Exceptions DataTable */}
      <DataTable
        columns={columns}
        data={exceptions}
        searchPlaceholder="Search exceptions by ID, type, reference, specialist..."
        searchKey={(e) => `${e.id} ${e.exceptionType} ${e.assignedTo} ${e.referenceId}`}
        onRowClick={(row) => setSelectedExc(row)}
        exportFileName="gcms_system_exceptions"
        pageSize={10}
      />

      {/* Resolve Exception Modal */}
      {selectedExc && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Resolve Exception: ${selectedExc.id}`}
          subtitle={`Type: ${selectedExc.exceptionType} • Severity: ${selectedExc.severity}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Root Cause Analysis</label>
              <textarea
                rows={2}
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="Identify underlying root cause (e.g. Unannounced clearing surcharge, missing remittance advice...)"
                className="w-full rounded-md border border-slate-300 p-2 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corrective Action Taken</label>
              <textarea
                rows={2}
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                placeholder="Summary of operational resolution applied"
                className="w-full rounded-md border border-slate-300 p-2 text-slate-900"
                required
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolve}
                className="px-4 py-1.5 bg-navy-900 text-white font-semibold rounded hover:bg-navy-800"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
