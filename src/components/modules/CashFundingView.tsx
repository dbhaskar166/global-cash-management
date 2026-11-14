import React, { useState } from 'react';
import {
  CircleDollarSign,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  TrendingDown,
  Building,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { CashFunding, FundingType, FundingPriority } from '../../types/treasury';
import { calculateFundingRequirement } from '../../services/financialMath';

export const CashFundingView: React.FC = () => {
  const {
    fundings,
    bankAccounts,
    entities,
    currentUser,
    createFunding,
    approveFunding,
    executeFunding,
    selectedBusinessDate,
  } = useTreasury();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Funding Form
  const [targetAccId, setTargetAccId] = useState(bankAccounts[0]?.id || '');
  const [fundingType, setFundingType] = useState<FundingType>('INTERCOMPANY');
  const [requiredAmount, setRequiredAmount] = useState<number>(2000000);
  const [priority, setPriority] = useState<FundingPriority>('HIGH');

  const targetAcc = bankAccounts.find((a) => a.id === targetAccId);

  // Automated Deficit Detector
  const accountsWithDeficits = bankAccounts.map((acc) => {
    const calc = calculateFundingRequirement(acc.minimumBalance, acc.availableBalance);
    return {
      account: acc,
      ...calc,
    };
  }).filter((x) => x.isDeficit);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = createFunding({
      accountId: targetAccId,
      fundingType,
      requiredAmount: Number(requiredAmount),
      deficitAmount: targetAcc ? Math.max(0, targetAcc.minimumBalance - targetAcc.availableBalance) : 0,
      priority,
    });

    if (res.success) {
      setIsModalOpen(false);
      setSuccessMessage('Cash funding request created successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(res.error || 'Failed to create funding request');
    }
  };

  const handleApprove = (id: string) => {
    setErrorMessage(null);
    const res = approveFunding(id);
    if (!res.success) setErrorMessage(res.error || 'Approval failed');
    else {
      setSuccessMessage('Funding request approved by checker.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleExecute = (id: string) => {
    setErrorMessage(null);
    const res = executeFunding(id);
    if (!res.success) setErrorMessage(res.error || 'Execution failed');
    else {
      setSuccessMessage('Funding executed: Account credited and intercompany liability journal posted.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const columns: Column<CashFunding>[] = [
    {
      key: 'id',
      header: 'Funding Request ID',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{row.id}</span>
          <div className="text-[10px] text-slate-500">{row.fundingType.replace(/_/g, ' ')}</div>
        </div>
      ),
    },
    {
      key: 'account',
      header: 'Deficit Account',
      render: (row) => {
        const acc = bankAccounts.find((a) => a.id === row.accountId);
        return (
          <div>
            <div className="font-medium text-slate-800">{acc?.accountName || row.accountId}</div>
            <div className="text-[10px] text-slate-500 font-mono">
              Min Req: {formatCurrency(row.minimumRequiredCash, row.currency)} • Avail: {formatCurrency(row.currentAvailableCash, row.currency)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'requiredAmount',
      header: 'Required Amount',
      render: (row) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(row.requiredAmount, row.currency)}
        </div>
      ),
    },
    {
      key: 'tenor',
      header: 'Tenor & Terms',
      render: (row) => (
        <div className="text-xs text-slate-600">
          {row.tenorDays ? `${row.tenorDays} Days @ ${row.interestRate}%` : 'Demand Intercompany'}
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
              onClick={() => handleExecute(row.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-navy-900 rounded hover:bg-navy-800 transition"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Execute</span>
            </button>
          )}

          {row.status === 'EXECUTED' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-semibold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Credited
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Cash Funding & Liquidity Deficit Management
          </h1>
          <p className="text-xs text-slate-500">
            Automated liquidity deficit detection, intercompany & external bank funding generation, and balance replenishment
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition shadow-xs"
        >
          <Plus className="w-4 h-4 text-teal-300" />
          <span>New Funding Request</span>
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
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Automated Deficit Detector Alert Card */}
      {accountsWithDeficits.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Automated Deficit Detection Engine: {accountsWithDeficits.length} Account(s) Below Minimum Balance
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The algorithm identified funding requirements based on configured minimum operational buffers.
              </p>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {accountsWithDeficits.map(({ account, requirement }) => (
                  <div key={account.id} className="rounded-lg bg-white border border-amber-200 p-3 text-xs shadow-2xs">
                    <p className="font-semibold text-slate-900">{account.accountName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{account.iban}</p>
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 font-mono">
                      <span className="text-amber-800 font-semibold">Deficit: {formatCurrency(requirement, account.currency)}</span>
                      <button
                        onClick={() => {
                          setTargetAccId(account.id);
                          setRequiredAmount(requirement);
                          setIsModalOpen(true);
                        }}
                        className="px-2 py-0.5 rounded bg-amber-600 text-white text-[11px] font-sans font-medium hover:bg-amber-700"
                      >
                        Auto-Fund
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All monitored bank accounts currently meet or exceed minimum required operational liquidity buffers.</span>
        </div>
      )}

      {/* Funding Requests Table */}
      <DataTable
        columns={columns}
        data={fundings}
        searchPlaceholder="Search by funding ID, deficit account..."
        searchKey={(f) => `${f.id} ${f.accountId} ${f.fundingType}`}
        exportFileName="gcms_cash_funding"
        pageSize={10}
      />

      {/* Create Funding Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Cash Funding Request"
        subtitle="Replenish account buffer via intercompany loan, pool sweep, or overnight facility"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deficit Target Account</label>
            <select
              value={targetAccId}
              onChange={(e) => setTargetAccId(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 bg-white font-medium text-slate-900"
              required
            >
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountName} ({a.currency} • Avail: {formatCurrency(a.availableBalance, a.currency)} • Min: {formatCurrency(a.minimumBalance, a.currency)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Funding Type</label>
              <select
                value={fundingType}
                onChange={(e) => setFundingType(e.target.value as FundingType)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-900"
              >
                <option value="INTERCOMPANY">Intercompany Funding</option>
                <option value="INTERNAL">Internal Bank Realignment</option>
                <option value="OVERNIGHT">Overnight Credit Facility</option>
                <option value="SHORT_TERM">Short-Term Treasury Loan</option>
                <option value="NOSTRO_FUNDING">Nostro Account Replenishment</option>
                <option value="EMERGENCY">Emergency Liquidity Window</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as FundingPriority)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-900"
              >
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent / SLA Sensitive</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Required Funding Amount ({targetAcc?.currency || 'USD'})
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              value={requiredAmount}
              onChange={(e) => setRequiredAmount(Number(e.target.value))}
              className="w-full rounded-md border border-slate-300 p-2 font-mono font-bold text-slate-900"
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
              Submit Funding Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
