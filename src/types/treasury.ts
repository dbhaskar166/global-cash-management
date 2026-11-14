// Global Treasury & Cash Operations Platform (GCMS) Types

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'CHF' | 'SGD' | 'CAD' | 'AUD' | 'AED';

export type EntityType = 'HOLDING' | 'REGIONAL_HOLDING' | 'OPERATING' | 'FINANCIAL_SERVICES' | 'SHARED_SERVICES';

export interface LegalEntity {
  id: string;
  name: string;
  code: string;
  type: EntityType;
  parentId: string | null;
  country: string;
  countryCode: string;
  region: 'Americas' | 'EMEA' | 'APAC';
  baseCurrency: CurrencyCode;
  functionalCurrency: CurrencyCode;
  reportingCurrency: CurrencyCode;
  accountingStandard: 'IFRS' | 'US_GAAP' | 'LOCAL_GAAP';
  fiscalYearEnd: string;
  timeZone: string;
  businessCalendar: string;
  taxId: string;
  lei: string; // Legal Entity Identifier
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  creditLimit: number;
  intercompanyLimit: number;
}

export type BankAccountType = 
  | 'CURRENT' 
  | 'SAVINGS' 
  | 'OPERATING' 
  | 'COLLECTION' 
  | 'DISBURSEMENT' 
  | 'POOL' 
  | 'SETTLEMENT' 
  | 'NOSTRO' 
  | 'VOSTRO' 
  | 'ESCROW' 
  | 'INVESTMENT' 
  | 'SUSPENSE' 
  | 'VIRTUAL';

export interface BankAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  iban: string;
  swiftBic: string;
  bankName: string;
  bankBranch: string;
  country: string;
  currency: CurrencyCode;
  entityId: string;
  accountType: BankAccountType;
  accountPurpose: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DORMANT' | 'CLOSED';
  bookBalance: number;
  availableBalance: number;
  restrictedBalance: number;
  valueDatedBalance: number;
  openingBalance: number;
  overdraftLimit: number;
  minimumBalance: number;
  targetBalance: number;
  connectivityType: 'SWIFT_FIN' | 'ISO20022_EBICS' | 'HOST_TO_HOST' | 'API_REST';
  statementFrequency: 'DAILY' | 'INTRADAY' | 'WEEKLY' | 'MONTHLY';
  glAccountMapping: string;
  lastUpdated: string;
}

export interface FxRate {
  id: string;
  pair: string; // e.g., 'EUR/USD'
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  spotRate: number;
  bidRate: number;
  askRate: number;
  previousClose: number;
  changePercent: number;
  rateSource: 'REUTERS' | 'BLOOMBERG' | 'ECB' | 'FED' | 'INTERNAL_TREASURY';
  effectiveDate: string;
  tenor: 'SPOT' | '1M' | '3M' | '6M' | '1Y';
}

export type RealignmentPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RealignmentType = 
  | 'ACCOUNT_TO_ACCOUNT'
  | 'ENTITY_TO_ENTITY'
  | 'PARENT_TO_CHILD'
  | 'CHILD_TO_PARENT'
  | 'INTERCOMPANY_TRANSFER'
  | 'LIQUIDITY_POOL_REALIGNMENT'
  | 'CURRENCY_REALIGNMENT'
  | 'SURPLUS_REALIGNMENT'
  | 'DEFICIT_REALIGNMENT'
  | 'CROSS_BORDER';

export type RealignmentStatus = 
  | 'DRAFT'
  | 'PROPOSED'
  | 'PENDING_VALIDATION'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';


