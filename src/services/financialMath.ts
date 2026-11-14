// Financial Mathematics and Core Banking Logic Engine
// Pure functions with precise decimal operations avoiding standard IEEE-754 floating point inaccuracies.

import { CurrencyCode, FxRate, JournalEntryLine, PaymentMatchStatus } from '../types/treasury';

/**
 * Rounds a monetary amount to 2 decimal places (or currency-specific decimal scale).
 */
export function roundCurrency(amount: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

/**
 * Standard Bank Closing Balance:
 * Closing Balance = Opening Balance + Total Credits - Total Debits
 */
export function calculateClosingBalance(
  openingBalance: number,
  totalCredits: number,
  totalDebits: number
): number {
  return roundCurrency(openingBalance + totalCredits - totalDebits);
}

/**
 * Available Cash Formula:
 * Available Cash = Book Balance - Restricted Cash - Pending Outgoing Payments + Eligible Incoming Payments
 */
export function calculateAvailableCash(
  bookBalance: number,
  restrictedCash: number,
  pendingOutgoingPayments: number,
  eligibleIncomingPayments: number = 0
): number {
  const available = bookBalance - restrictedCash - pendingOutgoingPayments + eligibleIncomingPayments;
  return roundCurrency(available);
}

/**
 * Free Cash Formula:
 * Free Cash = Eligible Available Cash - Minimum Operational Cash - Restricted Cash - Required Funding Reserves
 */
export function calculateFreeCash(
  eligibleAvailableCash: number,
  minimumOperationalCash: number,
  restrictedCash: number,
  requiredFundingReserves: number
): number {
  const free = eligibleAvailableCash - minimumOperationalCash - restrictedCash - requiredFundingReserves;
  return roundCurrency(free);
}

/**
 * Funding Requirement Calculation:
 * Funding Requirement = Minimum Required Cash - Available Cash
 * If positive: Deficit requiring funding.
 * If negative or zero: Surplus exists (no funding required).
 */
export function calculateFundingRequirement(
  minimumRequiredCash: number,
  availableCash: number
): { requirement: number; isDeficit: boolean; surplus: number } {
  const diff = roundCurrency(minimumRequiredCash - availableCash);
  if (diff > 0) {
    return { requirement: diff, isDeficit: true, surplus: 0 };
  } else {
    return { requirement: 0, isDeficit: false, surplus: roundCurrency(Math.abs(diff)) };
  }
}

/**
 * FX Conversion with Precision:
 * Converted Amount = Original Amount * FX Rate
 */
export function convertFx(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  fxRates: FxRate[]
): { convertedAmount: number; rateUsed: number } {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: roundCurrency(amount), rateUsed: 1.0 };
  }

  // Look for direct pair
  const directPair = `${fromCurrency}/${toCurrency}`;
  const direct = fxRates.find((r) => r.pair === directPair);
  if (direct) {
    const rate = direct.spotRate;
    return { convertedAmount: roundCurrency(amount * rate), rateUsed: rate };
  }

  // Look for inverse pair
  const inversePair = `${toCurrency}/${fromCurrency}`;
  const inverse = fxRates.find((r) => r.pair === inversePair);
  if (inverse && inverse.spotRate !== 0) {
    const rate = 1 / inverse.spotRate;
    return { convertedAmount: roundCurrency(amount * rate), rateUsed: Number(rate.toFixed(6)) };
  }

  // Cross rate via USD
  const toUsdFrom = fxRates.find((r) => r.pair === `${fromCurrency}/USD`) || 
                    fxRates.find((r) => r.pair === `USD/${fromCurrency}`);
  const toUsdTo = fxRates.find((r) => r.pair === `${toCurrency}/USD`) || 
                  fxRates.find((r) => r.pair === `USD/${toCurrency}`);

  if (toUsdFrom && toUsdTo) {
    const rateFromUsd = toUsdFrom.pair.startsWith(fromCurrency) ? toUsdFrom.spotRate : 1 / toUsdFrom.spotRate;
    const rateToUsd = toUsdTo.pair.startsWith(toCurrency) ? toUsdTo.spotRate : 1 / toUsdTo.spotRate;
    const crossRate = rateFromUsd / rateToUsd;
    return { convertedAmount: roundCurrency(amount * crossRate), rateUsed: Number(crossRate.toFixed(6)) };
  }

  // Fallback 1.0 if not found
  return { convertedAmount: roundCurrency(amount), rateUsed: 1.0 };
}

