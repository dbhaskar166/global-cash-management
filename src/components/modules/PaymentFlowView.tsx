import React, { useState, useMemo } from 'react';
import { useTreasury } from '../../context/TreasuryContext';
import { PaymentFlowTrack, PaymentFlowHop, CurrencyCode } from '../../types/treasury';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  ShieldCheck,
  Building,
  CreditCard,
  FileCode,
  Copy,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  Send,
  Zap,
} from 'lucide-react';

export const PaymentFlowView: React.FC = () => {
  const {
    paymentFlowTracks,
    advancePaymentHop,
    addPaymentFlowTrack,
    bankAccounts,
    selectedCurrency,
    currentUser,
  } = useTreasury();

  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
    paymentFlowTracks[0]?.paymentId || ''
  );
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showIsoPayload, setShowIsoPayload] = useState<boolean>(false);
  const [showNewPaymentModal, setShowNewPaymentModal] = useState<boolean>(false);
  const [copiedUetr, setCopiedUetr] = useState<boolean>(false);

  // New Payment Form State
  const [newDebtorAccId, setNewDebtorAccId] = useState<string>(bankAccounts[0]?.id || '');
  const [newCreditorName, setNewCreditorName] = useState<string>('Honeywell Aerospace International');
  const [newCreditorIban, setNewCreditorIban] = useState<string>('US55CHAS000449911223');
  const [newAmount, setNewAmount] = useState<number>(3750000);
  const [newCurrency, setNewCurrency] = useState<CurrencyCode>('USD');
  const [newClearingBank, setNewClearingBank] = useState<string>('Federal Reserve Bank of New York (Fedwire)');

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    return paymentFlowTracks.filter((track) => {
      const matchesStatus = filterStatus === 'ALL' || track.status === filterStatus;
      const matchesSearch =
        track.paymentId.toLowerCase().includes(searchFilter.toLowerCase()) ||
        track.creditorEntityName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        track.debtorEntityName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        track.transactionRef.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [paymentFlowTracks, filterStatus, searchFilter]);

  const activeTrack = useMemo(() => {
    return (
      paymentFlowTracks.find((t) => t.paymentId === selectedPaymentId) ||
      filteredTracks[0] ||
      paymentFlowTracks[0]
    );
  }, [paymentFlowTracks, selectedPaymentId, filteredTracks]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalTracks = paymentFlowTracks.length;
    const inFlight = paymentFlowTracks.filter((t) => t.status === 'IN_FLIGHT');
    const settled = paymentFlowTracks.filter((t) => t.status === 'SETTLED');
    const exceptions = paymentFlowTracks.filter((t) => t.status === 'EXCEPTION');

    const inFlightUsd = inFlight.reduce((sum, t) => sum + (t.currency === 'USD' ? t.amount : t.amount * 1.08), 0);
    const settledUsd = settled.reduce((sum, t) => sum + (t.currency === 'USD' ? t.amount : t.amount * 1.08), 0);

    return {
      total: totalTracks,
      inFlightCount: inFlight.length,
      inFlightUsd,
      settledCount: settled.length,
      settledUsd,
      exceptionsCount: exceptions.length,
    };
  }, [paymentFlowTracks]);

  const handleCopyUetr = (uetr: string) => {
    navigator.clipboard?.writeText(uetr);
    setCopiedUetr(true);
    setTimeout(() => setCopiedUetr(false), 2000);
  };

  const handleAdvanceHop = (paymentId: string) => {
    advancePaymentHop(paymentId);
  };

  const handleCreateNewPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceAcc = bankAccounts.find((a) => a.id === newDebtorAccId) || bankAccounts[0];
    const newTrackId = `PMT-2026-LIVE-${Math.floor(Math.random() * 9000 + 1000)}`;

    addPaymentFlowTrack({
      paymentId: newTrackId,
      uetr: `c83a1f9e-${Math.floor(Math.random() * 9000 + 1000)}-4c2b-9901-d7e10a8b4c2d`,
      transactionRef: `OUTBOUND/2026/${newCreditorName.substring(0, 4).toUpperCase()}/${Math.floor(Math.random() * 900 + 100)}`,
      debtorEntityId: sourceAcc.entityId,
      debtorEntityName: sourceAcc.accountName,
      debtorAccountName: `${sourceAcc.bankName} (${sourceAcc.currency})`,
      debtorIban: sourceAcc.iban,
      creditorEntityName: newCreditorName,
      creditorAccountName: `${newCreditorName} Main Operating`,
      creditorIban: newCreditorIban,
      clearingBank: newClearingBank,
      amount: Number(newAmount),
      currency: newCurrency,
      currentStageIndex: 0,
      status: 'IN_FLIGHT',
      hops: [
        {
          hopId: 'HOP-01',
          stage: 'INSTRUCTION_INITIATED',
          title: 'ERP AP Payment Run Instruction Generated',
          description: `Disbursement instruction generated from treasury payment batch for ${newCreditorName}.`,
          sourceAccount: `${sourceAcc.accountName} (${sourceAcc.iban})`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          status: 'COMPLETED',
          iso20022MsgType: 'pain.001.001.09',
        },
        {
          hopId: 'HOP-02',
          stage: 'SANCTION_SCREENING',
          title: 'Automated AML & OFAC Screening',
          description: 'Beneficiary and clearing route screened against OFAC SDN and global sanction registers.',
          timestamp: 'In progress',
          status: 'IN_PROGRESS',
        },
        {
          hopId: 'HOP-03',
          stage: 'DUAL_CONTROL_APPROVAL',
          title: 'Dual Control Treasury Sign-Off',
          description: `Maker ${currentUser.name} submitted payment. Secondary checker sign-off required for execution.`,
          timestamp: 'Queued',
          status: 'PENDING',
        },
        {
          hopId: 'HOP-04',
          stage: 'NETWORK_DISPATCH',
          title: 'Network Clearing Dispatch',
          description: `Will route via ${newClearingBank} with ISO 20022 pacs.008 message.`,
          timestamp: 'Queued',
          status: 'PENDING',
          networkChannel: 'FEDWIRE_FUNDS',
          iso20022MsgType: 'pacs.008.001.08',
        },
        {
          hopId: 'HOP-05',
          stage: 'NOSTRO_SETTLEMENT',
          title: 'Correspondent Nostro Account Debit',
          description: `Debiting ${sourceAcc.bankName} Nostro clearing balance across central settlement gateway.`,
          timestamp: 'Queued',
          status: 'PENDING',
        },
        {
          hopId: 'HOP-06',
          stage: 'CAMT_INGESTION',
          title: 'Electronic Bank Statement Ingestion',
          description: 'Awaiting camt.053 intraday / end-of-day electronic bank statement transmission.',
          timestamp: 'Queued',
          status: 'PENDING',
          iso20022MsgType: 'camt.053.001.08',
        },
        {
          hopId: 'HOP-07',
          stage: 'MATCHING_CONFIRMED',
          title: 'Automated 3-Way Reconciled Match',
          description: 'Engine will correlate bank statement confirmation against payment instruction.',
          timestamp: 'Queued',
          status: 'PENDING',
        },
        {
          hopId: 'HOP-08',
          stage: 'GL_SUBLEDGER_POSTED',
          title: 'Double-Entry Balanced General Ledger Posting',
          description: `Debits AP Trade Clearing (GL 2001) and Credits Cash Operating (GL 1001).`,
          timestamp: 'Queued',
          status: 'PENDING',
          journalRef: `JE-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        },
      ],
    });

    setSelectedPaymentId(newTrackId);
    setShowNewPaymentModal(false);
  };

  const getStageColor = (status: PaymentFlowHop['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse';
      case 'FLAGGED':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'PENDING':
      default:
        return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  const getStageBadge = (status: PaymentFlowHop['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Done
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" /> In Progress
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Hold / Flagged
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500">
            Queued
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Flow & Account Movement Engine</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              ISO 20022 Multi-Hop
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time visual tracer showing how corporate cash moves across internal accounts, central bank clearing networks, correspondent Nostros, and GL subledgers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIsoPayload(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
          >
            <FileCode className="w-4 h-4 text-slate-500" />
            ISO 20022 XML Payload
          </button>
          <button
            onClick={() => setShowNewPaymentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Stage New Outbound Payment
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>In-Flight Clearing Volume</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ${(stats.inFlightUsd / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-amber-700 mt-1 flex items-center gap-1 font-medium">
            <span>{stats.inFlightCount} payment tracks in active execution</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Settled & Posted Today</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ${(stats.settledUsd / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-medium">
            <span>{stats.settledCount} tracks 100% completed & GL posted</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Clearing Networks Connected</span>
            <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">4 Active</div>
          <div className="text-xs text-slate-500 mt-1">Fedwire • TARGET2 • BOJ-NET • Intrabank</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Exception / AML Holds</span>
            <span className="p-1.5 rounded-md bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.exceptionsCount} Pending
          </div>
          <div className="text-xs text-rose-600 mt-1 font-medium">
            Requires Compliance Officer sign-off
          </div>
        </div>
      </div>

      {/* Main Grid: Track List & Interactive Detail Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Payment Track Selector (5 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, beneficiary, entity..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Status:</span>
              {(['ALL', 'IN_FLIGHT', 'SETTLED', 'EXCEPTION'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    filterStatus === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'IN_FLIGHT' ? 'In Flight' : st === 'SETTLED' ? 'Settled' : 'Hold'}
                </button>
              ))}
            </div>
          </div>

          {/* List of Tracks */}
          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {filteredTracks.map((track) => {
              const isSelected = activeTrack?.paymentId === track.paymentId;
              const completedCount = track.hops.filter((h) => h.status === 'COMPLETED').length;
              const progressPct = Math.round((completedCount / track.hops.length) * 100);

              return (
                <div
                  key={track.paymentId}
                  onClick={() => setSelectedPaymentId(track.paymentId)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {track.paymentId}
                        </span>
                        {track.status === 'SETTLED' ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded">
                            Settled
                          </span>
                        ) : track.status === 'EXCEPTION' ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-800 rounded">
                            Hold
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded">
                            Stage {track.currentStageIndex + 1}/8
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                        {track.creditorEntityName}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        From: {track.debtorEntityName}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 font-mono">
                        {track.currency} {track.amount.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {track.clearingBank.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-1">
                      <span>Hop Progress</span>
                      <span>{progressPct}% ({completedCount}/8 Hops)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          track.status === 'SETTLED'
                            ? 'bg-emerald-500'
                            : track.status === 'EXCEPTION'
                            ? 'bg-rose-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Payment Deep Dive & Hop Pipeline (8 cols) */}
        {activeTrack ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Visual Account Movement Diagram Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {activeTrack.paymentId}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Ref: {activeTrack.transactionRef}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {activeTrack.currency} {activeTrack.amount.toLocaleString()} to {activeTrack.creditorEntityName}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {/* Advance Hop Button */}
                  {activeTrack.currentStageIndex < activeTrack.hops.length - 1 && activeTrack.status !== 'EXCEPTION' && (
                    <button
                      onClick={() => handleAdvanceHop(activeTrack.paymentId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      title="Simulate processing next lifecycle hop"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Simulate Advance Next Hop
                    </button>
                  )}
                  {activeTrack.status === 'SETTLED' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" /> Fully Reconciled & Posted
                    </span>
                  )}
                </div>
              </div>

              {/* End-to-End Account Movement Diagram */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Cross-Account Settlement Highway
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                  {/* Node 1: Debtor Account */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">Debtor Account</span>
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">{activeTrack.debtorEntityName}</div>
                    <div className="text-[11px] text-slate-600 truncate">{activeTrack.debtorAccountName}</div>
                    <div className="font-mono text-[10px] text-slate-400 truncate">IBAN: {activeTrack.debtorIban}</div>
                    <div className="pt-1 text-[11px] font-semibold text-rose-600">
                      Debit: -{activeTrack.currency} {activeTrack.amount.toLocaleString()}
                    </div>
                  </div>

                  {/* Node 2: Clearing & Nostro Gateway */}
                  <div className="bg-white p-3 rounded-lg border border-indigo-200 bg-indigo-50/20 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase">Clearing Gateway / Nostro</span>
                      <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">{activeTrack.clearingBank}</div>
                    <div className="text-[11px] text-slate-600">RTGS Central Book Clearing</div>
                    <div className="font-mono text-[10px] text-slate-500 truncate">
                      Stage: {activeTrack.hops[activeTrack.currentStageIndex]?.stage}
                    </div>
                    <div className="pt-1 text-[11px] font-semibold text-indigo-600">
                      Settlement Float: Zero Risk
                    </div>
                  </div>

                  {/* Node 3: Creditor Account */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Creditor / Beneficiary</span>
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">{activeTrack.creditorEntityName}</div>
                    <div className="text-[11px] text-slate-600 truncate">{activeTrack.creditorAccountName}</div>
                    <div className="font-mono text-[10px] text-slate-400 truncate">IBAN: {activeTrack.creditorIban}</div>
                    <div className="pt-1 text-[11px] font-semibold text-emerald-600">
                      Credit: +{activeTrack.currency} {activeTrack.amount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* UETR and Channel Bar */}
                <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">SWIFT GPI UETR:</span>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                      {activeTrack.uetr}
                    </span>
                    <button
                      onClick={() => handleCopyUetr(activeTrack.uetr)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Copy UETR tracking code"
                    >
                      {copiedUetr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Network: <span className="font-semibold text-slate-700">{activeTrack.hops[activeTrack.currentStageIndex]?.networkChannel || 'FEDWIRE / TARGET2'}</span>
                  </div>
                </div>
              </div>

              {/* 8-Stage Sequential Lifecycle Hop Stepper */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    8-Stage End-to-End Payment Lifecycle Hops
                  </h3>
                  <span className="text-xs text-slate-500">
                    Stage {activeTrack.currentStageIndex + 1} of {activeTrack.hops.length}
                  </span>
                </div>

                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {activeTrack.hops.map((hop, index) => {
                    const isCurrent = index === activeTrack.currentStageIndex;

                    return (
                      <div key={hop.hopId} className="relative flex items-start gap-3.5 pl-1">
                        {/* Hop Circle Icon */}
                        <div
                          className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full border text-[11px] font-bold ${getStageColor(
                            hop.status
                          )}`}
                        >
                          {hop.status === 'COMPLETED' ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : hop.status === 'FLAGGED' ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        {/* Hop Card */}
                        <div
                          className={`flex-1 p-3 rounded-lg border transition-all ${
                            isCurrent
                              ? 'border-indigo-400 bg-indigo-50/20 shadow-xs'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{hop.title}</span>
                              {hop.iso20022MsgType && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {hop.iso20022MsgType}
                                </span>
                              )}
                            </div>
                            <div>{getStageBadge(hop.status)}</div>
                          </div>

                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{hop.description}</p>

                          <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                            <span className="font-mono">Time: {hop.timestamp}</span>
                            {hop.journalRef && (
                              <span className="font-mono text-indigo-600 font-semibold">
                                Journal: {hop.journalRef}
                              </span>
                            )}
                            {hop.clearingAccount && (
                              <span className="truncate max-w-[200px]">
                                Clearing: {hop.clearingAccount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subledger Double-Entry Impact Panel */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Balanced Subledger Accounting Effect
                  </span>
                  <span className="text-slate-400 text-[11px]">Strict Double-Entry (Zero Drift)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                  <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                    <div className="text-rose-400 font-bold mb-1">DEBIT ENTRY (DR)</div>
                    <div>Account: GL 2001 - Trade Accounts Payable Clearing</div>
                    <div>Entity: {activeTrack.debtorEntityName}</div>
                    <div className="text-white font-bold mt-1">
                      Amount: {activeTrack.currency} {activeTrack.amount.toLocaleString()}.00
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                    <div className="text-emerald-400 font-bold mb-1">CREDIT ENTRY (CR)</div>
                    <div>Account: GL 1001 - Demand Deposit / Operating Cash</div>
                    <div>Entity: {activeTrack.debtorEntityName}</div>
                    <div className="text-white font-bold mt-1">
                      Amount: {activeTrack.currency} {activeTrack.amount.toLocaleString()}.00
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Note: Upon camt.053 matching confirmation, final clearing wash account balances to zero. No unmatched suspense float remains.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ISO 20022 Raw XML Payload Modal */}
      {showIsoPayload && activeTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  ISO 20022 XML Message Inspector ({activeTrack.paymentId})
                </h3>
              </div>
              <button
                onClick={() => setShowIsoPayload(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto font-mono text-[11px] bg-slate-950 text-emerald-400 leading-relaxed rounded-b-xl">
              <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${activeTrack.paymentId}-MSG-01</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys>
          <Prtry>${activeTrack.clearingBank}</Prtry>
        </ClrSys>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>${activeTrack.transactionRef}</EndToEndId>
        <UETR>${activeTrack.uetr}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="${activeTrack.currency}">${activeTrack.amount}.00</IntrBkSttlmAmt>
      <IntrBkSttlmDt>2026-11-05</IntrBkSttlmDt>
      <Dbtr>
        <Nm>${activeTrack.debtorEntityName}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${activeTrack.debtorIban}</IBAN>
        </Id>
      </DbtrAcct>
      <Cdtr>
        <Nm>${activeTrack.creditorEntityName}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${activeTrack.creditorIban}</IBAN>
        </Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>Invoice settlement batch #2026-11</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`}</pre>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowIsoPayload(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage New Outbound Payment Modal */}
      {showNewPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Stage New Corporate Payment Track</h3>
              </div>
              <button
                onClick={() => setShowNewPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Source Operating Debtor Account
                </label>
                <select
                  value={newDebtorAccId}
                  onChange={(e) => setNewDebtorAccId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-indigo-500"
                >
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} - {a.bankName} ({a.currency} {a.availableBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Beneficiary / Creditor Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={newCreditorName}
                  onChange={(e) => setNewCreditorName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Honeywell Aerospace International"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Beneficiary IBAN / Account Number
                </label>
                <input
                  type="text"
                  required
                  value={newCreditorIban}
                  onChange={(e) => setNewCreditorIban(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. US55CHAS000449911223"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Currency</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value as CurrencyCode)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Clearing Network & RTGS Node
                </label>
                <select
                  value={newClearingBank}
                  onChange={(e) => setNewClearingBank(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Federal Reserve Bank of New York (Fedwire)">
                    Federal Reserve Fedwire Funds Service (Instant)
                  </option>
                  <option value="ECB TARGET2 RT1 Frankfurt">
                    ECB TARGET2 RT1 Interbank (EUR)
                  </option>
                  <option value="Bank of Japan BOJ-NET">Bank of Japan BOJ-NET (JPY)</option>
                  <option value="Barclays Internal Book Sweep Router">
                    Intragroup Zero-Float Book Transfer
                  </option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Launch Payment into Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
