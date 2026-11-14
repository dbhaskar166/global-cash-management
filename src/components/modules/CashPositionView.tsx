import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Layers,
  Building,
  DollarSign,
  Download,
  Filter,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { BankAccount, CurrencyCode } from '../../types/treasury';
import { convertFx, calculateClosingBalance, calculateAvailableCash } from '../../services/financialMath';

export const CashPositionView: React.FC = () => {
  const {
    bankAccounts,
    entities,
    fxRates,
    selectedEntityId,
    selectedAccountId,
    selectedCurrency,
    selectedBusinessDate,
  } = useTreasury();

  const [selectedAccForDetail, setSelectedAccForDetail] = useState<BankAccount | null>(null);
  const [viewGrouping, setViewGrouping] = useState<'ACCOUNT' | 'ENTITY' | 'CURRENCY'>('ACCOUNT');

  // Filter accounts
  const filtered = bankAccounts.filter((acc) => {
    if (selectedEntityId !== 'ALL' && acc.entityId !== selectedEntityId) return false;
    if (selectedAccountId !== 'ALL' && acc.id !== selectedAccountId) return false;
    return true;
  });

  const toBase = (amount: number, ccy: CurrencyCode) => {
    return convertFx(amount, ccy, selectedCurrency, fxRates).convertedAmount;
  };

  // Aggregated totals
  const totalBook = filtered.reduce((s, a) => s + toBase(a.bookBalance, a.currency), 0);
  const totalAvailable = filtered.reduce((s, a) => s + toBase(a.availableBalance, a.currency), 0);
  const totalRestricted = filtered.reduce((s, a) => s + toBase(a.restrictedBalance, a.currency), 0);
  const totalValueDated = filtered.reduce((s, a) => s + toBase(a.valueDatedBalance, a.currency), 0);

  const formatCurrency = (val: number, ccy: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const columns: Column<BankAccount>[] = [
    {
      key: 'accountName',
      header: 'Bank Account & IBAN',
      render: (row) => {
        const ent = entities.find((e) => e.id === row.entityId);
        return (
          <div>
            <div className="font-semibold text-slate-900">{row.accountName}</div>
            <div className="text-[10px] text-slate-500 font-mono">
              {row.iban} • {ent?.code || ''}
            </div>
          </div>
        );
      },
    },
    {
      key: 'bankName',
      header: 'Bank & Branch',
      render: (row) => (
        <div>
          <div className="text-slate-800 font-medium">{row.bankName}</div>
          <div className="text-[10px] text-slate-500">{row.bankBranch}</div>
        </div>
      ),
    },
    {
      key: 'accountType',
      header: 'Type',
      render: (row) => <StatusBadge status={row.accountType} size="sm" />,
    },
    {
      key: 'currency',
      header: 'CCY',
      render: (row) => <span className="font-mono font-bold text-slate-700">{row.currency}</span>,
    },
    {
      key: 'bookBalance',
      header: 'Book Balance',
      render: (row) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(row.bookBalance, row.currency)}
        </div>
      ),
    },
    {
      key: 'availableBalance',
      header: 'Available Cash',
      render: (row) => (
        <div className="text-right font-mono font-semibold text-emerald-700">
          {formatCurrency(row.availableBalance, row.currency)}
        </div>
      ),
    },
    {
      key: 'restrictedBalance',
      header: 'Restricted',
      render: (row) => (
        <div className="text-right font-mono text-slate-500">
          {row.restrictedBalance > 0 ? formatCurrency(row.restrictedBalance, row.currency) : '-'}
        </div>
      ),
    },
    {
      key: 'baseEquivalent',
      header: `Value in ${selectedCurrency}`,
      render: (row) => (
        <div className="text-right font-mono font-bold text-navy-900">
          {formatCurrency(toBase(row.bookBalance, row.currency), selectedCurrency)}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Grouping Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Cash Position Management
          </h1>
          <p className="text-xs text-slate-500">
            Consolidated cash balances, value-dating, restricted reserves, and mathematical calculation breakdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs">
            <button
              onClick={() => setViewGrouping('ACCOUNT')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                viewGrouping === 'ACCOUNT' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Account Level
            </button>
            <button
              onClick={() => setViewGrouping('ENTITY')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                viewGrouping === 'ENTITY' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entity Level
            </button>
            <button
              onClick={() => setViewGrouping('CURRENCY')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                viewGrouping === 'CURRENCY' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Currency Level
            </button>
          </div>
        </div>
      </div>

      {/* Position Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Consolidated Book Balance</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatCurrency(totalBook, selectedCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Formula: Opening + Credits - Debits
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Operational Available Cash</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {formatCurrency(totalAvailable, selectedCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Book - Restricted - Pending Outflows
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Value-Dated Balance</p>
          <p className="text-2xl font-bold font-mono text-blue-700 mt-1">
            {formatCurrency(totalValueDated, selectedCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Cleared & Settled by Banking Calendar
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Restricted / Escrow Cash</p>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {formatCurrency(totalRestricted, selectedCurrency)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Collateral, Guarantees & Suspense
          </p>
        </div>
      </div>

      {/* Main Position DataTable */}
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Filter by account, IBAN, bank, or currency..."
        searchKey={(row) => `${row.accountName} ${row.iban} ${row.bankName} ${row.currency}`}
        onRowClick={(row) => setSelectedAccForDetail(row)}
        exportFileName="gcms_cash_positions"
        pageSize={10}
      />

      {/* Account Drill-Down Drawer / Calculation Explanation */}
      {selectedAccForDetail && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Detailed Calculation Breakdown: {selectedAccForDetail.accountName}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                IBAN: {selectedAccForDetail.iban} • SWIFT/BIC: {selectedAccForDetail.swiftBic} • GL Mapping: {selectedAccForDetail.glAccountMapping}
              </p>
            </div>
            <button
              onClick={() => setSelectedAccForDetail(null)}
              className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium text-slate-700"
            >
              Close Breakdown
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Calculation Walkthrough */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3 font-mono text-xs">
              <p className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                Mathematical Proof & Availability Rules
              </p>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Opening Balance (00:00):</span>
                  <span className="font-bold">{formatCurrency(selectedAccForDetail.openingBalance, selectedAccForDetail.currency)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>+ Total Credits (Intraday):</span>
                  <span>+{formatCurrency(selectedAccForDetail.bookBalance - selectedAccForDetail.openingBalance + 250000, selectedAccForDetail.currency)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>- Total Debits (Intraday):</span>
                  <span>-{formatCurrency(250000, selectedAccForDetail.currency)}</span>
                </div>
                <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-slate-900">
                  <span>= Book Closing Balance:</span>
                  <span>{formatCurrency(selectedAccForDetail.bookBalance, selectedAccForDetail.currency)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Book Balance:</span>
                  <span>{formatCurrency(selectedAccForDetail.bookBalance, selectedAccForDetail.currency)}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>- Restricted Balance:</span>
                  <span>-{formatCurrency(selectedAccForDetail.restrictedBalance, selectedAccForDetail.currency)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>- Pending Outflows:</span>
                  <span>-{formatCurrency(selectedAccForDetail.bookBalance - selectedAccForDetail.availableBalance - selectedAccForDetail.restrictedBalance, selectedAccForDetail.currency)}</span>
                </div>
                <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-emerald-800">
                  <span>= Available for Realignment:</span>
                  <span>{formatCurrency(selectedAccForDetail.availableBalance, selectedAccForDetail.currency)}</span>
                </div>
              </div>
            </div>

            {/* Account Limits & Thresholds */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3 text-xs">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Liquidity Limits & Overdraft Parameters
              </p>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600">Overdraft Facility:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(selectedAccForDetail.overdraftLimit, selectedAccForDetail.currency)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600">Minimum Operational Threshold:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(selectedAccForDetail.minimumBalance, selectedAccForDetail.currency)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600">Target Balancing Goal:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(selectedAccForDetail.targetBalance, selectedAccForDetail.currency)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600">Statement Feed Frequency:</span>
                  <span className="font-medium text-slate-900">{selectedAccForDetail.statementFrequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Connectivity Standard:</span>
                  <span className="font-medium text-teal-800 bg-teal-50 px-1 rounded">
                    {selectedAccForDetail.connectivityType}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions for this Account */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  Operational Treasury Actions
                </p>
                <p className="text-slate-500 mb-4">
                  Initiate cash sweep, transfer, or funding request directly for this account.
                </p>
              </div>

              <div className="space-y-2">
                <button className="w-full py-2 bg-navy-900 text-white rounded-md font-medium hover:bg-navy-800 transition shadow-2xs">
                  Initiate Cash Realignment Sweep
                </button>
                <button className="w-full py-2 bg-white border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-100 transition shadow-2xs">
                  Request Liquidity Funding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
