import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
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
} from './src/services/mockData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const server = http.createServer(app);

  app.use(express.json());

  // ----------------------------------------------------
  // REST API v1 Endpoints (GCMS Architecture)
  // ----------------------------------------------------

  // Health Check
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'UP',
      system: 'Global Treasury & Cash Operations Platform (GCMS)',
      timestamp: new Date().toISOString(),
      version: '2.4.0',
    });
  });

  // Enterprise Architecture Blueprint
  app.get('/api/v1/architecture-blueprint', (_req, res) => {
    const docPath = path.resolve(__dirname, 'docs', 'GCMS_ENTERPRISE_ARCHITECTURE_DDD_BLUEPRINT.md');
    res.sendFile(docPath);
  });

  // 1. Legal Entities
  app.get('/api/v1/entities', (_req, res) => {
    res.json({ data: initialEntities, total: initialEntities.length });
  });

  app.get('/api/v1/entities/hierarchy', (_req, res) => {
    const root = initialEntities.filter((e) => e.parentId === null);
    res.json({ root, all: initialEntities });
  });

  // 2. Bank Accounts & Balances
  app.get('/api/v1/accounts', (req, res) => {
    const { entityId, currency } = req.query;
    let accounts = [...initialBankAccounts];
    if (entityId && entityId !== 'ALL') {
      accounts = accounts.filter((a) => a.entityId === entityId);
    }
    if (currency) {
      accounts = accounts.filter((a) => a.currency === currency);
    }
    res.json({ data: accounts, total: accounts.length });
  });

  // 3. Cash Position Consolidation
  app.get('/api/v1/cash-positions/consolidated', (_req, res) => {
    const totalBookUSD = initialBankAccounts.reduce((sum, a) => sum + a.bookBalance, 0);
    const totalAvailableUSD = initialBankAccounts.reduce((sum, a) => sum + a.availableBalance, 0);
    const totalRestrictedUSD = initialBankAccounts.reduce((sum, a) => sum + a.restrictedBalance, 0);

    res.json({
      baseCurrency: 'USD',
      businessDate: '2026-11-05',
      totalBookCash: totalBookUSD,
      totalAvailableCash: totalAvailableUSD,
      totalRestrictedCash: totalRestrictedUSD,
      totalAccounts: initialBankAccounts.length,
      asOf: new Date().toISOString(),
    });
  });

  // 4. Cash Realignments
  app.get('/api/v1/cash-realignments', (_req, res) => {
    res.json({ data: initialRealignments, total: initialRealignments.length });
  });

  app.post('/api/v1/cash-realignments', (req, res) => {
    const proposal = req.body;
    res.status(201).json({
      message: 'Realignment proposal created and queued for checker approval',
      data: {
        id: `REALIGN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'PROPOSED',
        createdAt: new Date().toISOString(),
        ...proposal,
      },
    });
  });

  // 5. Cash Funding
  app.get('/api/v1/cash-funding', (_req, res) => {
    res.json({ data: initialCashFunding, total: initialCashFunding.length });
  });

  // 6. Cash Adjustments
  app.get('/api/v1/cash-adjustments', (_req, res) => {
    res.json({ data: initialCashAdjustments, total: initialCashAdjustments.length });
  });

  // 7. Cash Flows
  app.get('/api/v1/cash-flows', (_req, res) => {
    res.json({ data: initialCashFlows, total: initialCashFlows.length });
  });

  // 8. Payments & Matching
  app.get('/api/v1/payment-matching/unmatched', (_req, res) => {
    const unmatched = initialPaymentTransactions.filter((p) => p.matchStatus === 'UNMATCHED');
    res.json({ data: unmatched, total: unmatched.length });
  });

  app.get('/api/v1/payment-matching/statements', (_req, res) => {
    res.json({ data: initialStatementLines, total: initialStatementLines.length });
  });

  // 9. Nostro Accounts
  app.get('/api/v1/nostro', (_req, res) => {
    res.json({ data: initialNostroAccounts, total: initialNostroAccounts.length });
  });

  // 10. General Ledger & Trial Balance
  app.get('/api/v1/accounting/trial-balance', (_req, res) => {
    res.json({
      chartOfAccounts: initialChartOfAccounts,
      journalEntriesCount: initialJournalEntries.length,
      isBalanced: true,
      variance: 0.0,
    });
  });

  app.get('/api/v1/accounting/journals', (_req, res) => {
    res.json({ data: initialJournalEntries, total: initialJournalEntries.length });
  });

  // 11. Foreign Exchange (FX) Rates
  app.get('/api/v1/fx-rates', (_req, res) => {
    res.json({ data: initialFxRates, total: initialFxRates.length });
  });

  // 12. Operations Tasks
  app.get('/api/v1/operations/tasks', (_req, res) => {
    res.json({ data: initialOperationsTasks, total: initialOperationsTasks.length });
  });

  // 13. System Exceptions
  app.get('/api/v1/exceptions', (_req, res) => {
    res.json({ data: initialExceptions, total: initialExceptions.length });
  });

  // 14. Approval Requests
  app.get('/api/v1/approvals', (_req, res) => {
    res.json({ data: initialApprovalRequests, total: initialApprovalRequests.length });
  });

  // 15. Audit Logs
  app.get('/api/v1/audit-logs', (_req, res) => {
    res.json({ data: initialAuditLogs, total: initialAuditLogs.length });
  });

  // 16. Liquidity Pools
  app.get('/api/v1/liquidity/pools', (_req, res) => {
    res.json({ data: initialLiquidityPools, total: initialLiquidityPools.length });
  });

  // ----------------------------------------------------
  // Frontend Serving (Vite Middlewares in Dev / Static in Prod)
  // ----------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[GCMS] Global Treasury Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[GCMS] Failed to initialize server:', err);
  process.exit(1);
});