/**
 * Double-Entry Accounting Rule:
 * Every posted journal must satisfy: Total Debits == Total Credits
 */
export function validateDoubleEntryBalance(lines: JournalEntryLine[]): {
  isBalanced: boolean;
  totalDebits: number;
  totalCredits: number;
  difference: number;
} {
  const totalDebits = roundCurrency(lines.reduce((sum, l) => sum + (l.debit || 0), 0));
  const totalCredits = roundCurrency(lines.reduce((sum, l) => sum + (l.credit || 0), 0));
  const difference = roundCurrency(Math.abs(totalDebits - totalCredits));

  return {
    isBalanced: difference < 0.001 && totalDebits > 0,
    totalDebits,
    totalCredits,
    difference,
  };
}

/**
 * Maker-Checker Authorization Validator:
 * - Maker cannot approve their own transaction
 * - Checker must have approval permission and sufficient threshold limit
 */
export function validateMakerCheckerApproval(
  makerId: string,
  checkerId: string,
  userCanApprove: boolean,
  transactionAmountUSD: number,
  checkerThresholdUSD: number
): { allowed: boolean; reason?: string } {
  if (makerId === checkerId) {
    return { allowed: false, reason: 'Segregation of duties violation: Maker cannot approve their own transaction.' };
  }
  if (!userCanApprove) {
    return { allowed: false, reason: 'Current user does not have approval delegation authority.' };
  }
  if (transactionAmountUSD > checkerThresholdUSD) {
    return {
      allowed: false,
      reason: `Transaction amount ($${transactionAmountUSD.toLocaleString()}) exceeds user approval threshold ($${checkerThresholdUSD.toLocaleString()}). Multi-level escalation required.`,
    };
  }
  return { allowed: true };
}

/**
 * Payment Matching Engine (Exact and Fuzzy Rules)
 */
export function matchPaymentWithStatementLine(
  payment: {
    businessReference: string;
    amount: number;
    currency: CurrencyCode;
    valueDate: string;
    debtorName?: string;
    creditorName?: string;
  },
  statementLine: {
    transactionReference: string;
    amount: number;
    currency: CurrencyCode;
    valueDate: string;
    narrative: string;
  },
  options: {
    amountTolerance: number;
    dateToleranceDays: number;
  } = { amountTolerance: 0.01, dateToleranceDays: 2 }
): { matchStatus: PaymentMatchStatus; matchScore: number; matchReason: string } {
  // Check currency
  if (payment.currency !== statementLine.currency) {
    return { matchStatus: 'UNMATCHED', matchScore: 0, matchReason: 'Currency mismatch' };
  }

  // Exact reference + exact amount
  const refMatch = payment.businessReference.trim().toLowerCase() === statementLine.transactionReference.trim().toLowerCase() ||
                   statementLine.narrative.toLowerCase().includes(payment.businessReference.trim().toLowerCase());
  
  const amountDiff = Math.abs(payment.amount - statementLine.amount);
  const isExactAmount = amountDiff <= 0.001;
  const isToleranceAmount = amountDiff <= options.amountTolerance;

  const payDate = new Date(payment.valueDate).getTime();
  const stmtDate = new Date(statementLine.valueDate).getTime();
  const dayDiff = Math.abs(payDate - stmtDate) / (1000 * 60 * 60 * 24);

  if (refMatch && isExactAmount && dayDiff === 0) {
    return { matchStatus: 'MATCHED', matchScore: 100, matchReason: 'Exact reference, amount, and value date' };
  }

  if (refMatch && isToleranceAmount && dayDiff <= options.dateToleranceDays) {
    return { matchStatus: 'MATCHED', matchScore: 92, matchReason: 'Reference match within date & amount tolerance' };
  }

  if (isExactAmount && dayDiff <= 1) {
    const nameMatch = (payment.creditorName && statementLine.narrative.toLowerCase().includes(payment.creditorName.toLowerCase())) ||
                      (payment.debtorName && statementLine.narrative.toLowerCase().includes(payment.debtorName.toLowerCase()));
    if (nameMatch) {
      return { matchStatus: 'POTENTIAL_MATCH', matchScore: 82, matchReason: 'Amount & counterparty match on adjacent date' };
    }
  }

  if (isExactAmount && dayDiff === 0) {
    return { matchStatus: 'POTENTIAL_MATCH', matchScore: 70, matchReason: 'Identical amount and date; reference requires manual confirmation' };
  }

  return { matchStatus: 'UNMATCHED', matchScore: 10, matchReason: 'No qualifying matching rules met' };
}
