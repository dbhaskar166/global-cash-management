import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  CurrencyCode,
  LegalEntity,
  BankAccount,
  FxRate,
  CashRealignment,
  CashFunding,
  CashAdjustment,
  CashFlow,
  PaymentTransaction,
  BankStatementLine,
  NostroAccount,
  ChartOfAccountItem,
  JournalEntry,
  OperationsTask,
  SystemException,
  ApprovalRequest,
  AuditLogEntry,
  LiquidityPool,
  ISO20022Message,
  UserProfile,
  TradeProjection,
  PaymentFlowTrack,
  PaymentFlowHop,
} from '../types/treasury';
import {
  initialEntities,
  initialBankAccounts,
  initialFxRates,
  initialRealignments,
  initialCashFunding,
  initialCashAdjustments,
  initialCashFlows,
  initialPaymentTransactions,
  initialStatementLines,
  initialNostroAccounts,
  initialChartOfAccounts,
  initialJournalEntries,
  initialOperationsTasks,
  initialExceptions,
  initialApprovalRequests,
  initialAuditLogs,
  initialLiquidityPools,
  initialISO20022Messages,
  availableUserProfiles,
} from '../services/mockData';
import { INITIAL_TRADE_PROJECTIONS } from '../services/tradeProjectionData';
import { INITIAL_PAYMENT_FLOW_TRACKS } from '../services/paymentFlowData';
import {
  convertFx,
  validateMakerCheckerApproval,
  validateDoubleEntryBalance,
  matchPaymentWithStatementLine,
} from '../services/financialMath';

interface TreasuryContextType {
  // Filters & Global state
  selectedEntityId: string;
  setSelectedEntityId: (id: string) => void;
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (ccy: CurrencyCode) => void;
  selectedBusinessDate: string;
  setSelectedBusinessDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Active User Profile & Role Switcher
  currentUser: UserProfile;
  switchUser: (userId: string) => void;
  availableUsers: UserProfile[];

  // Data Collections
  entities: LegalEntity[];
  bankAccounts: BankAccount[];
  fxRates: FxRate[];
  realignments: CashRealignment[];
  fundings: CashFunding[];
  adjustments: CashAdjustment[];
  cashFlows: CashFlow[];
  payments: PaymentTransaction[];
  statementLines: BankStatementLine[];
  nostroAccounts: NostroAccount[];
  chartOfAccounts: ChartOfAccountItem[];
  journalEntries: JournalEntry[];
  operationsTasks: OperationsTask[];
  exceptions: SystemException[];
  approvalRequests: ApprovalRequest[];
  auditLogs: AuditLogEntry[];
  liquidityPools: LiquidityPool[];
  iso20022Messages: ISO20022Message[];
  tradeProjections: TradeProjection[];
  paymentFlowTracks: PaymentFlowTrack[];

  // Module Actions
  createRealignment: (proposal: Partial<CashRealignment>) => { success: boolean; error?: string };
  submitRealignment: (id: string) => { success: boolean; error?: string };
  approveRealignment: (id: string) => { success: boolean; error?: string };
  executeRealignment: (id: string) => { success: boolean; error?: string };
  rejectRealignment: (id: string, reason: string) => { success: boolean; error?: string };

  createFunding: (funding: Partial<CashFunding>) => { success: boolean; error?: string };
  approveFunding: (id: string) => { success: boolean; error?: string };
  executeFunding: (id: string) => { success: boolean; error?: string };

  createAdjustment: (adj: Partial<CashAdjustment>) => { success: boolean; error?: string };
  approveAdjustment: (id: string) => { success: boolean; error?: string };
  postAdjustment: (id: string) => { success: boolean; error?: string };
  reverseAdjustment: (id: string, reason: string) => { success: boolean; error?: string };

  createCashFlow: (flow: Partial<CashFlow>) => { success: boolean; error?: string };

  matchPaymentManually: (paymentId: string, statementLineId: string) => { success: boolean; error?: string };
  unmatchPayment: (paymentId: string) => { success: boolean; error?: string };
  runAutoPaymentMatching: () => { matchedCount: number };

  resolveOperationsTask: (taskId: string, notes?: string) => { success: boolean };
  resolveException: (excId: string, rootCause: string, summary: string) => { success: boolean };

  approveGenericRequest: (requestId: string) => { success: boolean; error?: string };
  rejectGenericRequest: (requestId: string, reason: string) => { success: boolean; error?: string };

  // Trade Projections & Payment Flow Operations
  addTradeProjection: (projection: Partial<TradeProjection>) => { success: boolean; error?: string };
  advancePaymentHop: (paymentId: string) => { success: boolean; error?: string };
  addPaymentFlowTrack: (track: Partial<PaymentFlowTrack>) => { success: boolean; error?: string };

  // Simulation Harness
  simulateIncomingPayment: (amount: number, ccy: CurrencyCode, debtor: string, creditor: string) => void;
  simulateStatementIngestion: (iban: string, amount: number, direction: 'CREDIT' | 'DEBIT', ref: string) => void;
  simulateFxFluctuation: () => void;
  resetAllData: () => void;
}

const TreasuryContext = createContext<TreasuryContextType | null>(null);

