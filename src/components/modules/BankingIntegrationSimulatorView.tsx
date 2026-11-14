import React, { useState } from 'react';
import {
  Terminal,
  Send,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  FileCode,
  RotateCcw,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { ISO20022Message, CurrencyCode } from '../../types/treasury';
import { StatusBadge } from '../common/StatusBadge';

export const BankingIntegrationSimulatorView: React.FC = () => {
  const {
    iso20022Messages,
    simulateIncomingPayment,
    simulateStatementIngestion,
    simulateFxFluctuation,
    resetAllData,
    bankAccounts,
  } = useTreasury();

  const [selectedMsg, setSelectedMsg] = useState<ISO20022Message>(iso20022Messages[0]);
  const [notification, setNotification] = useState<string | null>(null);

  // Simulation Form State
  const [simAmount, setSimAmount] = useState<number>(2500000);
  const [simCurrency, setSimCurrency] = useState<CurrencyCode>('USD');
  const [simDebtor, setSimDebtor] = useState('Shell Global Trading B.V.');
  const [simCreditor, setSimCreditor] = useState('Global Treasury Holdings Corp');

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    simulateIncomingPayment(Number(simAmount), simCurrency, simDebtor, simCreditor);
    setNotification(`Simulated pacs.008 customer credit transfer of ${simAmount.toLocaleString()} ${simCurrency} ingested! Cash position updated.`);
    setTimeout(() => setNotification(null), 4500);
  };

  const handleSimulateStatementFeed = () => {
    const targetAcc = bankAccounts[0];
    simulateStatementIngestion(
      targetAcc.iban,
      1200000,
      'CREDIT',
      `STMT-FEED-${Math.floor(10000 + Math.random() * 90000)}`
    );
    setNotification('Simulated camt.053 bank statement balance lines ingested.');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Banking Integration Framework & ISO 20022 Test Harness
          </h1>
          <p className="text-xs text-slate-500">
            Simulate SWIFT FIN and ISO 20022 message ingestion (camt.052, camt.053, camt.054, pacs.008, pain.001) with live ledger updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetAllData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Simulator Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Ingestion Form */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-teal-700" />
              <span>Simulate Real-Time Payment Ingestion (pacs.008)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Generates an ISO 20022 inbound credit, increments bank balance, and triggers matching engine
            </p>
          </div>

          <form onSubmit={handleSimulatePayment} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Debtor Entity (Payer)</label>
              <input
                type="text"
                value={simDebtor}
                onChange={(e) => setSimDebtor(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Creditor Entity (Recipient)</label>
              <input
                type="text"
                value={simCreditor}
                onChange={(e) => setSimCreditor(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 text-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Amount</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-300 p-2 font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                <select
                  value={simCurrency}
                  onChange={(e) => setSimCurrency(e.target.value as CurrencyCode)}
                  className="w-full rounded-md border border-slate-300 p-2 bg-white font-mono font-bold text-slate-900"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="CHF">CHF</option>
                  <option value="SGD">SGD</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current text-teal-300" />
                <span>Inject Payment Event</span>
              </button>
            </div>
          </form>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={handleSimulateStatementFeed}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition"
            >
              Ingest camt.053 Statement Feed
            </button>
            <button
              onClick={simulateFxFluctuation}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition"
            >
              Tick FX Market Volatility
            </button>
          </div>
        </div>

        {/* Right: ISO 20022 XML Message Inspector */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Standards-Compliant ISO 20022 XML Payloads
              </h2>
              <p className="text-xs text-slate-500">
                Inspecting parsed camt.053 bank statements and pacs.008 customer credit transfers
              </p>
            </div>

            <div className="flex gap-1.5">
              {iso20022Messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMsg(msg)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                    selectedMsg.id === msg.id
                      ? 'bg-navy-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {msg.messageType}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-500">Message ID: </span>
              <span className="font-bold text-slate-900">{selectedMsg.msgId}</span>
            </div>
            <div>
              <span className="text-slate-500">Amount: </span>
              <span className="font-bold text-teal-900">{selectedMsg.amount.toLocaleString()} {selectedMsg.currency}</span>
            </div>
            <StatusBadge status={selectedMsg.status} size="sm" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                Raw ISO 20022 Schema Structure:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">XML UTF-8</span>
            </div>

            <pre className="rounded-lg bg-slate-950 text-slate-100 p-4 font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
              {selectedMsg.rawPayload}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
