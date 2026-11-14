import React, { useState } from 'react';
import {
  Briefcase,
  AlertTriangle,
  Clock,
  CheckCircle2,
  User,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { OperationsTask } from '../../types/treasury';

interface OperationsWorkbenchProps {
  onNavigate: (module: string) => void;
}

export const OperationsWorkbenchView: React.FC<OperationsWorkbenchProps> = ({ onNavigate }) => {
  const { operationsTasks, resolveOperationsTask, entities } = useTreasury();

  const [selectedTask, setSelectedTask] = useState<OperationsTask | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleResolve = () => {
    if (!selectedTask) return;
    resolveOperationsTask(selectedTask.id, resolutionNotes || 'Investigated and resolved by operator');
    setResolveModalOpen(false);
    setSelectedTask(null);
    setResolutionNotes('');
    setNotification(`Task ${selectedTask.id} marked as RESOLVED.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const columns: Column<OperationsTask>[] = [
    {
      key: 'id',
      header: 'Task ID & Type',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{row.id}</span>
          <div className="text-[10px] text-slate-500">{row.taskType.replace(/_/g, ' ')}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <StatusBadge status={row.priority} size="sm" />,
    },
    {
      key: 'entity',
      header: 'Legal Entity',
      render: (row) => {
        const ent = entities.find((e) => e.id === row.entityId);
        return <span className="font-medium text-slate-800">{ent?.code || row.entityId}</span>;
      },
    },
    {
      key: 'amount',
      header: 'Amount Impact',
      render: (row) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(row.amount, row.currency)}
        </div>
      ),
    },
    {
      key: 'operator',
      header: 'Assigned Operator',
      render: (row) => (
        <div className="text-xs text-slate-700">
          <span className="font-medium">{row.assignedOperator.split('(')[0]}</span>
        </div>
      ),
    },
    {
      key: 'slaDueDate',
      header: 'SLA Due Date',
      render: (row) => (
        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{row.slaDueDate.slice(11, 16)} UTC</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Task Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      sortable: false,
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          {row.status !== 'RESOLVED' && row.status !== 'CLOSED' ? (
            <button
              onClick={() => {
                setSelectedTask(row);
                setResolveModalOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-navy-900 rounded hover:bg-navy-800 transition"
            >
              Investigate & Resolve
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Resolved
            </span>
          )}
        </div>
      ),
    },
  ];

  const pendingTasks = operationsTasks.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  const criticalTasks = pendingTasks.filter((t) => t.priority === 'CRITICAL');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Treasury Operations Workbench & Task Inbox
          </h1>
          <p className="text-xs text-slate-500">
            Operational triage, exception investigations, manual matching interventions, and SLA escalation tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
            {pendingTasks.length} Active Operational Tasks
          </span>
        </div>
      </div>

      {notification && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Critical SLA Alert Banner */}
      {criticalTasks.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              High-Severity Operations Alert: {criticalTasks.length} Critical Task(s) Requiring Immediate Attention
            </h3>
            <p className="text-xs text-rose-800 mt-0.5">
              Nostro statement variances and cutoff deadlines approaching within 90 minutes.
            </p>
          </div>
        </div>
      )}

      {/* Tasks Table */}
      <DataTable
        columns={columns}
        data={operationsTasks}
        searchPlaceholder="Search tasks by ID, type, operator, reference..."
        searchKey={(t) => `${t.id} ${t.taskType} ${t.assignedOperator} ${t.referenceId} ${t.description}`}
        onRowClick={(row) => setSelectedTask(row)}
        exportFileName="gcms_operations_tasks"
        pageSize={10}
      />

      {/* Task Investigation & Resolution Modal */}
      {selectedTask && (
        <Modal
          isOpen={resolveModalOpen}
          onClose={() => setResolveModalOpen(false)}
          title={`Investigate Task: ${selectedTask.id}`}
          subtitle={`Type: ${selectedTask.taskType} • Priority: ${selectedTask.priority}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5">
              <p className="font-semibold text-slate-800">Task Narrative & Evidence:</p>
              <p className="text-slate-600">{selectedTask.description}</p>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-[11px] font-mono text-slate-500">
                <span>Ref ID: {selectedTask.referenceId}</span>
                <span>Impact: {formatCurrency(selectedTask.amount, selectedTask.currency)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Operational Resolution Notes & Action Summary
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail resolution (e.g., Cross-referenced with SWIFT pacs.008, confirmed fee advice with correspondent desk...)"
                className="w-full rounded-md border border-slate-300 p-2 text-slate-900"
                required
              />
            </div>

            <div className="flex justify-between items-center border-t border-slate-200 pt-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResolveModalOpen(false);
                    onNavigate('cash-adjustment');
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded"
                >
                  Create Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResolveModalOpen(false);
                    onNavigate('payment-matching');
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded"
                >
                  Go to Matching
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolve}
                  className="px-4 py-1.5 bg-navy-900 text-white font-semibold rounded hover:bg-navy-800"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