export interface CashRealignment {
  id: string;
  businessDate: string;
  sourceEntityId: string;
  sourceAccountId: string;
  sourceCurrency: CurrencyCode;
  sourceAvailableBalance: number;
  destinationEntityId: string;
  destinationAccountId: string;
  destinationCurrency: CurrencyCode;
  destinationBalance: number;
  amount: number;
  fxRate: number;
  convertedAmount: number;
  realignmentType: RealignmentType;
  priority: RealignmentPriority;
  reason: string;
  executionDate: string;
  valueDate: string;
  status: RealignmentStatus;
  makerId: string;
  makerName: string;
  checkerId?: string;
  checkerName?: string;
  rejectionReason?: string;
  journalEntryId?: string;
  createdAt: string;
}

export type FundingPriority = 'HIGH' | 'URGENT' | 'NORMAL';

export type FundingType = 
  | 'INTERNAL'
  | 'EXTERNAL_BANK'
  | 'INTERCOMPANY'
  | 'SHORT_TERM'
  | 'OVERNIGHT'
  | 'INTRADAY'
  | 'EMERGENCY'
  | 'FX_FUNDING'
  | 'LIQUIDITY_POOL'
  | 'NOSTRO_FUNDING';

export type FundingStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'FAILED' | 'CANCELLED';

export interface CashFunding {
  id: string;
  businessDate: string;
  entityId: string;
  accountId: string;
  currency: CurrencyCode;
  fundingType: FundingType;
  deficitAmount: number;
  requiredAmount: number;
  minimumRequiredCash: number;
  currentAvailableCash: number;
  fundingSourceAccountId?: string;
  fundingSourceEntityId?: string;
  externalCounterparty?: string;
  interestRate?: number;
  tenorDays?: number;
  maturityDate?: string;
  priority: 'HIGH' | 'URGENT' | 'NORMAL';
  status: FundingStatus;
  makerId: string;
  checkerId?: string;
  createdAt: string;
}

export type AdjustmentType = 
  | 'BANK_FEE'
  | 'INTEREST'
  | 'FX_ADJUSTMENT'
  | 'VALUE_DATE'
  | 'OPENING_BALANCE'
  | 'CLOSING_BALANCE'
  | 'SUSPENSE_ACCOUNT'
  | 'RECONCILIATION_ADJUSTMENT'
  | 'CORRECTION_ENTRY'
  | 'CASH_POSITION'
  | 'INTERCOMPANY';

export type AdjustmentStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'POSTED' | 'REVERSED' | 'REJECTED';

export interface CashAdjustment {
  id: string;
  entityId: string;
  accountId: string;
  currency: CurrencyCode;
  adjustmentType: AdjustmentType;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  reason: string;
  referenceTransaction?: string;
  accountingDate: string;
  valueDate: string;
  originalAmount?: number;
  adjustedAmount?: number;
  difference?: number;
  supportingDocName?: string;
  status: AdjustmentStatus;
  makerId: string;
  checkerId?: string;
  journalId?: string;
  reversalJournalId?: string;
  createdAt: string;
}

export type CashFlowType = 
  | 'INCOMING_ACTUAL'
  | 'OUTGOING_ACTUAL'
  | 'EXPECTED_INCOMING'
  | 'EXPECTED_OUTGOING'
  | 'RECURRING'
  | 'INTERCOMPANY'
  | 'INVESTMENT'
  | 'LOAN'
  | 'PAYROLL'
  | 'TAX';

export interface CashFlow {
  id: string;
  entityId: string;
  accountId: string;
  currency: CurrencyCode;
  flowType: CashFlowType;
  counterparty: string;
  paymentReference: string;
  amount: number;
  expectedDate: string;
  valueDate: string;
  actualDate?: string;
  sourceSystem: 'SWIFT' | 'SAP_ERP' | 'ORACLE_FIN' | 'TREASURY_PORTAL' | 'MANUAL';
  forecastCategory: 'OPERATING' | 'FINANCING' | 'INVESTING' | 'TAX' | 'INTERCOMPANY';
  status: 'PENDING' | 'CONFIRMED' | 'MATCHED' | 'OVERDUE' | 'CANCELLED';
  matchedPaymentId?: string;
}

