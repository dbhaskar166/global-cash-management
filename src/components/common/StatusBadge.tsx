import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toUpperCase().replace(/\s+/g, '_');

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';

  if (['ACTIVE', 'COMPLETED', 'MATCHED', 'APPROVED', 'POSTED', 'RECONCILED', 'ON_TRACK', 'EXECUTED'].includes(norm)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
  } else if (['PENDING', 'PENDING_APPROVAL', 'PROPOSED', 'IN_PROGRESS', 'POTENTIAL_MATCH', 'ASSIGNED', 'INVESTIGATING'].includes(norm)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
  } else if (['CRITICAL', 'FAILED', 'REJECTED', 'BREACHED', 'OVERDUE', 'CANCELLED', 'REVERSED'].includes(norm)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
  } else if (['HIGH', 'BREAKS_IDENTIFIED', 'EXCEPTION', 'AT_RISK'].includes(norm)) {
    colorClasses = 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800';
  } else if (['UNMATCHED', 'DRAFT', 'NEW', 'MEDIUM', 'LOW'].includes(norm)) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
  }

  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-mono tracking-tight ${padding} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
