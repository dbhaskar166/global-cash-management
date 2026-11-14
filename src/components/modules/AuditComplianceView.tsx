import React from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Lock,
  Calendar,
  User,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { AuditLogEntry } from '../../types/treasury';

export const AuditComplianceView: React.FC = () => {
  const { auditLogs } = useTreasury();

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp (UTC)',
      render: (row) => (
        <div className="font-mono text-slate-800">
          <div>{row.timestamp.slice(0, 10)}</div>
          <div className="text-[10px] text-slate-400">{row.timestamp.slice(11, 19)} UTC</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action / Event',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-navy-900 text-xs">{row.action}</span>
          <div className="text-[10px] text-slate-500 font-sans">{row.module}</div>
        </div>
      ),
    },
    {
      key: 'operator',
      header: 'Operator & Role',
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-900">{row.userName}</div>
          <div className="text-[10px] text-slate-400">{row.userRole}</div>
        </div>
      ),
    },
    {
      key: 'transactionId',
      header: 'Txn / Correlation Ref',
      render: (row) => (
        <div className="font-mono text-[11px]">
          <div className="text-slate-800 font-bold">{row.transactionId || '-'}</div>
          <div className="text-[10px] text-slate-400">{row.correlationId}</div>
        </div>
      ),
    },
    {
      key: 'afterValue',
      header: 'Audit Trail Details',
      render: (row) => (
        <div className="max-w-[320px] text-xs text-slate-700 truncate" title={row.afterValue}>
          {row.afterValue}
        </div>
      ),
    },
    {
      key: 'sourceIp',
      header: 'Audit Source IP',
      render: (row) => <span className="font-mono text-slate-500 text-[11px]">{row.sourceIp}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Audit Trail & Regulatory Compliance Log
          </h1>
          <p className="text-xs text-slate-500">
            Cryptographically sealed, append-only chronological log of all balance changes, approvals, and system state transitions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-mono font-bold">
            <Lock className="w-3.5 h-3.5" />
            Append-Only Immutability Guaranteed
          </span>
        </div>
      </div>

      {/* Audit DataTable */}
      <DataTable
        columns={columns}
        data={auditLogs}
        searchPlaceholder="Filter audit trail by action, operator, transaction ref, correlation ID..."
        searchKey={(a) => `${a.action} ${a.userName} ${a.transactionId} ${a.afterValue} ${a.correlationId}`}
        exportFileName="gcms_immutable_audit_log"
        pageSize={12}
      />
    </div>
  );
};
