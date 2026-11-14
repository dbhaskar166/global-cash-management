import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { CashFlow, CashFlowType } from '../../types/treasury';

export const CashFlowView: React.FC = () => {
  const {
    cashFlows,
    bankAccounts,
    entities,
    createCashFlow,
    selectedEntityId,
    selectedBusinessDate,
  } = useTreasury();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id || '');
  const [flowType, setFlowType] = useState<CashFlowType>('EXPECTED_INCOMING');
  const [counterparty, setCounterparty] = useState('Siemens Energy AG');
  const [paymentRef, setPaymentRef] = useState('INV-2026-NOV-8812');
  const [amount, setAmount] = useState<number>(1500000);
  const [expectedDate, setExpectedDate] = useState(selectedBusinessDate);
  const [category, setCategory] = useState<'OPERATING' | 'FINANCING' | 'INVESTING' | 'TAX' | 'INTERCOMPANY'>('OPERATING');

  const selectedAcc = bankAccounts.find((a) => a.id === accountId);

  const filtered = cashFlows.filter((cf) => {
    if (selectedEntityId !== 'ALL' && cf.entityId !== selectedEntityId) return false;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createCashFlow({
      accountId,
      flowType,
      counterparty,
      paymentReference: paymentRef,
      amount: Number(amount),
      expectedDate,
      valueDate: expectedDate,
      forecastCategory: category,
      sourceSystem: 'TREASURY_PORTAL',
    });

    if (res.success) {
      setIsModalOpen(false);
      setSuccessMessage('New cash flow item recorded successfully.');
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

  const columns: Column<CashFlow>[] = [
    {
      key: 'id',
      header: 'Flow ID',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{row.id}</span>
          <div className="text-[10px] text-slate-500">{row.sourceSystem}</div>
        </div>
      ),
    },
    {
      key: 'flowType',
      header: 'Flow Type',
      render: (row) => {
        const isIn = row.flowType.includes('INCOMING');
        return (
          <div className="flex items-center gap-1.5">
            {isIn ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                Inflow
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-700 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                Outflow
              </span>
            )}
            <span className="text-[10px] text-slate-400">({row.forecastCategory})</span>
          </div>
        );
      },
    },
    {
      key: 'counterparty',
      header: 'Counterparty & Reference',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.counterparty}</div>
          <div className="text-[10px] font-mono text-slate-500">{row.paymentReference}</div>
        </div>
      ),
    },
    {
      key: 'account',
      header: 'Account',
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
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(row.amount, row.currency)}
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Expected / Value Date',
      render: (row) => (
        <div className="text-xs font-mono text-slate-600">
          <div>Exp: {row.expectedDate}</div>
          <div className="text-[10px] text-slate-400">Val: {row.valueDate}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Cash Flow Management
          </h1>
          <p className="text-xs text-slate-500">
            Ingestion, scheduling, tracking, and matching of incoming and outgoing operational and treasury cash flows
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition shadow-xs"
        >
          <Plus className="w-4 h-4 text-teal-300" />
          <span>New Expected Cash Flow</span>
        </button>
      </div>

      {successMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Cash Flow Table */}
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Filter cash flows by counterparty, reference, account..."
        searchKey={(c) => `${c.id} ${c.counterparty} ${c.paymentReference} ${c.accountId}`}
        exportFileName="gcms_cash_flows"
        pageSize={10}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Expected Cash Flow"
        subtitle="Record forecasted accounts payable or receivable item for liquidity planning"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-900"
              required
            >
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountName} ({a.currency})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Flow Direction</label>
              <select
                value={flowType}
                onChange={(e) => setFlowType(e.target.value as CashFlowType)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-900"
              >
                <option value="EXPECTED_INCOMING">Expected Inflow (Receivable)</option>
                <option value="EXPECTED_OUTGOING">Expected Outflow (Payable)</option>
                <option value="RECURRING">Recurring Fixed Flow</option>
                <option value="INTERCOMPANY">Intercompany Cash Flow</option>
                <option value="TAX">Statutory Tax Settlement</option>
                <option value="PAYROLL">Payroll Disbursement</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Forecast Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-900"
              >
                <option value="OPERATING">Operating Activity</option>
                <option value="FINANCING">Financing / Debt Service</option>
                <option value="INVESTING">Investing & Capital Expenditure</option>
                <option value="TAX">Tax Authorities</option>
                <option value="INTERCOMPANY">Intercompany Bilateral</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Counterparty Name</label>
              <input
                type="text"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Reference / Invoice</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 font-mono text-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Amount ({selectedAcc?.currency || 'USD'})
              </label>
              <input
                type="number"
                min="1"
                step="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 p-2 font-mono font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected Settlement Date</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 font-mono text-slate-900"
                required
              />
            </div>
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
              Save Cash Flow
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
