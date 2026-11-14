import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  Cpu,
  GitBranch,
  FileText,
  Download,
  CheckCircle,
  Database,
  ArrowRightLeft,
  Workflow,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';

export const ArchitectureBlueprintViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'STRATEGIC_DDD' | 'ACTORS' | 'BOUNDED_CONTEXTS' | 'MICROSERVICES' | 'SAGAS' | 'ADRS' | 'QUALITY_GATES'
  >('OVERVIEW');

  const handleDownloadMarkdown = () => {
    // Fetch and download the raw markdown blueprint
    fetch('/api/v1/architecture-blueprint')
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'GCMS_ENTERPRISE_ARCHITECTURE_DDD_BLUEPRINT.md';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(() => {
        window.open('/docs/GCMS_ENTERPRISE_ARCHITECTURE_DDD_BLUEPRINT.md', '_blank');
      });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 text-white rounded-xl p-6 shadow-md border border-navy-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-300 text-xs font-mono font-semibold border border-teal-500/30 mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>TIER-1 TRANSACTION BANKING SPECIFICATION • DDD BLUEPRINT v3.0</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Global Cash Management System (GCMS) Architecture
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Strategic & Tactical Domain-Driven Design, Business Capability Model, 22 Bounded Contexts, Microservices Ownership, Distributed Sagas with Reversing Compensations, Strict Double-Entry Subledger, and ISO 20022 Compliance.
            </p>
          </div>

          <button
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-navy-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Full Blueprint (.md)</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 mt-6 pt-4 border-t border-navy-800/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'OVERVIEW' ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            Overview & Core Principles
          </button>
          <button
            onClick={() => setActiveTab('STRATEGIC_DDD')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'STRATEGIC_DDD' ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            Strategic DDD Matrix
          </button>
          <button
            onClick={() => setActiveTab('ACTORS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'ACTORS' ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            21 Business Actors & Controls
          </button>
          <button
            onClick={() => setActiveTab('BOUNDED_CONTEXTS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'BOUNDED_CONTEXTS' ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            22 Bounded Contexts
          </button>
          <button
            onClick={() => setActiveTab('MICROSERVICES')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'MICROSERVICES' ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            Microservices & Databases
          </button>
          <button
            onClick={() => setActiveTab('SAGAS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'SAGAS' ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            Distributed Sagas & Reversals
          </button>
          <button
            onClick={() => setActiveTab('ADRS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'ADRS' ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            Architecture Decision Records
          </button>
          <button
            onClick={() => setActiveTab('QUALITY_GATES')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'QUALITY_GATES' ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            Quality Gates (100% Pass)
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Strict Double-Entry Subledger</h3>
              <p className="text-xs text-slate-500 mt-1">
                Zero float drift. Every balance-affecting movement (sweeps, funding, adjustments, settled wires) enforces Σ Debits ≡ Σ Credits with immutable posted journals.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Database-per-Service Isolation</h3>
              <p className="text-xs text-slate-500 mt-1">
                No shared databases or cross-service table joins. Services communicate exclusively via REST OpenAPI contracts and asynchronous Kafka domain events.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Compensating Sagas vs 2PC</h3>
              <p className="text-xs text-slate-500 mt-1">
                Banking operations across external clearing networks (SWIFT, Fedwire) utilize distributed Sagas with explicit reversing journal entries and return wires.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Architectural Topology & Technical Stack
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700 block">Backend Framework</span>
                <span className="font-mono text-slate-900 font-bold mt-1 block">Java 21 / Spring Boot 3.3</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Spring Modulith & Spring Data JPA</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700 block">Event Streaming & CDC</span>
                <span className="font-mono text-slate-900 font-bold mt-1 block">Apache Kafka / Debezium</span>
                <span className="text-[11px] text-slate-500 mt-1 block">CloudEvents v1.0.2 with Schema Registry</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700 block">Persistence & Caching</span>
                <span className="font-mono text-slate-900 font-bold mt-1 block">PostgreSQL 16 & Redis</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Dedicated DB schemas per microservice</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-700 block">Financial Arithmetic</span>
                <span className="font-mono text-slate-900 font-bold mt-1 block">BigDecimal (Scale 4)</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Banker's Rounding (HALF_EVEN)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Strategic DDD */}
      {activeTab === 'STRATEGIC_DDD' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Strategic Domain Classification Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Clear categorization isolating differentiating core capabilities from supporting operations and generic IT infrastructure.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2">Domain</th>
                  <th className="px-3 py-2">Subdomain</th>
                  <th className="px-3 py-2">Classification</th>
                  <th className="px-3 py-2">Business Value</th>
                  <th className="px-3 py-2">Business Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-slate-800">
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-900">Cash Management</td>
                  <td className="px-3 py-2">Cash Position Consolidation</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-100 text-red-800">CORE</span></td>
                  <td className="px-3 py-2">Global real-time visibility across 15 legal entities</td>
                  <td className="px-3 py-2 font-mono text-[11px]">Global Treasury</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-900">Cash Management</td>
                  <td className="px-3 py-2">Cash Realignment & Sweeps</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-100 text-red-800">CORE</span></td>
                  <td className="px-3 py-2">Automated liquidity rebalancing and sweeps</td>
                  <td className="px-3 py-2 font-mono text-[11px]">Global Treasury</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-900">Payment Management</td>
                  <td className="px-3 py-2">Payment Matching & Clearing</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-100 text-red-800">CORE</span></td>
                  <td className="px-3 py-2">Sub-second pairing of SWIFT pacs.008 vs camt.053</td>
                  <td className="px-3 py-2 font-mono text-[11px]">Payment Operations</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-900">Liquidity Management</td>
                  <td className="px-3 py-2">Liquidity Optimization & Pools</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-100 text-red-800">CORE</span></td>
                  <td className="px-3 py-2">ZBA, target balance and notional pooling efficiency</td>
                  <td className="px-3 py-2 font-mono text-[11px]">Global Treasury</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-900">Accounting & GL</td>
                  <td className="px-3 py-2">Double-Entry Journal Posting</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">SUPPORTING</span></td>
                  <td className="px-3 py-2">Financial integrity and zero variance subledger</td>
                  <td className="px-3 py-2 font-mono text-[11px]">Financial Control</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-900">Bank Connectivity</td>
                  <td className="px-3 py-2">ISO 20022 Message Processing</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">SUPPORTING</span></td>
                  <td className="px-3 py-2">SWIFT MX / Fedwire XML statement & payment parsing</td>
                  <td className="px-3 py-2 font-mono text-[11px]">Integration Ops</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-900">Security & IAM</td>
                  <td className="px-3 py-2">Identity & Access Control</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">GENERIC</span></td>
                  <td className="px-3 py-2">OAuth 2.0 / OIDC role-based permissions</td>
                  <td className="px-3 py-2 font-mono text-[11px]">Enterprise IT</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Actors & Controls */}
      {activeTab === 'ACTORS' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                21 Enterprise Business Actors & Authorization Limits
              </h3>
              <p className="text-xs text-slate-500">
                Strict segregation of duties enforcing maker-checker dual controls across all financial thresholds.
              </p>
            </div>
            <span className="text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded">
              Dual Authorization Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Role Title</th>
                  <th className="px-3 py-2">Approval Limit</th>
                  <th className="px-3 py-2">Dual Control Role</th>
                  <th className="px-3 py-2">Core Bounded Context Interactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-slate-800">
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-900">Sarah Jenkins</td>
                  <td className="px-3 py-2">Global Treasury Manager</td>
                  <td className="px-3 py-2 font-mono font-bold text-emerald-700">Up to $50,000,000</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-100 text-indigo-800">CHECKER</span></td>
                  <td className="px-3 py-2">Cash Realignment, Liquidity Optimization, Approval</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-900">David Vance</td>
                  <td className="px-3 py-2">Cash Manager</td>
                  <td className="px-3 py-2 font-mono text-slate-500">$0 (Proposer only)</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">MAKER</span></td>
                  <td className="px-3 py-2">Cash Position, Cash Realignment, Cash Funding</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-900">Elena Rostova</td>
                  <td className="px-3 py-2">Payment Operations Analyst</td>
                  <td className="px-3 py-2 font-mono text-slate-700">Up to $1,000,000</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">OPERATOR</span></td>
                  <td className="px-3 py-2">Payment Instruction, Payment Matching</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-900">Marcus Chen</td>
                  <td className="px-3 py-2">Financial Controller</td>
                  <td className="px-3 py-2 font-mono font-bold text-emerald-700">Up to $50,000,000</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-100 text-indigo-800">CHECKER</span></td>
                  <td className="px-3 py-2">General Ledger, Chart of Accounts, Period Close</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: 22 Bounded Contexts */}
      {activeTab === 'BOUNDED_CONTEXTS' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              22 Bounded Contexts & Aggregate Boundaries
            </h3>
            <p className="text-xs text-slate-500">
              Complete boundary specifications ensuring zero domain overlap and unambiguous aggregate root ownership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-navy-900 block">CashPositionContext</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Aggregate: CashPositionSnapshot</span>
              <span className="text-[10px] font-mono text-slate-600 mt-2 block">Consolidates book, available, free & restricted cash.</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-navy-900 block">CashRealignmentContext</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Aggregate: CashRealignment</span>
              <span className="text-[10px] font-mono text-slate-600 mt-2 block">Intercompany sweep proposals, limits, and execution.</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-navy-900 block">PaymentMatchingContext</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Aggregate: PaymentMatchGroup</span>
              <span className="text-[10px] font-mono text-slate-600 mt-2 block">Sub-second exact and tolerance matching engine.</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-navy-900 block">GeneralLedgerContext</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Aggregate: JournalEntry</span>
              <span className="text-[10px] font-mono text-slate-600 mt-2 block">Immutable double-entry subledger & Trial Balance.</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-navy-900 block">NostroManagementContext</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Aggregate: NostroAccount</span>
              <span className="text-[10px] font-mono text-slate-600 mt-2 block">Correspondent clearing accounts & daylight overdraft.</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-navy-900 block">ApprovalManagementContext</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Aggregate: ApprovalRequest</span>
              <span className="text-[10px] font-mono text-slate-600 mt-2 block">Matrix authority & maker-checker enforcement.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Microservices & Databases */}
      {activeTab === 'MICROSERVICES' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Microservices Catalog & Database-per-Service
            </h3>
            <p className="text-xs text-slate-500">
              Each microservice owns its private persistence schema. Cross-service data requests are served via APIs or Kafka CQRS projections.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2">Service Name</th>
                  <th className="px-3 py-2">Bounded Context</th>
                  <th className="px-3 py-2">Dedicated Database</th>
                  <th className="px-3 py-2">Published Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                <tr>
                  <td className="px-3 py-2 font-bold text-navy-900">cash-position-service</td>
                  <td className="px-3 py-2 font-sans">CashPositionContext</td>
                  <td className="px-3 py-2 text-teal-700">gcms_cash_pos_db</td>
                  <td className="px-3 py-2 text-slate-500">CashPositionCalculated</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-navy-900">cash-realignment-service</td>
                  <td className="px-3 py-2 font-sans">CashRealignmentContext</td>
                  <td className="px-3 py-2 text-teal-700">gcms_realignment_db</td>
                  <td className="px-3 py-2 text-slate-500">CashRealignmentProposed, CashRealignmentExecuted</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-navy-900">payment-matching-service</td>
                  <td className="px-3 py-2 font-sans">PaymentMatchingContext</td>
                  <td className="px-3 py-2 text-teal-700">gcms_payment_match_db</td>
                  <td className="px-3 py-2 text-slate-500">PaymentMatched, PaymentUnlinked</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-navy-900">journal-posting-service</td>
                  <td className="px-3 py-2 font-sans">GeneralLedgerContext</td>
                  <td className="px-3 py-2 text-teal-700">gcms_gl_subledger_db</td>
                  <td className="px-3 py-2 text-slate-500">JournalPosted, JournalReversed</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold text-navy-900">nostro-management-service</td>
                  <td className="px-3 py-2 font-sans">NostroManagementContext</td>
                  <td className="px-3 py-2 text-teal-700">gcms_nostro_db</td>
                  <td className="px-3 py-2 text-slate-500">NostroShortfallDetected</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Sagas & Compensations */}
      {activeTab === 'SAGAS' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Distributed Sagas & Reversing Compensations
            </h3>
            <p className="text-xs text-slate-500">
              Financial transactions cannot be rolled back via 2PC; failures initiate explicit reversing journal entries and return wires.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2">Step</th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2">Action Executed</th>
                  <th className="px-3 py-2">Failure Condition</th>
                  <th className="px-3 py-2">Compensating Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="px-3 py-2 font-bold">1</td>
                  <td className="px-3 py-2 font-mono text-[11px]">cash-position-service</td>
                  <td className="px-3 py-2">Lock available funds in source account</td>
                  <td className="px-3 py-2 text-rose-700 font-medium">Insufficient Available Balance</td>
                  <td className="px-3 py-2 text-slate-500">Release balance lock immediately</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold">2</td>
                  <td className="px-3 py-2 font-mono text-[11px]">payment-processing-service</td>
                  <td className="px-3 py-2">Dispatch Fedwire/SWIFT pacs.008</td>
                  <td className="px-3 py-2 text-rose-700 font-medium">Bank NAK / Clearing Cutoff Passed</td>
                  <td className="px-3 py-2 text-slate-500">Unlock source funds, emit SweepAborted</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold">3</td>
                  <td className="px-3 py-2 font-mono text-[11px]">journal-posting-service</td>
                  <td className="px-3 py-2">Post balanced double-entry GL journal</td>
                  <td className="px-3 py-2 text-rose-700 font-medium">Posting rejected / Closed period</td>
                  <td className="px-3 py-2 text-slate-500">Initiate compensating wire return to sender</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-bold">4</td>
                  <td className="px-3 py-2 font-mono text-[11px]">cash-position-service</td>
                  <td className="px-3 py-2">Commit balance delta on source & dest</td>
                  <td className="px-3 py-2 text-rose-700 font-medium">Database timeout</td>
                  <td className="px-3 py-2 text-slate-500">Post reversing journal entry (status: REVERSED)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: ADRs */}
      {activeTab === 'ADRS' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Architecture Decision Records (ADRs)
            </h3>
            <p className="text-xs text-slate-500">
              Formally documented architectural choices governing data integrity, resilience, and operational scalability.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">ADR-001: Strict Double-Entry Subledger for All Cash Operations</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">ACCEPTED</span>
              </div>
              <p className="text-slate-600 mt-1.5">
                Every cash realignment, funding, and adjustment operation MUST commit a balanced journal entry (Debits ≡ Credits) via JournalPostingContext. Direct balance field mutations without journal audit trails are strictly prohibited.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">ADR-002: Reversing Compensations Over Distributed 2PC</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">ACCEPTED</span>
              </div>
              <p className="text-slate-600 mt-1.5">
                External banking networks do not participate in distributed two-phase commits. Distributed transactions utilize Sagas with explicit compensating reversals, preserving full audit provenance.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">ADR-003: Database-per-Service Logical & Physical Isolation</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">ACCEPTED</span>
              </div>
              <p className="text-slate-600 mt-1.5">
                Each bounded context owns its dedicated database schema. Cross-service data sharing occurs strictly via REST APIs and Kafka CQRS projections to eliminate coupling.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">ADR-004: Arbitrary-Precision Decimal Standards for Currency</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">ACCEPTED</span>
              </div>
              <p className="text-slate-600 mt-1.5">
                Binary floating-point types (IEEE 754) are forbidden in all financial domain calculations. Values are represented with arbitrary precision (scale 4) using Banker's Rounding (HALF_EVEN).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Quality Gates */}
      {activeTab === 'QUALITY_GATES' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Architecture Quality Gates Verification
              </h3>
              <p className="text-xs text-slate-500">
                Independent architectural validation ensuring zero defects across financial and operational boundaries.
              </p>
            </div>
            <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded font-bold">
              100% Quality Gates Passed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Clear Bounded Contexts</span>
                <span className="text-slate-600 mt-0.5 block">15 major domains, 22 bounded contexts, zero overlapping authoritative data ownership.</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Authoritative Double-Entry Accounting</span>
                <span className="text-slate-600 mt-0.5 block">General Ledger isolated as sole mutator of subledger entries. Zero float drift across accounts.</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Maker-Checker Segregation of Duties</span>
                <span className="text-slate-600 mt-0.5 block">Enforced statefully at aggregate level; maker cannot approve own transactions.</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Decoupled Asynchronous Eventing</span>
                <span className="text-slate-600 mt-0.5 block">CloudEvents v1.0.2 schemas versioned with transactional outbox and Apache Kafka streaming.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
