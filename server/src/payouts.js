/* ===========================================================
   payouts.js — counsellor payout (M-Pesa B2C), Phase 4

   Flow:
   1. A paid counselling session (kind 'session') creates a commission
      LEDGER entry: gross = platformFee + counsellorShare.
   2. An admin "run" initiates B2C payments for unsettled ledger entries.
      Shares above PAYOUT_MAX_AUTO are HELD for manual approval.
   3. Safaricom's B2C ResultURL callback settles the payout and marks the
      ledger settled. Mock mode simulates this via /dev/b2c-result.

   The counsellor's payout MSISDN comes from the server-owned providers table
   and is only ever stored MASKED on a payout record.
   =========================================================== */
import express from 'express';
import crypto from 'node:crypto';
import { config } from './config.js';
import { store } from './store.js';
import { b2cPayment, mask } from './mpesa.js';
import { getProviderRate } from './providers.js';

const log = (...a) => console.log(new Date().toISOString(), ...a);

/** Called from the payment result applier when a session is confirmed paid. */
export function onSessionPaid(tx) {
  if (store.getLedger(tx.id)) return; // idempotent
  const platformFee = Math.round(tx.amount * config.payouts.platformPct);
  const counsellorShare = tx.amount - platformFee;
  store.addLedger({
    txId: tx.id, providerId: tx.providerId || null,
    gross: tx.amount, platformFee, counsellorShare,
    settled: false, payoutId: null, createdAt: Date.now(),
  });
  log('LEDGER', tx.id, `gross ${tx.amount} = platform ${platformFee} + counsellor ${counsellorShare}`);
}

/** Initiate the actual B2C transfer for a payout record (full MSISDN from providers). */
async function initiate(p) {
  const pr = getProviderRate(p.providerId);
  const msisdn = pr && pr.payout;
  if (!msisdn) { store.patchPayout(p.id, { status: 'failed', reason: 'no payout number on file' }); return; }
  store.patchPayout(p.id, { status: 'processing' });
  const b = await b2cPayment({ msisdn, amount: p.amount, remarks: `WW payout ${p.ledgerTxId}` });
  if (!b.ok) { store.patchPayout(p.id, { status: 'failed', reason: b.error }); log('PAYOUT FAILED', p.id, b.error); return; }
  store.patchPayout(p.id, { conversationId: b.conversationId, mock: !!b.mock });
  log('PAYOUT SENT', p.id, p.providerId, p.amount, config.mock ? '(mock)' : '');
}

/** Shared B2C result applier (idempotent) — used by the real callback and dev sim. */
function applyB2cResult(conversationId, ok, receipt, reason) {
  const p = store.findPayoutByConversation(conversationId);
  if (!p || p.status === 'settled') return;
  if (ok) {
    store.patchPayout(p.id, { status: 'settled', receipt: receipt || null, settledAt: Date.now() });
    store.patchLedger(p.ledgerTxId, { settled: true, settledAt: Date.now() });
    log('PAYOUT SETTLED', p.id, receipt || '');
  } else {
    store.patchPayout(p.id, { status: 'failed', reason: reason || 'B2C failed' });
    log('PAYOUT RESULT FAILED', p.id, reason);
  }
}

export function payoutsRouter() {
  const r = express.Router();

  const admin = (req, res, next) => {
    const t = req.get('x-admin-token') || '';
    const a = config.payouts.adminToken;
    if (!a || t.length !== a.length || !crypto.timingSafeEqual(Buffer.from(t), Buffer.from(a))) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Ledger & payouts visibility (ombudsperson/finance)
  r.get('/admin/ledger', admin, (_req, res) => res.json(store.listLedger()));
  r.get('/admin/payouts', admin, (req, res) =>
    res.json(store.listPayouts().filter(p => !req.query.status || p.status === req.query.status)));

  // Run settlement for all unsettled, not-yet-queued ledger entries.
  r.post('/admin/payouts/run', admin, async (req, res) => {
    const pending = store.listLedger().filter(l => !l.settled && !l.payoutId && l.counsellorShare > 0 && l.providerId);
    const results = [];
    for (const l of pending) {
      const held = l.counsellorShare > config.payouts.maxAuto;
      const pr = getProviderRate(l.providerId);
      const p = store.addPayout({
        ledgerTxId: l.txId, providerId: l.providerId,
        msisdn: pr && pr.payout ? mask(pr.payout) : null,
        amount: l.counsellorShare,
        status: held ? 'held' : 'processing',
      });
      store.patchLedger(l.txId, { payoutId: p.id });
      if (held) { results.push({ payoutId: p.id, txId: l.txId, amount: l.counsellorShare, status: 'held' }); continue; }
      await initiate(p);
      results.push({ payoutId: p.id, txId: l.txId, amount: l.counsellorShare, status: store.getPayout(p.id).status });
    }
    res.json({ queued: results.length, results });
  });

  // Approve a held (large) payout, then initiate it.
  r.post('/admin/payouts/:id/approve', admin, async (req, res) => {
    const p = store.getPayout(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    if (p.status !== 'held') return res.status(400).json({ error: 'Not awaiting approval' });
    await initiate(p);
    res.json(store.getPayout(p.id));
  });

  // Safaricom B2C result & timeout callbacks
  r.post('/mpesa/b2c/result/:secret', (req, res) => {
    if (req.params.secret !== config.mpesa.callbackSecret) return res.status(404).end();
    res.json({ ResultCode: 0, ResultDesc: 'ok' });
    const R = req.body && req.body.Result;
    if (!R) return;
    const meta = Object.fromEntries(((R.ResultParameters && R.ResultParameters.ResultParameter) || []).map(i => [i.Key, i.Value]));
    applyB2cResult(R.ConversationID, R.ResultCode === 0, R.TransactionID || meta.TransactionReceipt, R.ResultDesc);
  });
  r.post('/mpesa/b2c/timeout/:secret', (req, res) => {
    if (req.params.secret !== config.mpesa.callbackSecret) return res.status(404).end();
    res.json({ ResultCode: 0, ResultDesc: 'ok' });
    const cid = req.body && req.body.Result && req.body.Result.ConversationID;
    const p = cid && store.findPayoutByConversation(cid);
    if (p && p.status === 'processing') store.patchPayout(p.id, { status: 'timeout' }); // retryable
  });

  // DEV: simulate a B2C result without real M-Pesa
  if (config.devRoutes) {
    r.post('/dev/b2c-result/:conversationId', (req, res) => {
      const ok = (req.query.result || 'success') === 'success';
      applyB2cResult(req.params.conversationId, ok, ok ? 'B2C' + Math.random().toString(36).slice(2, 8).toUpperCase() : null, 'Simulated failure');
      res.json({ ok: true, applied: ok ? 'settled' : 'failed' });
    });
  }

  return r;
}