export interface CashProjectionHorizon {
  horizon: 'Intraday' | 'End of Day' | 'Next Business Day' | '7 Days' | '30 Days' | '90 Days' | 'Quarterly' | 'Annual';
  openingCash: number;
  projectedInflows: number;
  projectedOutflows: number;
  projectedClosingCash: number;
  minimumLiquidityRequirement: number;
  restrictedCash: number;
  projectedFreeCash: number;
  optimisticClosingCash: number;
  pessimisticClosingCash: number;
  confidenceScore: number; // e.g. 95%
  netPosition: number;
  currency: CurrencyCode;
}

export interface FreeCashAnalysis {
  entityId: string;
  entityName: string;
  currency: CurrencyCode;
  eligibleAvailableCash: number;
  minimumOperationalCash: number;
  restrictedCash: number;
  requiredFundingReserves: number;
  freeCash: number;
  idleCash: number;
  trappedCash: number;
  investableCash: number;
  recommendedAction: string;
}

export type PaymentMatchStatus = 
  | 'UNMATCHED'
  | 'MATCHED'
  | 'PARTIALLY_MATCHED'
  | 'POTENTIAL_MATCH'
  | 'DUPLICATE'
  | 'EXCEPTION'
  | 'MANUALLY_MATCHED'
  | 'RECONCILED';

export interface PaymentTransaction {
  id: string;
  businessReference: string;
  endToEndId: string;
  uetr: string; // Unique End-to-end Transaction Reference
  sourceSystem: 'SWIFT_PACS008' | 'CAMT053' | 'FEDWIRE' | 'CHAPS' | 'TARGET2' | 'INTERNAL_ERP';
  accountId: string;
  entityId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  amount: number;
  currency: CurrencyCode;
  valueDate: string;
  bookingDate: string;
  debtorName: string;
  debtorAccount: string;
  creditorName: string;
  creditorAccount: string;
  remittanceInfo: string;
  bankReference: string;
  transactionType: 'TRANSFER' | 'COLLECTION' | 'FX_SETTLEMENT' | 'FEE' | 'DIVIDEND' | 'INTERCOMPANY';
  matchStatus: PaymentMatchStatus;
  matchScore?: number;
  matchedBankStatementLineId?: string;
  matchedDate?: string;
  status: 'PENDING' | 'EXECUTED' | 'REJECTED' | 'REVERSED';
}

export interface BankStatementLine {
  id: string;
  accountId: string;
  statementNumber: string;
  statementDate: string;
  bookingDate: string;
  valueDate: string;
  amount: number;
  currency: CurrencyCode;
  direction: 'CREDIT' | 'DEBIT';
  transactionReference: string;
  counterparty: string;
  narrative: string;
  matchStatus: PaymentMatchStatus;
  matchedPaymentId?: string;
}

export interface NostroAccount {
  id: string;
  accountNumber: string;
  correspondentBank: string;
  swiftBic: string;
  country: string;
  currency: CurrencyCode;
  bookBalance: number;
  statementBalance: number;
  availableBalance: number;
  expectedInflows: number;
  expectedOutflows: number;
  forecastedBalance: number;
  minimumRequiredBalance: number;
  fundingRequirement: number;
  reconciliationStatus: 'RECONCILED' | 'BREAKS_IDENTIFIED' | 'PENDING_STATEMENT';
  unreconciledBreakCount: number;
  lastStatementDate: string;
}

export interface ChartOfAccountItem {
  accountCode: string;
  accountName: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  currency: CurrencyCode;
  category: 'CASH' | 'INTERCOMPANY' | 'FX_CLEARING' | 'BANK_FEES' | 'INTEREST' | 'SUSPENSE';
}

export interface JournalEntryLine {
  id: string;
  glAccount: string;
  glAccountName: string;
  description: string;
  debit: number;
  credit: number;
  currency: CurrencyCode;
}

