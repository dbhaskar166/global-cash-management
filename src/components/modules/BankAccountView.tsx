import React, { useState } from 'react';
import {
  Building2,
  Landmark,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { BankAccount, BankAccountType, CurrencyCode } from '../../types/treasury';

export const BankAccountView: React.FC = () => {
  const { bankAccounts, entities } = useTreasury();

  const [selectedAcc, setSelectedAcc] = useState<BankAccount | null>(null);

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
      header: 'Account Name & Number',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.accountName}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            {row.accountNumber} • {row.iban}
          </div>
        </div>
      ),
    },
    {
      key: 'bankName',
      header: 'Bank & SWIFT/BIC',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.bankName}</div>
          <div className="text-[10px] text-slate-500 font-mono">{row.swiftBic}</div>
        </div>
      ),
    },
    {
      key: 'entity',
      header: 'Legal Entity',
      render: (row) => {
        const ent = entities.find((e) => e.id === row.entityId);
        return (
          <div>
            <div className="font-medium text-slate-800">{ent?.name || row.entityId}</div>
            <div className="text-[10px] text-slate-500">{ent?.country}</div>
          </div>
        );
      },
    },
    {
      key: 'accountType',
      header: 'Account Type',
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
      header: 'Available',
      render: (row) => (
        <div className="text-right font-mono font-semibold text-emerald-700">
          {formatCurrency(row.availableBalance, row.currency)}
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
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Bank Account Management
          </h1>
          <p className="text-xs text-slate-500">
            Enterprise registry of all 30 operating, concentration, Nostro, escrow, virtual and settlement accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 bg-slate-100 rounded-md text-slate-700 font-semibold">
            {bankAccounts.length} Connected Global Accounts
          </span>
        </div>
      </div>

      {/* Accounts Table */}
      <DataTable
        columns={columns}
        data={bankAccounts}
        searchPlaceholder="Filter accounts by name, IBAN, BIC, bank, entity..."
        searchKey={(a) => `${a.accountName} ${a.iban} ${a.swiftBic} ${a.bankName} ${a.currency}`}
        onRowClick={(row) => setSelectedAcc(row)}
        exportFileName="gcms_bank_accounts"
        pageSize={10}
      />

      {/* Account Details Modal */}
      {selectedAcc && (
        <Modal
          isOpen={Boolean(selectedAcc)}
          onClose={() => setSelectedAcc(null)}
          title={`Account Master Record: ${selectedAcc.accountName}`}
          subtitle={`IBAN: ${selectedAcc.iban} • Status: ${selectedAcc.status}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <p className="font-semibold text-slate-500 uppercase text-[10px]">Bank Institution</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedAcc.bankName}</p>
                <p className="text-slate-500">{selectedAcc.bankBranch}</p>
                <p className="text-slate-500 font-mono text-[11px] mt-1">SWIFT/BIC: {selectedAcc.swiftBic}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-500 uppercase text-[10px]">Balances & Currency</p>
                <div className="mt-1 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Currency:</span>
                    <span className="font-bold">{selectedAcc.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Book Balance:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(selectedAcc.bookBalance, selectedAcc.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Available:</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(selectedAcc.availableBalance, selectedAcc.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Restricted / Escrow:</span>
                    <span className="text-slate-900">{formatCurrency(selectedAcc.restrictedBalance, selectedAcc.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Account Purpose</p>
                <p className="font-medium text-slate-800 mt-1">{selectedAcc.accountPurpose}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <p className="text-[10px] text-slate-400 font-bold uppercase">General Ledger Mapping</p>
                <p className="font-mono font-bold text-navy-900 mt-1">{selectedAcc.glAccountMapping}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Connectivity Protocol</p>
                <p className="font-medium text-teal-800 mt-1">{selectedAcc.connectivityType}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Minimum Balance Limit</p>
                <p className="font-mono font-bold text-slate-900 mt-1">
                  {formatCurrency(selectedAcc.minimumBalance, selectedAcc.currency)}
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Overdraft Facility</p>
                <p className="font-mono font-bold text-slate-900 mt-1">
                  {formatCurrency(selectedAcc.overdraftLimit, selectedAcc.currency)}
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Target Sweep Goal</p>
                <p className="font-mono font-bold text-slate-900 mt-1">
                  {formatCurrency(selectedAcc.targetBalance, selectedAcc.currency)}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAcc(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium"
              >
                Close Record
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