export const TreasuryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global Filters
  const [selectedEntityId, setSelectedEntityId] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [selectedBusinessDate, setSelectedBusinessDate] = useState<string>('2026-11-05');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(availableUserProfiles[0]);

  // Master State
  const [entities, setEntities] = useState<LegalEntity[]>(initialEntities);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [fxRates, setFxRates] = useState<FxRate[]>(initialFxRates);
  const [realignments, setRealignments] = useState<CashRealignment[]>(initialRealignments);
  const [fundings, setFundings] = useState<CashFunding[]>(initialCashFunding);
  const [adjustments, setAdjustments] = useState<CashAdjustment[]>(initialCashAdjustments);
  const [cashFlows, setCashFlows] = useState<CashFlow[]>(initialCashFlows);
  const [payments, setPayments] = useState<PaymentTransaction[]>(initialPaymentTransactions);
  const [statementLines, setStatementLines] = useState<BankStatementLine[]>(initialStatementLines);
  const [nostroAccounts, setNostroAccounts] = useState<NostroAccount[]>(initialNostroAccounts);
  const [chartOfAccounts] = useState<ChartOfAccountItem[]>(initialChartOfAccounts);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialJournalEntries);
  const [operationsTasks, setOperationsTasks] = useState<OperationsTask[]>(initialOperationsTasks);
  const [exceptions, setExceptions] = useState<SystemException[]>(initialExceptions);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(initialApprovalRequests);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>(initialLiquidityPools);
  const [iso20022Messages, setIso20022Messages] = useState<ISO20022Message[]>(initialISO20022Messages);
  const [tradeProjections, setTradeProjections] = useState<TradeProjection[]>(INITIAL_TRADE_PROJECTIONS);
  const [paymentFlowTracks, setPaymentFlowTracks] = useState<PaymentFlowTrack[]>(INITIAL_PAYMENT_FLOW_TRACKS);

  // Switch User Profile
  const switchUser = useCallback((userId: string) => {
    const found = availableUserProfiles.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      addAuditLog('USER_SWITCH_ROLE', `Switched active operator persona to ${found.name} (${found.role})`);
    }
  }, []);

  // Internal Audit Log Helper
  const addAuditLog = useCallback((action: string, afterValue: string, entityId?: string, transactionId?: string, moduleName: string = 'SYSTEM') => {
    const newEntry: AuditLogEntry = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entityId,
      transactionId,
      module: moduleName,
      afterValue,
      sourceIp: '10.240.12.88',
      correlationId: `CORR-${Math.floor(1000000 + Math.random() * 9000000)}`,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  }, [currentUser]);

  // Cash Realignment Actions
  const createRealignment = useCallback((proposal: Partial<CashRealignment>) => {
    const sourceAcc = bankAccounts.find((a) => a.id === proposal.sourceAccountId);
    const destAcc = bankAccounts.find((a) => a.id === proposal.destinationAccountId);

    if (!sourceAcc || !destAcc) {
      return { success: false, error: 'Source or destination bank account not found.' };
    }

    const amt = proposal.amount || 0;
    if (amt <= 0) {
      return { success: false, error: 'Realignment amount must be greater than zero.' };
    }

    if (sourceAcc.availableBalance < amt) {
      return { success: false, error: `Insufficient available funds in source account. Available: ${sourceAcc.availableBalance.toLocaleString()} ${sourceAcc.currency}` };
    }

    const conversion = convertFx(amt, sourceAcc.currency, destAcc.currency, fxRates);

    const newRealignment: CashRealignment = {
      id: `REALIGN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      businessDate: selectedBusinessDate,
      sourceEntityId: sourceAcc.entityId,
      sourceAccountId: sourceAcc.id,
      sourceCurrency: sourceAcc.currency,
      sourceAvailableBalance: sourceAcc.availableBalance,
      destinationEntityId: destAcc.entityId,
      destinationAccountId: destAcc.id,
      destinationCurrency: destAcc.currency,
      destinationBalance: destAcc.bookBalance,
      amount: amt,
      fxRate: conversion.rateUsed,
      convertedAmount: conversion.convertedAmount,
      realignmentType: proposal.realignmentType || 'INTERCOMPANY_TRANSFER',
      priority: proposal.priority || 'HIGH',
      reason: proposal.reason || 'Liquidity optimization and balancing transfer',
      executionDate: selectedBusinessDate,
      valueDate: selectedBusinessDate,
      status: 'PROPOSED',
      makerId: currentUser.id,
      makerName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setRealignments((prev) => [newRealignment, ...prev]);

    // Create Approval Queue item
    const approvalReq: ApprovalRequest = {
      id: `APPR-${Date.now()}`,
      workflowType: 'CASH_REALIGNMENT',
      referenceId: newRealignment.id,
      entityId: sourceAcc.entityId,
      entityName: entities.find((e) => e.id === sourceAcc.entityId)?.name || 'Entity',
      amount: amt,
      currency: sourceAcc.currency,
      makerId: currentUser.id,
      makerName: currentUser.name,
      makerRole: currentUser.role,
      submissionDate: new Date().toISOString(),
      requiredRole: 'Global Treasury Manager',
      status: 'PENDING',
      urgency: newRealignment.priority === 'CRITICAL' ? 'URGENT' : 'NORMAL',
    };
    setApprovalRequests((prev) => [approvalReq, ...prev]);

    addAuditLog(
      'CREATE_REALIGNMENT',
      `Proposed realignment ${newRealignment.id}: ${amt} ${sourceAcc.currency} -> ${destAcc.accountName}`,
      sourceAcc.entityId,
      newRealignment.id,
      'CASH_REALIGNMENT'
    );

    return { success: true };
  }, [bankAccounts, fxRates, selectedBusinessDate, currentUser, entities, addAuditLog]);

  const submitRealignment = useCallback((id: string) => {
    setRealignments((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'PENDING_APPROVAL' } : r))
    );
    addAuditLog('SUBMIT_REALIGNMENT', `Realignment ${id} submitted for checker approval`, undefined, id, 'CASH_REALIGNMENT');
    return { success: true };
  }, [addAuditLog]);

  const approveRealignment = useCallback((id: string) => {
    const item = realignments.find((r) => r.id === id);
    if (!item) return { success: false, error: 'Realignment not found' };

    // Maker-checker segregation check
    const validation = validateMakerCheckerApproval(
      item.makerId,
      currentUser.id,
      currentUser.canApprove,
      item.amount, // in base
      currentUser.approvalThresholdUSD
    );

    if (!validation.allowed) {
      return { success: false, error: validation.reason };
    }

    setRealignments((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'APPROVED',
              checkerId: currentUser.id,
              checkerName: currentUser.name,
            }
          : r
      )
    );

    // Update approval request
    setApprovalRequests((prev) =>
      prev.map((a) =>
        a.referenceId === id
          ? {
              ...a,
              status: 'APPROVED',
              approverId: currentUser.id,
              approverName: currentUser.name,
              approvalDate: new Date().toISOString(),
            }
          : a
      )
    );

    addAuditLog('APPROVE_REALIGNMENT', `Approved realignment ${id} by ${currentUser.name}`, item.sourceEntityId, id, 'APPROVAL_WORKFLOW');
    return { success: true };
  }, [realignments, currentUser, addAuditLog]);

  const executeRealignment = useCallback((id: string) => {
    const item = realignments.find((r) => r.id === id);
    if (!item) return { success: false, error: 'Realignment not found' };

    if (item.status !== 'APPROVED' && item.status !== 'PROPOSED') {
      return { success: false, error: `Cannot execute realignment in status ${item.status}` };
    }

    const sourceAcc = bankAccounts.find((a) => a.id === item.sourceAccountId);
    const destAcc = bankAccounts.find((a) => a.id === item.destinationAccountId);

    if (!sourceAcc || !destAcc) {
      return { success: false, error: 'Associated accounts not located.' };
    }

    // Adjust Account Balances
    setBankAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === sourceAcc.id) {
          const newBook = acc.bookBalance - item.amount;
          const newAvail = acc.availableBalance - item.amount;
          return { ...acc, bookBalance: newBook, availableBalance: newAvail };
        }
        if (acc.id === destAcc.id) {
          const newBook = acc.bookBalance + item.convertedAmount;
          const newAvail = acc.availableBalance + item.convertedAmount;
          return { ...acc, bookBalance: newBook, availableBalance: newAvail };
        }
        return acc;
      })
    );

    // Create balanced double-entry Journal Entry
    const journalId = `jn-realign-${Date.now()}`;
    const newJournal: JournalEntry = {
      id: journalId,
      journalNumber: `JE-REALIGN-${Date.now()}`,
      accountingEventId: `EVT-${item.id}`,
      entityId: item.sourceEntityId,
      ledger: 'PRIMARY',
      accountingDate: selectedBusinessDate,
      valueDate: selectedBusinessDate,
      currency: item.sourceCurrency,
      totalDebit: item.amount,
      totalCredit: item.amount,
      lines: [
        {
          id: `line-1-${Date.now()}`,
          glAccount: destAcc.glAccountMapping.split('-')[0] || '10100',
          glAccountName: `Cash Transfer Debit (${destAcc.currency})`,
          description: `Transfer to ${destAcc.accountName}`,
          debit: item.amount,
          credit: 0,
          currency: item.sourceCurrency,
        },
        {
          id: `line-2-${Date.now()}`,
          glAccount: sourceAcc.glAccountMapping.split('-')[0] || '10100',
          glAccountName: `Cash Transfer Credit (${sourceAcc.currency})`,
          description: `Disbursement from ${sourceAcc.accountName}`,
          debit: 0,
          credit: item.amount,
          currency: item.sourceCurrency,
        },
      ],
      transactionReference: item.id,
      sourceSystem: 'GCMS_REALIGNMENT',
      postingStatus: 'POSTED',
      makerId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    setJournalEntries((prev) => [newJournal, ...prev]);

    // Update Realignment Status
    setRealignments((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'COMPLETED',
              journalEntryId: journalId,
            }
          : r
      )
    );

    addAuditLog(
      'EXECUTE_REALIGNMENT',
      `Executed ${item.id}: Debited ${sourceAcc.accountName} ${item.amount} ${sourceAcc.currency}, Credited ${destAcc.accountName} ${item.convertedAmount} ${destAcc.currency}. Posted JE: ${newJournal.journalNumber}`,
      item.sourceEntityId,
      item.id,
      'CASH_REALIGNMENT'
    );

    return { success: true };
  }, [realignments, bankAccounts, selectedBusinessDate, currentUser, addAuditLog]);

  const rejectRealignment = useCallback((id: string, reason: string) => {
    setRealignments((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED', rejectionReason: reason } : r))
    );
    setApprovalRequests((prev) =>
      prev.map((a) => (a.referenceId === id ? { ...a, status: 'REJECTED', rejectionReason: reason } : a))
    );
    addAuditLog('REJECT_REALIGNMENT', `Rejected realignment ${id}: ${reason}`, undefined, id, 'APPROVAL_WORKFLOW');
    return { success: true };
  }, [addAuditLog]);

  // Cash Funding Actions
  const createFunding = useCallback((funding: Partial<CashFunding>) => {
    const acc = bankAccounts.find((a) => a.id === funding.accountId);
    if (!acc) return { success: false, error: 'Target account not found' };

    const newFunding: CashFunding = {
      id: `FUND-REQ-${Date.now()}`,
      businessDate: selectedBusinessDate,
      entityId: acc.entityId,
      accountId: acc.id,
      currency: acc.currency,
      fundingType: funding.fundingType || 'INTERCOMPANY',
      deficitAmount: funding.deficitAmount || 1000000,
      requiredAmount: funding.requiredAmount || 1000000,
      minimumRequiredCash: acc.minimumBalance,
      currentAvailableCash: acc.availableBalance,
      priority: funding.priority || 'HIGH',
      status: 'PENDING_APPROVAL',
      makerId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    setFundings((prev) => [newFunding, ...prev]);
    addAuditLog('CREATE_FUNDING', `Funding request created for ${acc.accountName}: ${newFunding.requiredAmount} ${acc.currency}`, acc.entityId, newFunding.id, 'CASH_FUNDING');
    return { success: true };
  }, [bankAccounts, selectedBusinessDate, currentUser, addAuditLog]);

  const approveFunding = useCallback((id: string) => {
    if (!currentUser.canApprove) {
      return { success: false, error: 'User does not possess checker approval rights.' };
    }
    setFundings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'APPROVED', checkerId: currentUser.id } : f))
    );
    addAuditLog('APPROVE_FUNDING', `Approved funding request ${id}`, undefined, id, 'CASH_FUNDING');
    return { success: true };
  }, [currentUser, addAuditLog]);

  const executeFunding = useCallback((id: string) => {
    const item = fundings.find((f) => f.id === id);
    if (!item) return { success: false, error: 'Funding request not found' };

    const acc = bankAccounts.find((a) => a.id === item.accountId);
    if (!acc) return { success: false, error: 'Account not found' };

    // Credit destination account
    setBankAccounts((prev) =>
      prev.map((a) => (a.id === acc.id ? { ...a, bookBalance: a.bookBalance + item.requiredAmount, availableBalance: a.availableBalance + item.requiredAmount } : a))
    );

    // Create journal entry
    const newJe: JournalEntry = {
      id: `jn-fund-${Date.now()}`,
      journalNumber: `JE-FUND-${Date.now()}`,
      accountingEventId: `EVT-${item.id}`,
      entityId: acc.entityId,
      ledger: 'PRIMARY',
      accountingDate: selectedBusinessDate,
      valueDate: selectedBusinessDate,
      currency: item.currency,
      totalDebit: item.requiredAmount,
      totalCredit: item.requiredAmount,
      lines: [
        {
          id: `line-f1-${Date.now()}`,
          glAccount: acc.glAccountMapping.split('-')[0] || '10100',
          glAccountName: `Bank Cash Account (${acc.currency})`,
          description: `Funding proceeds receipt`,
          debit: item.requiredAmount,
          credit: 0,
          currency: item.currency,
        },
        {
          id: `line-f2-${Date.now()}`,
          glAccount: '20100',
          glAccountName: 'Intercompany Funding Payable',
          description: `Funding liability recognized`,
          debit: 0,
          credit: item.requiredAmount,
          currency: item.currency,
        },
      ],
      transactionReference: item.id,
      sourceSystem: 'GCMS_FUNDING',
      postingStatus: 'POSTED',
      makerId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    setJournalEntries((prev) => [newJe, ...prev]);
    setFundings((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'EXECUTED' } : f)));
    addAuditLog('EXECUTE_FUNDING', `Executed funding ${id}: credited ${item.requiredAmount} ${item.currency} to ${acc.accountName}`, acc.entityId, id, 'CASH_FUNDING');
    return { success: true };
  }, [fundings, bankAccounts, selectedBusinessDate, currentUser, addAuditLog]);

  // Cash Adjustment Actions
  const createAdjustment = useCallback((adj: Partial<CashAdjustment>) => {
    const acc = bankAccounts.find((a) => a.id === adj.accountId);
    if (!acc) return { success: false, error: 'Bank account not found' };

    const amt = adj.amount || 0;
    if (amt <= 0) return { success: false, error: 'Adjustment amount must be positive' };

    const newAdj: CashAdjustment = {
      id: `ADJ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      entityId: acc.entityId,
      accountId: acc.id,
      currency: acc.currency,
      adjustmentType: adj.adjustmentType || 'BANK_FEE',
      direction: adj.direction || 'DEBIT',
      amount: amt,
      reason: adj.reason || 'Operational adjustment entry',
      referenceTransaction: adj.referenceTransaction || 'ADJ-REF-MANUAL',
      accountingDate: selectedBusinessDate,
      valueDate: selectedBusinessDate,
      supportingDocName: adj.supportingDocName || 'Operational_Notice.pdf',
      status: 'PENDING_APPROVAL',
      makerId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    setAdjustments((prev) => [newAdj, ...prev]);
    addAuditLog('CREATE_ADJUSTMENT', `Adjustment created: ${newAdj.direction} ${amt} ${acc.currency} for ${acc.accountName}`, acc.entityId, newAdj.id, 'CASH_ADJUSTMENT');
    return { success: true };
  }, [bankAccounts, selectedBusinessDate, currentUser, addAuditLog]);

  const approveAdjustment = useCallback((id: string) => {
    if (!currentUser.canApprove) return { success: false, error: 'Requires checker approval rights' };
    setAdjustments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'APPROVED', checkerId: currentUser.id } : a)));
    addAuditLog('APPROVE_ADJUSTMENT', `Approved adjustment ${id}`, undefined, id, 'CASH_ADJUSTMENT');
    return { success: true };
  }, [currentUser, addAuditLog]);

  const postAdjustment = useCallback((id: string) => {
    const item = adjustments.find((a) => a.id === id);
    if (!item) return { success: false, error: 'Adjustment not found' };

    const acc = bankAccounts.find((a) => a.id === item.accountId);
    if (!acc) return { success: false, error: 'Account not found' };

    // Update Account balance
    setBankAccounts((prev) =>
      prev.map((a) => {
        if (a.id === acc.id) {
          const delta = item.direction === 'CREDIT' ? item.amount : -item.amount;
          return {
            ...a,
            bookBalance: a.bookBalance + delta,
            availableBalance: a.availableBalance + delta,
          };
        }
        return a;
      })
    );

    // Create balanced journal entry
    const isDebit = item.direction === 'DEBIT';
    const journalId = `jn-adj-${Date.now()}`;
    const newJe: JournalEntry = {
      id: journalId,
      journalNumber: `JE-ADJ-${Date.now()}`,
      accountingEventId: `EVT-${item.id}`,
      entityId: acc.entityId,
      ledger: 'PRIMARY',
      accountingDate: selectedBusinessDate,
      valueDate: item.valueDate,
      currency: item.currency,
      totalDebit: item.amount,
      totalCredit: item.amount,
      lines: [
        {
          id: `line-adj1-${Date.now()}`,
          glAccount: isDebit ? '50100' : acc.glAccountMapping.split('-')[0],
          glAccountName: isDebit ? 'Bank Charges / Adjustment Expense' : 'Cash Account',
          description: item.reason,
          debit: item.amount,
          credit: 0,
          currency: item.currency,
        },
        {
          id: `line-adj2-${Date.now()}`,
          glAccount: isDebit ? acc.glAccountMapping.split('-')[0] : '40100',
          glAccountName: isDebit ? 'Cash Account' : 'Interest / Fee Adjustment Income',
          description: item.reason,
          debit: 0,
          credit: item.amount,
          currency: item.currency,
        },
      ],
      transactionReference: item.id,
      sourceSystem: 'GCMS_ADJUSTMENT',
      postingStatus: 'POSTED',
      makerId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    setJournalEntries((prev) => [newJe, ...prev]);
    setAdjustments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'POSTED', journalId } : a)));
    addAuditLog('POST_ADJUSTMENT', `Posted adjustment ${id} into general ledger with entry ${newJe.journalNumber}`, acc.entityId, id, 'CASH_ADJUSTMENT');
    return { success: true };
  }, [adjustments, bankAccounts, selectedBusinessDate, currentUser, addAuditLog]);

  const reverseAdjustment = useCallback((id: string, reason: string) => {
    const item = adjustments.find((a) => a.id === id);
    if (!item) return { success: false, error: 'Adjustment not found' };
    if (item.status !== 'POSTED') return { success: false, error: 'Only posted adjustments can be reversed' };

    const acc = bankAccounts.find((a) => a.id === item.accountId);
    if (!acc) return { success: false, error: 'Account not found' };

    // Reverse Account Balance
    setBankAccounts((prev) =>
      prev.map((a) => {
        if (a.id === acc.id) {
          const delta = item.direction === 'CREDIT' ? -item.amount : item.amount;
          return {
            ...a,
            bookBalance: a.bookBalance + delta,
            availableBalance: a.availableBalance + delta,
          };
        }
        return a;
      })
    );

    // Post reversal journal entry (immutable audit)
    const reversalJeId = `jn-rev-${Date.now()}`;
    const newJe: JournalEntry = {
      id: reversalJeId,
      journalNumber: `JE-REV-${Date.now()}`,
      accountingEventId: `EVT-REV-${item.id}`,
      entityId: acc.entityId,
      ledger: 'PRIMARY',
      accountingDate: selectedBusinessDate,
      valueDate: selectedBusinessDate,
      currency: item.currency,
      totalDebit: item.amount,
      totalCredit: item.amount,
      lines: [
        {
          id: `line-rev1-${Date.now()}`,
          glAccount: acc.glAccountMapping.split('-')[0],
          glAccountName: 'Cash Reversal Debit',
          description: `Reversal of ${item.id}: ${reason}`,
          debit: item.amount,
          credit: 0,
          currency: item.currency,
        },
        {
          id: `line-rev2-${Date.now()}`,
          glAccount: '19999',
          glAccountName: 'Suspense Adjustment Reversal',
          description: `Reversal offset for ${item.id}`,
          debit: 0,
          credit: item.amount,
          currency: item.currency,
        },
      ],
      transactionReference: item.id,
      sourceSystem: 'GCMS_ADJUSTMENT_REVERSAL',
      postingStatus: 'POSTED',
      reversalReference: item.journalId,
      makerId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    setJournalEntries((prev) => [newJe, ...prev]);
    setAdjustments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'REVERSED', reversalJournalId: reversalJeId } : a)));
    addAuditLog('REVERSE_ADJUSTMENT', `Reversed adjustment ${id}. Reason: ${reason}. Posted Reversal JE: ${newJe.journalNumber}`, acc.entityId, id, 'CASH_ADJUSTMENT');
    return { success: true };
  }, [adjustments, bankAccounts, selectedBusinessDate, currentUser, addAuditLog]);

  // Cash Flow Creation
  const createCashFlow = useCallback((flow: Partial<CashFlow>) => {
    const acc = bankAccounts.find((a) => a.id === flow.accountId);
    if (!acc) return { success: false, error: 'Bank account required' };

    const newCf: CashFlow = {
      id: `CF-${Date.now()}`,
      entityId: acc.entityId,
      accountId: acc.id,
      currency: acc.currency,
      flowType: flow.flowType || 'EXPECTED_INCOMING',
      counterparty: flow.counterparty || 'External Counterparty Corp',
      paymentReference: flow.paymentReference || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
      amount: flow.amount || 100000,
      expectedDate: flow.expectedDate || selectedBusinessDate,
      valueDate: flow.valueDate || selectedBusinessDate,
      sourceSystem: flow.sourceSystem || 'TREASURY_PORTAL',
      forecastCategory: flow.forecastCategory || 'OPERATING',
      status: 'PENDING',
    };

    setCashFlows((prev) => [newCf, ...prev]);
    addAuditLog('CREATE_CASH_FLOW', `Created cash flow ${newCf.paymentReference} for ${newCf.amount} ${newCf.currency}`, acc.entityId, newCf.id, 'CASH_FLOW');
    return { success: true };
  }, [bankAccounts, selectedBusinessDate, addAuditLog]);

  // Payment Matching
  const matchPaymentManually = useCallback((paymentId: string, statementLineId: string) => {
    const pmt = payments.find((p) => p.id === paymentId);
    const stmt = statementLines.find((s) => s.id === statementLineId);

    if (!pmt || !stmt) return { success: false, error: 'Payment or statement line not found' };

    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              matchStatus: 'MANUALLY_MATCHED',
              matchScore: 100,
              matchedBankStatementLineId: statementLineId,
              matchedDate: new Date().toISOString(),
            }
          : p
      )
    );

    setStatementLines((prev) =>
      prev.map((s) =>
        s.id === statementLineId
          ? {
              ...s,
              matchStatus: 'MANUALLY_MATCHED',
              matchedPaymentId: paymentId,
            }
          : s
      )
    );

    addAuditLog('MANUAL_PAYMENT_MATCH', `Manually matched payment ${pmt.businessReference} with statement line ${stmt.transactionReference}`, pmt.entityId, pmt.id, 'PAYMENT_MATCHING');
    return { success: true };
  }, [payments, statementLines, addAuditLog]);

  const unmatchPayment = useCallback((paymentId: string) => {
    const pmt = payments.find((p) => p.id === paymentId);
    if (!pmt) return { success: false, error: 'Payment not found' };

    const stmtId = pmt.matchedBankStatementLineId;

    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              matchStatus: 'UNMATCHED',
              matchScore: 0,
              matchedBankStatementLineId: undefined,
              matchedDate: undefined,
            }
          : p
      )
    );

    if (stmtId) {
      setStatementLines((prev) =>
        prev.map((s) =>
          s.id === stmtId
            ? {
                ...s,
                matchStatus: 'UNMATCHED',
                matchedPaymentId: undefined,
              }
            : s
        )
      );
    }

    addAuditLog('UNMATCH_PAYMENT', `Unmatched payment ${pmt.businessReference}`, pmt.entityId, pmt.id, 'PAYMENT_MATCHING');
    return { success: true };
  }, [payments, addAuditLog]);

  const runAutoPaymentMatching = useCallback(() => {
    let matchedCount = 0;
    const unmatchedPayments = payments.filter((p) => p.matchStatus === 'UNMATCHED' || p.matchStatus === 'POTENTIAL_MATCH');
    const unmatchedStmts = statementLines.filter((s) => s.matchStatus === 'UNMATCHED' || s.matchStatus === 'POTENTIAL_MATCH');

    const updatedPayments = [...payments];
    const updatedStmts = [...statementLines];

    for (const p of unmatchedPayments) {
      for (const s of unmatchedStmts) {
        if (s.matchedPaymentId) continue;
        const result = matchPaymentWithStatementLine(
          {
            businessReference: p.businessReference,
            amount: p.amount,
            currency: p.currency,
            valueDate: p.valueDate,
            creditorName: p.creditorName,
            debtorName: p.debtorName,
          },
          {
            transactionReference: s.transactionReference,
            amount: s.amount,
            currency: s.currency,
            valueDate: s.valueDate,
            narrative: s.narrative,
          }
        );

        if (result.matchStatus === 'MATCHED') {
          // Update payment
          const pIndex = updatedPayments.findIndex((x) => x.id === p.id);
          if (pIndex >= 0) {
            updatedPayments[pIndex] = {
              ...updatedPayments[pIndex],
              matchStatus: 'MATCHED',
              matchScore: result.matchScore,
              matchedBankStatementLineId: s.id,
              matchedDate: new Date().toISOString(),
            };
          }
          // Update statement
          const sIndex = updatedStmts.findIndex((x) => x.id === s.id);
          if (sIndex >= 0) {
            updatedStmts[sIndex] = {
              ...updatedStmts[sIndex],
              matchStatus: 'MATCHED',
              matchedPaymentId: p.id,
            };
          }
          matchedCount++;
          break;
        }
      }
    }

    setPayments(updatedPayments);
    setStatementLines(updatedStmts);
    addAuditLog('RUN_AUTO_MATCHING', `Auto-matching executed: Successfully matched ${matchedCount} transaction(s)`, undefined, undefined, 'PAYMENT_MATCHING');
    return { matchedCount };
  }, [payments, statementLines, addAuditLog]);

  // Operations Tasks & Exceptions
  const resolveOperationsTask = useCallback((taskId: string, notes?: string) => {
    setOperationsTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'RESOLVED', notes: notes || 'Investigated and resolved by operator' } : t))
    );
    addAuditLog('RESOLVE_OPERATIONS_TASK', `Resolved task ${taskId}: ${notes || 'Completed'}`, undefined, taskId, 'OPERATIONS');
    return { success: true };
  }, [addAuditLog]);

  const resolveException = useCallback((excId: string, rootCause: string, summary: string) => {
    setExceptions((prev) =>
      prev.map((e) => (e.id === excId ? { ...e, status: 'RESOLVED', rootCause, resolutionSummary: summary } : e))
    );
    addAuditLog('RESOLVE_EXCEPTION', `Resolved exception ${excId}. Cause: ${rootCause}`, undefined, excId, 'EXCEPTION_MGMT');
    return { success: true };
  }, [addAuditLog]);

  // Generic Approval Handling
  const approveGenericRequest = useCallback((requestId: string) => {
    const req = approvalRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };

    if (!currentUser.canApprove) {
      return { success: false, error: 'User does not possess checker approval rights.' };
    }

    if (req.workflowType === 'CASH_REALIGNMENT') {
      return approveRealignment(req.referenceId);
    }
    if (req.workflowType === 'CASH_FUNDING') {
      return approveFunding(req.referenceId);
    }
    if (req.workflowType === 'CASH_ADJUSTMENT') {
      return approveAdjustment(req.referenceId);
    }

    setApprovalRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'APPROVED',
              approverId: currentUser.id,
              approverName: currentUser.name,
              approvalDate: new Date().toISOString(),
            }
          : r
      )
    );
    return { success: true };
  }, [approvalRequests, currentUser, approveRealignment, approveFunding, approveAdjustment]);

  const rejectGenericRequest = useCallback((requestId: string, reason: string) => {
    const req = approvalRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };

    if (req.workflowType === 'CASH_REALIGNMENT') {
      return rejectRealignment(req.referenceId, reason);
    }

    setApprovalRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: 'REJECTED', rejectionReason: reason, approverId: currentUser.id, approverName: currentUser.name }
          : r
      )
    );
    return { success: true };
  }, [approvalRequests, currentUser, rejectRealignment]);

  // Simulation Harness
  const simulateIncomingPayment = useCallback((amount: number, ccy: CurrencyCode, debtor: string, creditor: string) => {
    const targetAcc = bankAccounts.find((a) => a.currency === ccy) || bankAccounts[0];
    const newPmt: PaymentTransaction = {
      id: `pmt-sim-${Date.now()}`,
      businessReference: `SIM-IN-${Math.floor(10000 + Math.random() * 90000)}`,
      endToEndId: `E2E-SIM-${Date.now()}`,
      uetr: `sim-${Date.now()}-uetr`,
      sourceSystem: 'SWIFT_PACS008',
      accountId: targetAcc.id,
      entityId: targetAcc.entityId,
      direction: 'INBOUND',
      amount,
      currency: ccy,
      valueDate: selectedBusinessDate,
      bookingDate: selectedBusinessDate,
      debtorName: debtor,
      debtorAccount: `DEBTOR-ACC-${Math.floor(1000 + Math.random() * 9000)}`,
      creditorName: creditor,
      creditorAccount: targetAcc.iban,
      remittanceInfo: `Simulated inbound customer payment credit for ${creditor}`,
      bankReference: `BNK-SIM-${Date.now()}`,
      transactionType: 'COLLECTION',
      matchStatus: 'UNMATCHED',
      status: 'EXECUTED',
    };

    setPayments((prev) => [newPmt, ...prev]);

    // Also update account balance
    setBankAccounts((prev) =>
      prev.map((a) => (a.id === targetAcc.id ? { ...a, bookBalance: a.bookBalance + amount, availableBalance: a.availableBalance + amount } : a))
    );

    addAuditLog('SIMULATION_INCOMING_PAYMENT', `Simulated payment received: ${amount} ${ccy} from ${debtor}`, targetAcc.entityId, newPmt.id, 'SIMULATOR');
  }, [bankAccounts, selectedBusinessDate, addAuditLog]);

  const simulateStatementIngestion = useCallback((iban: string, amount: number, direction: 'CREDIT' | 'DEBIT', ref: string) => {
    const acc = bankAccounts.find((a) => a.iban === iban) || bankAccounts[0];
    const newLine: BankStatementLine = {
      id: `stmt-sim-${Date.now()}`,
      accountId: acc.id,
      statementNumber: `STMT-SIM-${Date.now()}`,
      statementDate: selectedBusinessDate,
      bookingDate: selectedBusinessDate,
      valueDate: selectedBusinessDate,
      amount,
      currency: acc.currency,
      direction,
      transactionReference: ref,
      counterparty: 'Simulated Counterparty Bank Clearing',
      narrative: `Bank statement entry /REF/${ref}`,
      matchStatus: 'UNMATCHED',
    };

    setStatementLines((prev) => [newLine, ...prev]);
    addAuditLog('SIMULATION_STATEMENT_INGESTION', `Ingested bank statement line ${ref}: ${direction} ${amount} ${acc.currency}`, acc.entityId, newLine.id, 'SIMULATOR');
  }, [bankAccounts, selectedBusinessDate, addAuditLog]);

  const simulateFxFluctuation = useCallback(() => {
    setFxRates((prev) =>
      prev.map((rate) => {
        const delta = (Math.random() - 0.5) * 0.008 * rate.spotRate;
        const newSpot = Number((rate.spotRate + delta).toFixed(4));
        const pct = Number((((newSpot - rate.previousClose) / rate.previousClose) * 100).toFixed(2));
        return {
          ...rate,
          spotRate: newSpot,
          bidRate: Number((newSpot - 0.0002).toFixed(4)),
          askRate: Number((newSpot + 0.0002).toFixed(4)),
          changePercent: pct,
        };
      })
    );
  }, []);

  const addTradeProjection = useCallback((projection: Partial<TradeProjection>) => {
    const id = `TRADE-${Date.now()}`;
    const newRecord: TradeProjection = {
      id,
      instrumentType: projection.instrumentType || 'LETTER_OF_CREDIT',
      reference: projection.reference || `REF-${Math.floor(Math.random() * 90000 + 10000)}`,
      counterparty: projection.counterparty || 'External Counterparty',
      entityId: projection.entityId || (selectedEntityId !== 'ALL' ? selectedEntityId : 'ent-us-ops'),
      direction: projection.direction || 'RECEIVABLE',
      amount: projection.amount || 1000000,
      currency: projection.currency || selectedCurrency,
      issuanceDate: projection.issuanceDate || selectedBusinessDate,
      maturityDate: projection.maturityDate || selectedBusinessDate,
      projectedSettlementDate: projection.projectedSettlementDate || selectedBusinessDate,
      settlementAccountId: projection.settlementAccountId || (bankAccounts[0]?.id ?? 'acc-us-01'),
      probability: projection.probability ?? 0.95,
      status: projection.status || 'PROJECTED',
      tradeBank: projection.tradeBank || 'Global Trade Partner Bank',
      riskRating: projection.riskRating || 'AA',
      collateralPercentage: projection.collateralPercentage ?? 0,
      notes: projection.notes,
    };
    setTradeProjections((prev) => [newRecord, ...prev]);
    addAuditLog('CREATE_TRADE_PROJECTION', `Added trade projection ${newRecord.reference} (${newRecord.instrumentType} for ${newRecord.amount} ${newRecord.currency})`, newRecord.entityId, newRecord.id, 'TRADE');
    return { success: true };
  }, [bankAccounts, selectedBusinessDate, selectedCurrency, selectedEntityId, addAuditLog]);

  const advancePaymentHop = useCallback((paymentId: string) => {
    let advancedTrack: PaymentFlowTrack | null = null;
    setPaymentFlowTracks((prev) =>
      prev.map((track) => {
        if (track.paymentId !== paymentId) return track;
        const currentIdx = track.currentStageIndex;
        if (currentIdx >= track.hops.length - 1) return track;

        const nextIdx = currentIdx + 1;
        const updatedHops = track.hops.map((hop, idx) => {
          if (idx < nextIdx) {
            return { ...hop, status: 'COMPLETED' as const };
          }
          if (idx === nextIdx) {
            const nextStatus: PaymentFlowHop['status'] = nextIdx === track.hops.length - 1 ? 'COMPLETED' : 'IN_PROGRESS';
            return {
              ...hop,
              status: nextStatus,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            };
          }
          return hop;
        });

        const isFullySettled = nextIdx === track.hops.length - 1;
        const updatedTrack: PaymentFlowTrack = {
          ...track,
          currentStageIndex: nextIdx,
          status: isFullySettled ? 'SETTLED' : 'IN_FLIGHT',
          hops: updatedHops,
        };
        advancedTrack = updatedTrack;
        return updatedTrack;
      })
    );

    if (advancedTrack) {
      addAuditLog(
        'ADVANCE_PAYMENT_LIFECYCLE_HOP',
        `Payment ${(advancedTrack as PaymentFlowTrack).paymentId} advanced to stage ${(advancedTrack as PaymentFlowTrack).hops[(advancedTrack as PaymentFlowTrack).currentStageIndex].stage}`,
        (advancedTrack as PaymentFlowTrack).debtorEntityId,
        paymentId,
        'PAYMENTS'
      );
      return { success: true };
    }
    return { success: false, error: 'Payment track not found or already fully settled' };
  }, [addAuditLog]);

  const addPaymentFlowTrack = useCallback((track: Partial<PaymentFlowTrack>) => {
    const paymentId = track.paymentId || `PMT-${Date.now()}`;
    const newTrack: PaymentFlowTrack = {
      paymentId,
      uetr: track.uetr || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `uetr-${Date.now()}`),
      transactionRef: track.transactionRef || `TX-${Math.floor(Math.random() * 90000 + 10000)}`,
      debtorEntityId: track.debtorEntityId || 'ent-us-ops',
      debtorEntityName: track.debtorEntityName || 'US Enterprise Operations Inc.',
      debtorAccountName: track.debtorAccountName || 'JPMorgan Chase US Operating',
      debtorIban: track.debtorIban || 'US44CHAS000192837465',
      creditorEntityName: track.creditorEntityName || 'Global Beneficiary Corp',
      creditorAccountName: track.creditorAccountName || 'Beneficiary Collections Account',
      creditorIban: track.creditorIban || 'US99CITI000123456789',
      clearingBank: track.clearingBank || 'Fedwire Funds Service',
      amount: track.amount || 1000000,
      currency: track.currency || 'USD',
      currentStageIndex: 0,
      status: 'IN_FLIGHT',
      hops: track.hops && track.hops.length > 0 ? track.hops : [
        { hopId: 'HOP-01', stage: 'INSTRUCTION_INITIATED', title: 'Instruction Staged', description: 'Generated from ERP subledger run.', timestamp: new Date().toISOString(), status: 'COMPLETED' },
        { hopId: 'HOP-02', stage: 'SANCTION_SCREENING', title: 'Sanctions Check', description: 'Automated AML & OFAC screening.', timestamp: 'Pending', status: 'IN_PROGRESS' },
        { hopId: 'HOP-03', stage: 'DUAL_CONTROL_APPROVAL', title: 'Dual Control Sign-Off', description: 'Maker-checker approval queue.', timestamp: 'Pending', status: 'PENDING' },
        { hopId: 'HOP-04', stage: 'NETWORK_DISPATCH', title: 'Network Dispatch', description: 'SWIFT / Fedwire dispatch.', timestamp: 'Pending', status: 'PENDING' },
        { hopId: 'HOP-05', stage: 'NOSTRO_SETTLEMENT', title: 'Nostro Settlement', description: 'Correspondent clearing book entry.', timestamp: 'Pending', status: 'PENDING' },
        { hopId: 'HOP-06', stage: 'CAMT_INGESTION', title: 'camt.053 Ingestion', description: 'Electronic bank statement delivery.', timestamp: 'Pending', status: 'PENDING' },
        { hopId: 'HOP-07', stage: 'MATCHING_CONFIRMED', title: '3-Way Match', description: 'Rule-based matching algorithm.', timestamp: 'Pending', status: 'PENDING' },
        { hopId: 'HOP-08', stage: 'GL_SUBLEDGER_POSTED', title: 'GL Posted', description: 'Double-entry balanced posting.', timestamp: 'Pending', status: 'PENDING' },
      ],
    };
    setPaymentFlowTracks((prev) => [newTrack, ...prev]);
    addAuditLog('CREATE_PAYMENT_TRACK', `Created new payment flow track ${newTrack.paymentId} for ${newTrack.amount} ${newTrack.currency}`, newTrack.debtorEntityId, newTrack.paymentId, 'PAYMENTS');
    return { success: true };
  }, [addAuditLog]);

  const resetAllData = useCallback(() => {
    setEntities(initialEntities);
    setBankAccounts(initialBankAccounts);
    setFxRates(initialFxRates);
    setRealignments(initialRealignments);
    setFundings(initialCashFunding);
    setAdjustments(initialCashAdjustments);
    setCashFlows(initialCashFlows);
    setPayments(initialPaymentTransactions);
    setStatementLines(initialStatementLines);
    setNostroAccounts(initialNostroAccounts);
    setJournalEntries(initialJournalEntries);
    setOperationsTasks(initialOperationsTasks);
    setExceptions(initialExceptions);
    setApprovalRequests(initialApprovalRequests);
    setAuditLogs(initialAuditLogs);
    setLiquidityPools(initialLiquidityPools);
    setIso20022Messages(initialISO20022Messages);
    setTradeProjections(INITIAL_TRADE_PROJECTIONS);
    setPaymentFlowTracks(INITIAL_PAYMENT_FLOW_TRACKS);
    addAuditLog('SYSTEM_RESET', 'All financial balances, workflows, and transaction ledgers restored to initial baseline state.');
  }, [addAuditLog]);

  const value = useMemo(
    () => ({
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
      availableUsers: availableUserProfiles,

      entities,
      bankAccounts,
      fxRates,
      realignments,
      fundings,
      adjustments,
      cashFlows,
      payments,
      statementLines,
      nostroAccounts,
      chartOfAccounts,
      journalEntries,
      operationsTasks,
      exceptions,
      approvalRequests,
      auditLogs,
      liquidityPools,
      iso20022Messages,
      tradeProjections,
      paymentFlowTracks,

      createRealignment,
      submitRealignment,
      approveRealignment,
      executeRealignment,
      rejectRealignment,

      createFunding,
      approveFunding,
      executeFunding,

      createAdjustment,
      approveAdjustment,
      postAdjustment,
      reverseAdjustment,

      createCashFlow,

      matchPaymentManually,
      unmatchPayment,
      runAutoPaymentMatching,

      resolveOperationsTask,
      resolveException,

      approveGenericRequest,
      rejectGenericRequest,

      addTradeProjection,
      advancePaymentHop,
      addPaymentFlowTrack,

      simulateIncomingPayment,
      simulateStatementIngestion,
      simulateFxFluctuation,
      resetAllData,
    }),
    [
      selectedEntityId,
      selectedAccountId,
      selectedCurrency,
      selectedBusinessDate,
      searchQuery,
      currentUser,
      switchUser,
      entities,
      bankAccounts,
      fxRates,
      realignments,
      fundings,
      adjustments,
      cashFlows,
      payments,
      statementLines,
      nostroAccounts,
      chartOfAccounts,
      journalEntries,
      operationsTasks,
      exceptions,
      approvalRequests,
      auditLogs,
      liquidityPools,
      iso20022Messages,
      tradeProjections,
      paymentFlowTracks,
      createRealignment,
      submitRealignment,
      approveRealignment,
      executeRealignment,
      rejectRealignment,
      createFunding,
      approveFunding,
      executeFunding,
      createAdjustment,
      approveAdjustment,
      postAdjustment,
      reverseAdjustment,
      createCashFlow,
      matchPaymentManually,
      unmatchPayment,
      runAutoPaymentMatching,
      resolveOperationsTask,
      resolveException,
      approveGenericRequest,
      rejectGenericRequest,
      addTradeProjection,
      advancePaymentHop,
      addPaymentFlowTrack,
      simulateIncomingPayment,
      simulateStatementIngestion,
      simulateFxFluctuation,
      resetAllData,
    ]
  );

  return <TreasuryContext.Provider value={value}>{children}</TreasuryContext.Provider>;
};

export const useTreasury = () => {
  const context = useContext(TreasuryContext);
  if (!context) {
    throw new Error('useTreasury must be used within a TreasuryProvider');
  }
  return context;
};