export interface JournalEntry {
  id: string;
  journalNumber: string;
  accountingEventId: string;
  entityId: string;
  ledger: 'PRIMARY' | 'IFRS_SECONDARY' | 'LOCAL_STATUTORY';
  accountingDate: string;
  valueDate: string;
  currency: CurrencyCode;
  totalDebit: number;
  totalCredit: number;
  lines: JournalEntryLine[];
  transactionReference: string;
  sourceSystem: string;
  postingStatus: 'POSTED' | 'PENDING' | 'REVERSED';
  reversalReference?: string;
  makerId: string;
  createdAt: string;
}

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  type: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export type TaskStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_INFO' | 'PENDING_APPROVAL' | 'RESOLVED' | 'CLOSED';
export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface OperationsTask {
  id: string;
  taskType: 
    | 'UNMATCHED_PAYMENT' 
    | 'RECONCILIATION_BREAK' 
    | 'FUNDING_DEFICIT' 
    | 'POSTING_EXCEPTION' 
    | 'SLA_BREACH' 
    | 'LIMIT_WARNING' 
    | 'NOSTRO_VARIANCE';
  priority: TaskPriority;
  businessDate: string;
  entityId: string;
  accountId?: string;
  currency: CurrencyCode;
  amount: number;
  referenceId: string;
  sourceSystem: string;
  assignedOperator: string;
  createdDate: string;
  slaDueDate: string;
  status: TaskStatus;
  description: string;
  notes?: string;
}

export interface SystemException {
  id: string;
  exceptionType: 
    | 'PAYMENT_MATCHING' 
    | 'CASH_POSITION' 
    | 'FUNDING' 
    | 'REALIGNMENT' 
    | 'ACCOUNTING_POSTING' 
    | 'FX_RATE' 
    | 'NOSTRO_RECONCILIATION' 
    | 'DUPLICATE_TXN' 
    | 'LIMIT_BREACH';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  entityId: string;
  accountId?: string;
  referenceId: string;
  currency: CurrencyCode;
  amount: number;
  discoveredAt: string;
  slaStatus: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  assignedTo: string;
  status: 'OPEN' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED';
  rootCause?: string;
  resolutionSummary?: string;
}

export interface ApprovalRequest {
  id: string;
  workflowType: 'CASH_REALIGNMENT' | 'CASH_FUNDING' | 'CASH_ADJUSTMENT' | 'JOURNAL_POSTING' | 'LIMIT_OVERRIDE';
  referenceId: string;
  entityId: string;
  entityName: string;
  amount: number;
  currency: CurrencyCode;
  makerId: string;
  makerName: string;
  makerRole: string;
  submissionDate: string;
  requiredRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverId?: string;
  approverName?: string;
  approvalDate?: string;
  rejectionReason?: string;
  urgency: 'HIGH' | 'NORMAL' | 'URGENT';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityId?: string;
  transactionId?: string;
  module: string;
  beforeValue?: string;
  afterValue?: string;
  sourceIp: string;
  correlationId: string;
}

export interface LiquidityPool {
  id: string;
  name: string;
  type: 'ZERO_BALANCE_ACCOUNT' | 'TARGET_BALANCE' | 'NOTIONAL_POOL' | 'PHYSICAL_POOL';
  masterAccountId: string;
  currency: CurrencyCode;
  participantAccountIds: string[];
  totalPoolBalance: number;
  targetBalance?: number;
  sweepFrequency: 'INTRADAY' | 'END_OF_DAY';
  crossBorder: boolean;
  status: 'ACTIVE' | 'PAUSED';
}

