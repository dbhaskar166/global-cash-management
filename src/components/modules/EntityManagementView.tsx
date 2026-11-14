import React, { useState } from 'react';
import {
  Network,
  Building2,
  ChevronRight,
  ChevronDown,
  DollarSign,
  ShieldCheck,
  Plus,
  Layers,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { LegalEntity } from '../../types/treasury';
import { convertFx } from '../../services/financialMath';

export const EntityManagementView: React.FC = () => {
  const { entities, bankAccounts, fxRates, selectedCurrency } = useTreasury();

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'ent-global-holding': true,
    'ent-americas-holding': true,
    'ent-emea-holding': true,
    'ent-apac-holding': true,
  });

  const [selectedEntity, setSelectedEntity] = useState<LegalEntity>(entities[0]);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toBase = (amount: number, ccy: string) => {
    return convertFx(amount, ccy as any, selectedCurrency, fxRates).convertedAmount;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Calculate consolidated cash rollups for an entity and all its descendants
  const getSubtreeEntityIds = (rootId: string): string[] => {
    const directChildren = entities.filter((e) => e.parentId === rootId).map((e) => e.id);
    const subChildren = directChildren.flatMap((cId) => getSubtreeEntityIds(cId));
    return [rootId, ...directChildren, ...subChildren];
  };

  const calculateEntityRollup = (entityId: string) => {
    const allIds = getSubtreeEntityIds(entityId);
    const relevantAccounts = bankAccounts.filter((a) => allIds.includes(a.entityId));
    const totalBook = relevantAccounts.reduce((s, a) => s + toBase(a.bookBalance, a.currency), 0);
    const totalAvail = relevantAccounts.reduce((s, a) => s + toBase(a.availableBalance, a.currency), 0);
    return { totalBook, totalAvail, accountCount: relevantAccounts.length };
  };

  // Build tree
  const rootEntities = entities.filter((e) => e.parentId === null);

  const renderEntityTree = (entity: LegalEntity, level: number = 0) => {
    const children = entities.filter((e) => e.parentId === entity.id);
    const isExpanded = expandedNodes[entity.id];
    const isSelected = selectedEntity.id === entity.id;
    const rollup = calculateEntityRollup(entity.id);

    return (
      <div key={entity.id} className="select-none">
        <div
          onClick={() => setSelectedEntity(entity)}
          className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition text-xs ${
            isSelected
              ? 'bg-navy-900 text-white font-semibold shadow-xs'
              : 'hover:bg-slate-100 text-slate-800'
          }`}
          style={{ paddingLeft: `${Math.max(12, level * 24)}px` }}
        >
          <div className="flex items-center gap-2">
            {children.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(entity.id);
                }}
                className="p-0.5 rounded hover:bg-black/10 text-current"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-4"></span>
            )}
            <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-300' : 'text-slate-400'}`} />
            <span className="truncate">{entity.name}</span>
            <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {entity.code}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className={isSelected ? 'text-teal-200' : 'text-slate-500'}>
              {rollup.accountCount} accts
            </span>
            <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(rollup.totalBook)}
            </span>
          </div>
        </div>

        {isExpanded && children.length > 0 && (
          <div className="space-y-0.5">
            {children.map((child) => renderEntityTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const selectedEntityRollup = calculateEntityRollup(selectedEntity.id);
  const selectedEntityAccounts = bankAccounts.filter((a) => a.entityId === selectedEntity.id);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Parent & Child Legal Entity Hierarchy
          </h1>
          <p className="text-xs text-slate-500">
            Multi-tier corporate governance, consolidation rollups, LEI registry, and intercompany credit ceilings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 bg-slate-100 rounded-md text-slate-700 font-semibold">
            15 Monitored Corporate Entities • 3 Tiers
          </span>
        </div>
      </div>

      {/* Main Grid: Tree vs Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Tree */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Corporate Structure Tree
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Consolidated Cash Rollup</span>
          </div>

          <div className="space-y-1">
            {rootEntities.map((root) => renderEntityTree(root, 0))}
          </div>
        </div>

        {/* Right: Selected Entity Inspector */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                {selectedEntity.type} • {selectedEntity.region}
              </span>
              <span className="text-xs font-mono text-slate-500">{selectedEntity.code}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedEntity.name}</h2>
            <p className="text-xs text-slate-500">
              {selectedEntity.country} • Timezone: {selectedEntity.timeZone} • Calendar: {selectedEntity.businessCalendar}
            </p>
          </div>

          {/* Rollup Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-[10px] uppercase font-bold text-slate-500">Consolidated Subtree Cash</p>
              <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {formatCurrency(selectedEntityRollup.totalBook)}
              </p>
              <p className="text-[10px] text-slate-400">Includes all child operating entities</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-[10px] uppercase font-bold text-slate-500">Subtree Available Cash</p>
              <p className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                {formatCurrency(selectedEntityRollup.totalAvail)}
              </p>
              <p className="text-[10px] text-slate-400">Immediate liquidity for realignments</p>
            </div>
          </div>

          {/* Statutory and Regulatory Identifiers */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3 rounded-lg border border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Legal Entity Identifier (LEI)</p>
              <p className="font-mono font-semibold text-slate-800 mt-0.5">{selectedEntity.lei}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Tax Identification Number</p>
              <p className="font-mono font-semibold text-slate-800 mt-0.5">{selectedEntity.taxId}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Accounting Standard</p>
              <p className="font-semibold text-slate-800 mt-0.5">{selectedEntity.accountingStandard}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Functional Currency</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedEntity.functionalCurrency}</p>
            </div>
          </div>

          {/* Intercompany Limits */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-600">External Credit Limit:</span>
              <span className="font-bold text-slate-900">{formatCurrency(selectedEntity.creditLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Bilateral Intercompany Limit:</span>
              <span className="font-bold text-slate-900">{formatCurrency(selectedEntity.intercompanyLimit)}</span>
            </div>
          </div>

          {/* Connected Bank Accounts for this entity */}
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-700 mb-2">
              Assigned Bank Accounts ({selectedEntityAccounts.length})
            </h3>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {selectedEntityAccounts.map((acc) => (
                <div key={acc.id} className="p-2 rounded border border-slate-200 bg-white flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{acc.accountName}</span>
                    <div className="text-[10px] text-slate-400 font-mono">{acc.iban}</div>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(toBase(acc.bookBalance, acc.currency))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
