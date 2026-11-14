import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  DollarSign,
  Search,
  Bell,
  CheckSquare,
  UserCheck,
  ShieldAlert,
  RotateCcw,
  Landmark,
  ChevronDown,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { CurrencyCode } from '../../types/treasury';

interface HeaderProps {
  onNavigateModule: (moduleId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateModule }) => {
  const {
    selectedEntityId,
    setSelectedEntityId,
    selectedAccountId,
    setSelectedAccountId,
    selectedCurrency,
    setSelectedCurrency,
    selectedBusinessDate,
    setSelectedBusinessDate,
    searchQuery,
    setSearchQuery,
    currentUser,
    switchUser,
    availableUsers,
    entities,
    bankAccounts,
    approvalRequests,
    operationsTasks,
    resetAllData,
  } = useTreasury();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const pendingApprovalsCount = approvalRequests.filter((a) => a.status === 'PENDING').length;
  const pendingTasksCount = operationsTasks.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

  const currencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SGD', 'INR', 'AED'];

  // Filter accounts based on entity
  const visibleAccounts = bankAccounts.filter((a) =>
    selectedEntityId === 'ALL' ? true : a.entityId === selectedEntityId
  );

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md shadow-2xs">
      {/* Brand & Left Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white shadow-xs">
            <Landmark className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-slate-900">GCMS</span>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded px-1 py-0.2">
                GLOBAL TREASURY
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Multi-Entity Cash & Operations Platform
            </p>
          </div>
        </div>

        {/* Environment Badge */}
        <div className="hidden lg:flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-mono text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>PROD-SIMULATION</span>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="hidden md:flex items-center gap-2">
        {/* Global Search */}
        <div className="relative w-44 lg:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Global search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1 text-xs bg-slate-100/80 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-navy-600 transition"
          />
        </div>

        {/* Entity Selector */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedEntityId}
            onChange={(e) => {
              setSelectedEntityId(e.target.value);
              setSelectedAccountId('ALL'); // Reset account filter if entity changes
            }}
            className="bg-transparent text-xs font-medium text-slate-800 focus:outline-hidden cursor-pointer max-w-[150px] truncate"
            aria-label="Select Legal Entity"
          >
            <option value="ALL">All Entities (Consolidated)</option>
            <optgroup label="Parent Holding Entities">
              {entities
                .filter((e) => e.type === 'HOLDING' || e.type === 'REGIONAL_HOLDING')
                .map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.code} - {ent.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Operating Child Entities">
              {entities
                .filter((e) => e.type !== 'HOLDING' && e.type !== 'REGIONAL_HOLDING')
                .map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.code} - {ent.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>

        {/* Account Selector */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
          <Landmark className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-800 focus:outline-hidden cursor-pointer max-w-[140px] truncate"
            aria-label="Select Bank Account"
          >
            <option value="ALL">All Bank Accounts ({visibleAccounts.length})</option>
            {visibleAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.currency} • {acc.accountName.slice(0, 22)}...
              </option>
            ))}
          </select>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
          <DollarSign className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
            className="bg-transparent text-xs font-bold font-mono text-slate-800 focus:outline-hidden cursor-pointer"
            aria-label="Select Base Currency"
          >
            {currencies.map((ccy) => (
              <option key={ccy} value={ccy}>
                {ccy}
              </option>
            ))}
          </select>
        </div>

        {/* Business Date */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="date"
            value={selectedBusinessDate}
            onChange={(e) => setSelectedBusinessDate(e.target.value)}
            className="bg-transparent text-xs font-mono text-slate-800 focus:outline-hidden cursor-pointer"
            aria-label="Select Business Date"
          />
        </div>
      </div>

      {/* Right Controls: Notifications, Task Inbox, User Persona Switcher */}
      <div className="flex items-center gap-2">
        {/* Architecture & DDD Docs Button */}
        <button
          onClick={() => onNavigateModule('architecture-docs')}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-navy-950 bg-teal-50 hover:bg-teal-100/90 border border-teal-200 transition shadow-2xs cursor-pointer"
          title="Global Cash Management System (GCMS) Architecture & DDD Blueprint"
        >
          <BookOpen className="w-3.5 h-3.5 text-teal-700" />
          <span className="hidden sm:inline font-sans">Architecture Docs</span>
        </button>

        {/* Knowledge Base Button */}
        <button
          onClick={() => onNavigateModule('knowledge-base')}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-950 bg-indigo-50 hover:bg-indigo-100/90 border border-indigo-200 transition shadow-2xs cursor-pointer"
          title="Open Treasury Knowledge Base & Business Flow Glossary"
        >
          <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />
          <span className="hidden lg:inline font-sans">Knowledge Base</span>
        </button>

        {/* Task Inbox */}
        <button
          onClick={() => onNavigateModule('workbench')}
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
          title="Operations Workbench Task Inbox"
          aria-label="Operations Task Inbox"
        >
          <CheckSquare className="w-4 h-4" />
          {pendingTasksCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-xs">
              {pendingTasksCount}
            </span>
          )}
        </button>

        {/* Approvals Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
            title="Pending Approvals & Alerts"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-900">Pending Approvals Queue</span>
                <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-800">
                  {pendingApprovalsCount} Pending
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {approvalRequests
                  .filter((a) => a.status === 'PENDING')
                  .slice(0, 4)
                  .map((req) => (
                    <div
                      key={req.id}
                      onClick={() => {
                        onNavigateModule('approvals');
                        setShowNotifications(false);
                      }}
                      className="cursor-pointer rounded-lg border border-slate-100 bg-slate-50/70 p-2 hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800">{req.workflowType}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {req.amount.toLocaleString()} {req.currency}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Maker: {req.makerName} • Req: {req.requiredRole}
                      </p>
                    </div>
                  ))}
              </div>
              <div className="mt-2 border-t border-slate-100 pt-2 text-center">
                <button
                  onClick={() => {
                    onNavigateModule('approvals');
                    setShowNotifications(false);
                  }}
                  className="text-xs font-medium text-teal-700 hover:text-teal-800"
                >
                  View All Approvals in Maker-Checker Hub →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Persona & Maker-Checker Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs hover:bg-slate-100 transition"
            aria-label="Switch User Persona"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-800 text-white font-bold text-[10px]">
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-semibold text-slate-900 text-[11px] leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                {currentUser.role} {currentUser.canApprove ? '• (Checker)' : '• (Maker)'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="border-b border-slate-100 px-3 py-1.5 mb-1">
                <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                  Select Operator Persona
                </p>
                <p className="text-[10px] text-slate-500">
                  Switch between Maker & Checker to test segregation of duties
                </p>
              </div>
              <div className="space-y-1">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                      currentUser.id === u.id
                        ? 'bg-navy-50 font-bold text-navy-900 border border-navy-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-[10px] text-slate-500">{u.role}</p>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        u.canApprove ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {u.canApprove ? 'Checker' : 'Maker'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 mt-2 pt-2 px-1">
                <button
                  onClick={() => {
                    resetAllData();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-rose-700 hover:bg-rose-50 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Ledger & Seed Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