export interface ISO20022Message {
  id: string;
  messageType: 'camt.052' | 'camt.053' | 'camt.054' | 'pacs.008' | 'pacs.002' | 'pain.001';
  msgId: string;
  creationDateTime: string;
  debtor: string;
  creditor: string;
  amount: number;
  currency: CurrencyCode;
  accountIban: string;
  status: 'INGESTED' | 'VALIDATED' | 'PROCESSED' | 'ERROR';
  rawPayload: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 
    | 'Global Treasury Manager' 
    | 'Treasury Operations Manager' 
    | 'Cash Manager' 
    | 'Funding Operator' 
    | 'Payment Operations Operator' 
    | 'Reconciliation Operator' 
    | 'Accountant' 
    | 'Financial Controller' 
    | 'Auditor' 
    | 'System Administrator';
  canApprove: boolean;
  approvalThresholdUSD: number;
  entitiesAllowed: string[]; // ['ALL'] or specific entity IDs
}

// Trade Projections & Commitments
export type TradeInstrumentType = 
  | 'LETTER_OF_CREDIT' 
  | 'DOCUMENTARY_COLLECTION' 
  | 'SUPPLY_CHAIN_FINANCE' 
  | 'TRADE_INVOICE_DISCOUNTING' 
  | 'FX_FORWARD_SETTLEMENT' 
  | 'STANDBY_LC';

export interface TradeProjection {
  id: string;
  instrumentType: TradeInstrumentType;
  reference: string;
  counterparty: string;
  entityId: string;
  direction: 'RECEIVABLE' | 'PAYABLE';
  amount: number;
  currency: CurrencyCode;
  issuanceDate: string;
  maturityDate: string;
  projectedSettlementDate: string;
  settlementAccountId: string;
  probability: number; // e.g. 0.95 or 1.0
  status: 'COMMITTED' | 'PROJECTED' | 'IN_SETTLEMENT' | 'SETTLED' | 'DEFAULTED';
  tradeBank: string;
  riskRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'UNRATED';
  collateralPercentage: number;
  notes?: string;
}

// Payment Lifecycle & Cross-Account Movement Flow
export type PaymentStage = 
  | 'INSTRUCTION_INITIATED' 
  | 'SANCTION_SCREENING' 
  | 'DUAL_CONTROL_APPROVAL' 
  | 'NETWORK_DISPATCH' 
  | 'NOSTRO_SETTLEMENT' 
  | 'CAMT_INGESTION' 
  | 'MATCHING_CONFIRMED' 
  | 'GL_SUBLEDGER_POSTED';

export interface PaymentFlowHop {
  hopId: string;
  stage: PaymentStage;
  title: string;
  description: string;
  sourceAccount?: string;
  clearingAccount?: string;
  destAccount?: string;
  timestamp: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'FLAGGED';
  networkChannel?: 'SWIFT_PACS008' | 'FEDWIRE_FUNDS' | 'TARGET2_RT1' | 'CHIPS' | 'INTERNAL_BOOK';
  journalRef?: string;
  iso20022MsgType?: string;
}

export interface PaymentFlowTrack {
  paymentId: string;
  uetr: string;
  transactionRef: string;
  debtorEntityId: string;
  debtorEntityName: string;
  debtorAccountName: string;
  debtorIban: string;
  creditorEntityName: string;
  creditorAccountName: string;
  creditorIban: string;
  clearingBank: string;
  amount: number;
  currency: CurrencyCode;
  currentStageIndex: number;
  status: 'IN_FLIGHT' | 'SETTLED' | 'EXCEPTION' | 'CANCELLED';
  hops: PaymentFlowHop[];
}

// Treasury Knowledge Base & Business Flow Glossary
export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: 'CASH_POSITION' | 'REALIGNMENT' | 'FUNDING' | 'ADJUSTMENT' | 'MATCHING' | 'NOSTRO' | 'POOLING' | 'GOVERNANCE';
  summary: string;
  definition: string;
  whyItMatters: string;
  formulaOrRule?: string;
  workedExample: {
    scenario: string;
    beforeNumbers: Record<string, string | number>;
    actionSteps: string[];
    afterNumbers: Record<string, string | number>;
    accountingJournal?: {
      debit: string;
      credit: string;
      amount: string;
    };
  };
  keyTakeaways: string[];
}
