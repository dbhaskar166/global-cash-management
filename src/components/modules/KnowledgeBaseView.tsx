import React, { useState, useMemo } from 'react';
import { KNOWLEDGE_BASE_ARTICLES } from '../../services/knowledgeBaseData';
import { KnowledgeBaseArticle } from '../../types/treasury';
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Building,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Layers,
  FileText,
  Calculator,
} from 'lucide-react';

interface KnowledgeBaseViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ onNavigateTab }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedArticleId, setExpandedArticleId] = useState<string>(
    KNOWLEDGE_BASE_ARTICLES[0]?.id || ''
  );

  const categories = [
    { key: 'ALL', label: 'All Topics' },
    { key: 'REALIGNMENT', label: 'Cash Realignment' },
    { key: 'CASH_POSITION', label: 'Cash Position' },
    { key: 'ADJUSTMENT', label: 'Cash Adjustment' },
    { key: 'FUNDING', label: 'Cash Funding' },
    { key: 'MATCHING', label: 'Payment Matching' },
    { key: 'NOSTRO', label: 'Nostro & Vostro' },
    { key: 'POOLING', label: 'Cash Pooling' },
    { key: 'GOVERNANCE', label: 'Maker-Checker' },
  ];

  const filteredArticles = useMemo(() => {
    return KNOWLEDGE_BASE_ARTICLES.filter((article) => {
      const matchCat = selectedCategory === 'ALL' || article.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        article.title.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        article.definition.toLowerCase().includes(q) ||
        article.workedExample.scenario.toLowerCase().includes(q) ||
        article.keyTakeaways.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedArticleId(expandedArticleId === id ? '' : id);
  };

  const getModuleLinkForCategory = (category: KnowledgeBaseArticle['category']) => {
    switch (category) {
      case 'REALIGNMENT':
        return { tab: 'realignments', label: 'Open Cash Realignment Engine' };
      case 'CASH_POSITION':
        return { tab: 'position', label: 'Open Real-Time Cash Position' };
      case 'ADJUSTMENT':
        return { tab: 'adjustments', label: 'Open Cash Adjustment Ledger' };
      case 'FUNDING':
        return { tab: 'funding', label: 'Open Cash Funding Workflow' };
      case 'MATCHING':
        return { tab: 'reconciliation', label: 'Open Payment Matching Engine' };
      case 'NOSTRO':
        return { tab: 'nostro', label: 'Open Nostro Accounts Dashboard' };
      case 'POOLING':
        return { tab: 'position', label: 'View Liquidity Pools' };
      case 'GOVERNANCE':
        return { tab: 'approvals', label: 'Open Dual Control Approvals' };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Treasury Knowledge Base & Business Flow Glossary
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Corporate Standard
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative corporate treasury definitions, mathematical calculation formulas, operational lifecycles, and worked numerical examples with double-entry accounting journals.
          </p>
        </div>
      </div>

      {/* Search and Category Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search concepts, formulas, accounting journals, or worked examples (e.g., 'realignment', 'overdraft', 'nostro', 'ZBA')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Overview Callout Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> Core Treasury Distinction Guide
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="font-bold text-amber-300 text-sm mb-1">What is Cash Realignment?</div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Internal fund movement</strong> between your company's own accounts (subsidiary operating accounts ↔ master concentration pool) to rebalance cash and eliminate idle drag without changing net corporate equity.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="font-bold text-emerald-300 text-sm mb-1">What is Cash Adjustment?</div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Balance correction entry</strong> to rectify discrepancies between internal ledger records and bank statements (e.g. unrecorded bank fees, interest accruals, or manual GL posting fixes) with full maker-checker auditability.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="font-bold text-cyan-300 text-sm mb-1">What is Cash Position?</div>
            <p className="text-slate-300 leading-relaxed">
              The <strong>multi-layered calculation</strong> of available liquidity: Book Balance minus Pending Outflows plus Inflows minus Regulatory/Collateral Reserves, revealing exactly how much free cash is deployable today.
            </p>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {filteredArticles.map((article) => {
          const isExpanded = expandedArticleId === article.id;
          const navTarget = getModuleLinkForCategory(article.category);

          return (
            <div
              key={article.id}
              className={`bg-white rounded-xl border transition-all shadow-sm overflow-hidden ${
                isExpanded ? 'border-indigo-400 ring-1 ring-indigo-300' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Collapsed Header / Clickable Bar */}
              <div
                onClick={() => toggleExpand(article.id)}
                className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {article.id}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {article.category.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{article.title}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                    {article.summary}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <span>Hide Details</span>
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>View Worked Example</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Deep-Dive Body */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-5 bg-slate-50/30">
                  {/* Definition & Strategic Value */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Formal Definition
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{article.definition}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Strategic Value & Risk Mitigation
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{article.whyItMatters}</p>
                    </div>
                  </div>

                  {/* Formula Callout */}
                  {article.formulaOrRule && (
                    <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1 font-mono text-xs">
                      <div className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Calculator className="w-4 h-4" /> Mathematical Formula / Business Rule
                      </div>
                      <div className="text-slate-200 pt-1 leading-relaxed">{article.formulaOrRule}</div>
                    </div>
                  )}

                  {/* Comprehensive Worked Numerical Example Card */}
                  <div className="bg-white rounded-xl border border-indigo-200 p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                      <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" /> Corporate Scenario Walkthrough with Real Numbers
                      </span>
                      <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                        Worked Case Study
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                      <strong>Scenario: </strong> {article.workedExample.scenario}
                    </p>

                    {/* Before & After Comparison Table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Before Numbers */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Baseline Before Action
                        </div>
                        <div className="p-3 space-y-1.5 text-xs font-mono">
                          {Object.entries(article.workedExample.beforeNumbers).map(([label, val]) => (
                            <div key={label} className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="text-slate-500 font-sans">{label}:</span>
                              <span className="font-bold text-slate-900">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* After Numbers */}
                      <div className="border border-emerald-200 rounded-lg overflow-hidden bg-emerald-50/20">
                        <div className="bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                          Resulting Balance After Action
                        </div>
                        <div className="p-3 space-y-1.5 text-xs font-mono">
                          {Object.entries(article.workedExample.afterNumbers).map(([label, val]) => (
                            <div key={label} className="flex justify-between border-b border-emerald-100 pb-1">
                              <span className="text-slate-600 font-sans">{label}:</span>
                              <span className="font-bold text-emerald-800">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Action Sequence */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Operational Step-by-Step Execution Sequence
                      </div>
                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {article.workedExample.actionSteps.map((step, idx) => (
                          <div key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Accounting Journal Entry */}
                    {article.workedExample.accountingJournal && (
                      <div className="bg-slate-900 text-white p-3.5 rounded-lg font-mono text-xs space-y-2">
                        <div className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                          Double-Entry General Ledger Journal Entry
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="text-rose-300 font-bold">DR (Debit): </span>
                            <span>{article.workedExample.accountingJournal.debit}</span>
                          </div>
                          <div>
                            <span className="text-emerald-300 font-bold">CR (Credit): </span>
                            <span>{article.workedExample.accountingJournal.credit}</span>
                          </div>
                        </div>
                        <div className="text-white font-bold border-t border-slate-800 pt-1.5">
                          Total Balanced Amount: {article.workedExample.accountingJournal.amount}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Key Governance Takeaways & Module Link */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Audit & Policy Rules
                      </div>
                      <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                        {article.keyTakeaways.map((takeaway, idx) => (
                          <li key={idx}>{takeaway}</li>
                        ))}
                      </ul>
                    </div>

                    {navTarget && onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab(navTarget.tab)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs shrink-0"
                      >
                        <span>{navTarget.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
