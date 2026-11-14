import React, { useState } from 'react';
import { TreasuryProvider } from './context/TreasuryContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// 22 Enterprise Modules
import { DashboardView } from './components/modules/DashboardView';
import { CashPositionView } from './components/modules/CashPositionView';
import { CashRealignmentView } from './components/modules/CashRealignmentView';
import { CashFundingView } from './components/modules/CashFundingView';
import { CashAdjustmentView } from './components/modules/CashAdjustmentView';
import { CashFlowView } from './components/modules/CashFlowView';
import { CashProjectionView } from './components/modules/CashProjectionView';
import { FreeCashView } from './components/modules/FreeCashView';
import { PaymentMatchingView } from './components/modules/PaymentMatchingView';
import { ReconciliationView } from './components/modules/ReconciliationView';
import { BankAccountView } from './components/modules/BankAccountView';
import { NostroView } from './components/modules/NostroView';
import { EntityManagementView } from './components/modules/EntityManagementView';
import { LiquidityManagementView } from './components/modules/LiquidityManagementView';
import { AccountingLedgerView } from './components/modules/AccountingLedgerView';
import { MultiCurrencyView } from './components/modules/MultiCurrencyView';
import { ReportingAnalyticsView } from './components/modules/ReportingAnalyticsView';
import { OperationsWorkbenchView } from './components/modules/OperationsWorkbenchView';
import { ExceptionManagementView } from './components/modules/ExceptionManagementView';
import { ApprovalManagementView } from './components/modules/ApprovalManagementView';
import { AuditComplianceView } from './components/modules/AuditComplianceView';
import { BankingIntegrationSimulatorView } from './components/modules/BankingIntegrationSimulatorView';
import { ArchitectureBlueprintViewer } from './components/modules/ArchitectureBlueprintViewer';
import { PaymentFlowView } from './components/modules/PaymentFlowView';
import { TradeCashFlowProjectionView } from './components/modules/TradeCashFlowProjectionView';
import { KnowledgeBaseView } from './components/modules/KnowledgeBaseView';

function MainAppShell() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveModule} />;
      case 'cash-position':
        return <CashPositionView />;
      case 'cash-realignment':
        return <CashRealignmentView />;
      case 'cash-funding':
        return <CashFundingView />;
      case 'cash-adjustment':
        return <CashAdjustmentView />;
      case 'cash-flow':
        return <CashFlowView />;
      case 'cash-projection':
        return <CashProjectionView />;
      case 'free-cash':
        return <FreeCashView />;
      case 'payment-matching':
        return <PaymentMatchingView />;
      case 'reconciliation':
        return <ReconciliationView />;
      case 'bank-accounts':
        return <BankAccountView />;
      case 'nostro':
        return <NostroView />;
      case 'entities':
        return <EntityManagementView />;
      case 'liquidity':
        return <LiquidityManagementView />;
      case 'accounting-ledger':
        return <AccountingLedgerView />;
      case 'multi-currency':
        return <MultiCurrencyView />;
      case 'reporting':
        return <ReportingAnalyticsView />;
      case 'workbench':
        return <OperationsWorkbenchView onNavigate={setActiveModule} />;
      case 'exceptions':
        return <ExceptionManagementView />;
      case 'approvals':
        return <ApprovalManagementView />;
      case 'audit':
        return <AuditComplianceView />;
      case 'banking-simulator':
        return <BankingIntegrationSimulatorView />;
      case 'payment-flow':
        return <PaymentFlowView />;
      case 'trade-projections':
        return <TradeCashFlowProjectionView />;
      case 'knowledge-base':
        return <KnowledgeBaseView onNavigateTab={setActiveModule} />;
      case 'architecture-docs':
        return <ArchitectureBlueprintViewer />;
      default:
        return <DashboardView onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-[#F4F7FA] text-slate-900 antialiased overflow-hidden">
      {/* Enterprise Global Header */}
      <Header onNavigateModule={setActiveModule} />

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible 22-Module Navigation */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TreasuryProvider>
      <MainAppShell />
    </TreasuryProvider>
  );
}
