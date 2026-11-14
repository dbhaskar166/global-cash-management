import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateClosingBalance,
  calculateAvailableCash,
  calculateFreeCash,
  calculateFundingRequirement,
  convertFx,
  validateDoubleEntryBalance,
  validateMakerCheckerApproval,
  matchPaymentWithStatementLine,
} from './financialMath';
import { FxRate, JournalEntryLine } from '../types/treasury';

test('calculateClosingBalance computes accurate balance without float drift', () => {
  const opening = 1000000.55;
  const credits = 250000.45;
  const debits = 125000.10;
  const closing = calculateClosingBalance(opening, credits, debits);
  assert.equal(closing, 1125000.90);
});

test('calculateAvailableCash respects restricted cash and pending outflows', () => {
  const bookBalance = 5000000;
  const restricted = 500000;
  const pendingOutgoing = 250000;
  const eligibleIncoming = 100000;
  const available = calculateAvailableCash(bookBalance, restricted, pendingOutgoing, eligibleIncoming);
  assert.equal(available, 4350000);
});

test('calculateFreeCash subtracts required reserves and operational baseline', () => {
  const available = 4350000;
  const minOperational = 1000000;
  const restricted = 200000;
  const reserves = 350000;
  const freeCash = calculateFreeCash(available, minOperational, restricted, reserves);
  assert.equal(freeCash, 2800000);
});

test('calculateFundingRequirement identifies deficits vs surplus', () => {
  // Case 1: Deficit
  const resultDeficit = calculateFundingRequirement(2000000, 1400000);
  assert.equal(resultDeficit.isDeficit, true);
  assert.equal(resultDeficit.requirement, 600000);
  assert.equal(resultDeficit.surplus, 0);

  // Case 2: Surplus
  const resultSurplus = calculateFundingRequirement(1000000, 1850000);
  assert.equal(resultSurplus.isDeficit, false);
  assert.equal(resultSurplus.requirement, 0);
  assert.equal(resultSurplus.surplus, 850000);
});

test('convertFx converts currencies accurately using direct and inverse rates', () => {
  const rates: FxRate[] = [
    {
      id: 'fx-eur-usd',
      pair: 'EUR/USD',
      fromCurrency: 'EUR',
      toCurrency: 'USD',
      spotRate: 1.085,
      bidRate: 1.0848,
      askRate: 1.0852,
      previousClose: 1.082,
      changePercent: 0.28,
      rateSource: 'REUTERS',
      effectiveDate: '2026-11-05',
      tenor: 'SPOT',
    },
    {
      id: 'fx-gbp-usd',
      pair: 'GBP/USD',
      fromCurrency: 'GBP',
      toCurrency: 'USD',
      spotRate: 1.295,
      bidRate: 1.2948,
      askRate: 1.2952,
      previousClose: 1.291,
      changePercent: 0.31,
      rateSource: 'BLOOMBERG',
      effectiveDate: '2026-11-05',
      tenor: 'SPOT',
    },
  ];

  // Direct EUR to USD
  const res1 = convertFx(100000, 'EUR', 'USD', rates);
  assert.equal(res1.convertedAmount, 108500);

  // Inverse USD to EUR
  const res2 = convertFx(108500, 'USD', 'EUR', rates);
  assert.equal(Math.round(res2.convertedAmount), 100000);

  // Identity
  const res3 = convertFx(50000, 'USD', 'USD', rates);
  assert.equal(res3.convertedAmount, 50000);
});

test('validateDoubleEntryBalance enforces Debits == Credits', () => {
  const balancedLines: JournalEntryLine[] = [
    { id: '1', glAccount: '10100', glAccountName: 'Cash', description: 'Debit cash', debit: 250000, credit: 0, currency: 'USD' },
    { id: '2', glAccount: '20100', glAccountName: 'Intercompany Payable', description: 'Credit liability', debit: 0, credit: 250000, currency: 'USD' },
  ];
  const balancedResult = validateDoubleEntryBalance(balancedLines);
  assert.equal(balancedResult.isBalanced, true);
  assert.equal(balancedResult.difference, 0);

  const unbalancedLines: JournalEntryLine[] = [
    { id: '1', glAccount: '10100', glAccountName: 'Cash', description: 'Debit cash', debit: 250000, credit: 0, currency: 'USD' },
    { id: '2', glAccount: '20100', glAccountName: 'Intercompany Payable', description: 'Credit liability', debit: 0, credit: 245000, currency: 'USD' },
  ];
  const unbalancedResult = validateDoubleEntryBalance(unbalancedLines);
  assert.equal(unbalancedResult.isBalanced, false);
  assert.equal(unbalancedResult.difference, 5000);
});

test('validateMakerCheckerApproval prevents self-approval and enforces threshold limits', () => {
  // Self approval forbidden
  const selfCheck = validateMakerCheckerApproval('usr-maker-1', 'usr-maker-1', true, 50000, 1000000);
  assert.equal(selfCheck.allowed, false);
  assert.match(selfCheck.reason!, /Segregation of duties/);

  // Threshold breach
  const thresholdCheck = validateMakerCheckerApproval('usr-maker-1', 'usr-checker-1', true, 2500000, 1000000);
  assert.equal(thresholdCheck.allowed, false);
  assert.match(thresholdCheck.reason!, /exceeds user approval threshold/);

  // Valid maker-checker approval
  const validCheck = validateMakerCheckerApproval('usr-maker-1', 'usr-checker-1', true, 450000, 1000000);
  assert.equal(validCheck.allowed, true);
});

test('matchPaymentWithStatementLine matches exact and tolerance criteria', () => {
  const payment = {
    businessReference: 'SWIFT-REF-98124',
    amount: 154200.50,
    currency: 'USD' as const,
    valueDate: '2026-11-05',
    creditorName: 'Siemens Energy AG',
  };

  const exactStmt = {
    transactionReference: 'SWIFT-REF-98124',
    amount: 154200.50,
    currency: 'USD' as const,
    valueDate: '2026-11-05',
    narrative: 'Settlement for invoice SWIFT-REF-98124 Siemens Energy',
  };

  const exactResult = matchPaymentWithStatementLine(payment, exactStmt);
  assert.equal(exactResult.matchStatus, 'MATCHED');
  assert.equal(exactResult.matchScore, 100);

  const diffCurrencyStmt = {
    transactionReference: 'SWIFT-REF-98124',
    amount: 154200.50,
    currency: 'EUR' as const,
    valueDate: '2026-11-05',
    narrative: 'Payment',
  };
  const diffCurrencyResult = matchPaymentWithStatementLine(payment, diffCurrencyStmt);
  assert.equal(diffCurrencyResult.matchStatus, 'UNMATCHED');
});
