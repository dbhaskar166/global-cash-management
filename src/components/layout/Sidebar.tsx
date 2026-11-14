import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  CircleDollarSign,
  SlidersHorizontal,
  TrendingUp,
  BarChart4,
  PiggyBank,
  GitCompare,
  FileCheck2,
  Building2,
  Landmark,
  Network,
  Droplets,
  BookOpenCheck,
  Globe2,
  FileBarChart,
  Briefcase,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Terminal,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Ship,
  Workflow,
  GraduationCap,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';

export interface NavItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  category: 'OVERVIEW' | 'OPERATIONS' | 'PAYMENTS' | 'ACCOUNTING' | 'GOVERNANCE' | 'DOCS';
}

interface SidebarProps {
  activeModule: string;
  onSelectModule: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { approvalRequests, operationsTasks, exceptions } = useTreasury();

  const pendingApprovals = approvalRequests.filter((a) => a.status === 'PENDING').length;
  const pendingTasks = operationsTasks.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
  const openExceptions = exceptions.filter((e) => e.status !== 'RESOLVED').length;

  const navItems: NavItem[] = [
    // Category 1: Overview & Cash Position
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, category: 'OVERVIEW' },
    { id: 'cash-position', name: 'Cash Position', icon: Wallet, category: 'OVERVIEW' },
    { id: 'cash-projection', name: 'Cash Projection', icon: BarChart4, category: 'OVERVIEW' },
    { id: 'free-cash', name: 'Free Cash Management', icon: PiggyBank, category: 'OVERVIEW' },

    // Category 2: Treasury Operations & Liquidity
    { id: 'cash-realignment', name: 'Cash Realignment', icon: ArrowRightLeft, category: 'OPERATIONS' },
    { id: 'cash-funding', name: 'Cash Funding', icon: CircleDollarSign, category: 'OPERATIONS' },
    { id: 'cash-adjustment', name: 'Cash Adjustment', icon: SlidersHorizontal, category: 'OPERATIONS' },
    { id: 'cash-flow', name: 'Cash Flow Management', icon: TrendingUp, category: 'OPERATIONS' },
    { id: 'trade-projections', name: 'Trade & Cash Projections', icon: Ship, badge: 'New', category: 'OPERATIONS' },
    { id: 'liquidity', name: 'Liquidity Management', icon: Droplets, category: 'OPERATIONS' },

    // Category 3: Payments & Reconciliation
    { id: 'payment-flow', name: 'Payment Flow Engine', icon: Workflow, badge: 'Live', category: 'PAYMENTS' },
    { id: 'payment-matching', name: 'Payment Matching', icon: GitCompare, category: 'PAYMENTS' },
    { id: 'reconciliation', name: 'Reconciliation', icon: FileCheck2, category: 'PAYMENTS' },
    { id: 'nostro', name: 'Nostro Management', icon: Landmark, category: 'PAYMENTS' },
    { id: 'banking-simulator', name: 'Banking & ISO 20022', icon: Terminal, category: 'PAYMENTS' },

    // Category 4: Structure, Accounting & Currencies
    { id: 'bank-accounts', name: 'Bank Account Management', icon: Building2, category: 'ACCOUNTING' },
    { id: 'entities', name: 'Entity Management', icon: Network, category: 'ACCOUNTING' },
    { id: 'accounting-ledger', name: 'Accounting & GL', icon: BookOpenCheck, category: 'ACCOUNTING' },
    { id: 'multi-currency', name: 'Multi-Currency & FX', icon: Globe2, category: 'ACCOUNTING' },

    // Category 5: Operations, Governance & Control
    { id: 'workbench', name: 'Operations Workbench', icon: Briefcase, badge: pendingTasks, category: 'GOVERNANCE' },
    { id: 'exceptions', name: 'Exception Management', icon: AlertTriangle, badge: openExceptions, category: 'GOVERNANCE' },
    { id: 'approvals', name: 'Approval Management', icon: UserCheck, badge: pendingApprovals, category: 'GOVERNANCE' },
    { id: 'audit', name: 'Audit & Compliance', icon: ShieldCheck, category: 'GOVERNANCE' },
    { id: 'reporting', name: 'Reporting & Analytics', icon: FileBarChart, category: 'GOVERNANCE' },

    // Category 6: Architecture & Blueprint
    { id: 'knowledge-base', name: 'Treasury Knowledge Base', icon: GraduationCap, badge: 'Glossary', category: 'DOCS' },
    { id: 'architecture-docs', name: 'Architecture & DDD Spec', icon: BookOpen, badge: 'v3.0', category: 'DOCS' },
  ];

  const categories = [
    { id: 'OVERVIEW', label: 'Treasury Overview' },
    { id: 'OPERATIONS', label: 'Cash & Liquidity Operations' },
    { id: 'PAYMENTS', label: 'Payments & Settlement' },
    { id: 'ACCOUNTING', label: 'Structure & General Ledger' },
    { id: 'GOVERNANCE', label: 'Workbench & Controls' },
    { id: 'DOCS', label: 'Architecture & Blueprint' },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200/90 bg-slate-900 text-slate-300 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } shrink-0 select-none h-[calc(100vh-3.5rem)] overflow-hidden`}
    >
      {/* Module Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {categories.map((cat) => {
          const items = navItems.filter((item) => item.category === cat.id);
          return (
            <div key={cat.id} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {cat.label}
                </p>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectModule(item.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-400 font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {!isCollapsed && <span className="truncate">{item.name}</span>}

                    {item.badge !== undefined && Number(item.badge) > 0 && (
                      <span
                        className={`ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                          item.id === 'approvals'
                            ? 'bg-rose-500 text-white'
                            : item.id === 'exceptions'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-md bg-teal-400" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Quick Architecture Document Download in Footer */}
      {!isCollapsed && (
        <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/40">
          <a
            href="/api/v1/architecture-blueprint"
            download="GCMS_ENTERPRISE_ARCHITECTURE_DDD_BLUEPRINT.md"
            className="flex items-center justify-between text-[11px] text-teal-400 hover:text-teal-300 transition group"
            title="Download full architectural blueprint in Markdown format"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
              <span>Blueprint Spec (.md)</span>
            </span>
            <span className="font-mono text-[9px] bg-teal-950/80 text-teal-300 border border-teal-800/60 px-1 py-0.5 rounded">
              v3.0
            </span>
          </a>
        </div>
      )}

      {/* Collapse / Expand Toggle at Bottom */}
      <div className="border-t border-slate-800 p-2">
        <button
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
