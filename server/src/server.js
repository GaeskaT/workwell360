/* WorkWell 360 payments backend — Phase 1 skeleton.
   Endpoints:
     GET  /health
     GET  /catalog
     POST /pay/stk               { item, phone, owner? }  -> { checkoutId }
     GET  /pay/status/:id                                 -> { status, entitlement? }
     GET  /entitlements/:owner                            -> [ ... ]
     POST /mpesa/callback/:secret   (Safaricom -> us)
     POST /dev/simulate-callback/:id?result=success|fail  (DEV_ROUTES only)
*/
import express from 'express';
import cors from 'cors';
import { config, banner } from './config.js';
import { getItem, CATALOG } from './catalog.js';
import { store } from './store.js';
import { stkPush, stkQuery, normalizeMsisdn, mask } from './mpesa.js';
import { grantEntitlement } from './entitlements.js';
import { getProviderRate } from './providers.js';
import { reportsRouter } from './reports.js';
import { payoutsRouter, onSessionPaid } from './payouts.js';

const app = express();
app.set('trust proxy', false); // never derive client IP from proxy headers
app.use(express.json());
app.use(cors({
  origin(origin, cb) {
    if (!origin || config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
}));

const log = (...a) => console.log(new Date().toISOString(), ...a);

/* ── health & catalog ────────────────────────────────────────────────────── */
app.get('/health', (_req, res) => res.json({ ok: true, mode: config.env, mock: config.mock }));
app.get('/catalog', (_req, res) =>
  res.json(Object.fromEntries(Object.entries(CATALOG).map(([id, v]) =>
    [id, { name: v.name, price: v.price, kind: v.kind }]))));

/* ── start payment ───────────────────────────────────────────────────────── */
app.post('/pay/stk', async (req, res) => {
  try {
    const { item, phone, owner } = req.body || {};
    const product = getItem(item);
    if (!product) return res.status(400).json({ error: 'Unknown item' });
    let msisdn;
    try { msisdn = normalizeMsisdn(phone); }
    catch (e) { return res.status(400).json({ error: e.message }); }

    const r = await stkPush({ msisdn, amount: product.price, accountRef: product.ref, desc: product.name });
    if (!r.ok) return res.status(502).json({ error: r.error });

    store.putTx(r.checkoutId, {
      item, amount: product.price, owner: owner || 'anon',
      msisdn: mask(msisdn), status: 'pending', createdAt: Date.now(),
    });
    log('STK initiated', r.checkoutId, item, product.price, config.mock ? '(mock)' : '');
    res.json({ checkoutId: r.checkoutId, amount: product.price, item, mock: !!r.mock });
  } catch (e) {
    log('pay/stk error', e.message);
    res.status(500).json({ error: 'Payment could not be started' });
  }
});

/* ── start a per-provider counselling booking payment ─────────────────────── */
app.post('/pay/booking', async (req, res) => {
  try {
    const { provider, phone, owner } = req.body || {};
    const pr = getProviderRate(provider);
    if (!pr) return res.status(400).json({ error: 'Unknown provider' });
    if (pr.rate <= 0) return res.json({ free: true, provider }); // free provider — no payment
    let msisdn;
    try { msisdn = normalizeMsisdn(phone); }
    catch (e) { return res.status(400).json({ error: e.message }); }

    const r = await stkPush({ msisdn, amount: pr.rate, accountRef: 'WW-SESSION', desc: 'Counselling session' });
    if (!r.ok) return res.status(502).json({ error: r.error });

    store.putTx(r.checkoutId, {
      item: `session:${provider}`, kind: 'session', providerId: provider,
      amount: pr.rate, owner: owner || 'anon',
      msisdn: mask(msisdn), status: 'pending', createdAt: Date.now(),
    });
    log('BOOKING STK', r.checkoutId, provider, pr.rate, config.mock ? '(mock)' : '');
    res.json({ checkoutId: r.checkoutId, amount: pr.rate, provider, mock: !!r.mock });
  } catch (e) {
    log('pay/booking error', e.message);
    res.status(500).json({ error: 'Booking payment could not be started' });
  }
});

/* ── poll status (reconciles via STK query if a callback is late) ─────────── */
app.get('/pay/status/:id', async (req, res) => {
  const tx = store.getTx(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Unknown transaction' });

  if (tx.status === 'pending' && !config.mock && Date.now() - tx.createdAt > 5000) {
    try {
      const q = await stkQuery(tx.id);
      if (q.paid) applyResult(tx.id, { ok: true });
      else if (q.failed) applyResult(tx.id, { ok: false, reason: q.reason });
    } catch (e) { log('stkQuery error', e.message); }
  }
  const fresh = store.getTx(req.params.id);
  const entitlement = fresh.status === 'paid'
    ? store.entitlementsFor(fresh.owner).find(e => e.source === fresh.id) || null : null;
  res.json({ status: fresh.status, item: fresh.item, receipt: fresh.receipt || null, reason: fresh.reason || null, entitlement });
});

/* ── list entitlements for an owner (deviceId/userId) ─────────────────────── */
app.get('/entitlements/:owner', (req, res) => res.json(store.entitlementsFor(req.params.owner)));

/* ── Safaricom callback (source of truth) ────────────────────────────────── */
app.post('/mpesa/callback/:secret', (req, res) => {
  if (req.params.secret !== config.mpesa.callbackSecret) return res.status(404).end();
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' }); // ACK fast; process after

  const cb = req.body?.Body?.stkCallback;
  if (!cb) return;
  if (cb.ResultCode === 0) {
    const meta = Object.fromEntries((cb.CallbackMetadata?.Item || []).map(i => [i.Name, i.Value]));
    applyResult(cb.CheckoutRequestID, { ok: true, amount: Number(meta.Amount), receipt: meta.MpesaReceiptNumber });
  } else {
    applyResult(cb.CheckoutRequestID, { ok: false, reason: cb.ResultDesc });
  }
});

/* ── DEV: simulate a Safaricom callback without real M-Pesa ───────────────── */
if (config.devRoutes) {
  app.post('/dev/simulate-callback/:id', (req, res) => {
    const tx = store.getTx(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Unknown transaction' });
    const ok = (req.query.result || 'success') === 'success';
    applyResult(tx.id, ok
      ? { ok: true, amount: tx.amount, receipt: 'MOCK' + Math.random().toString(36).slice(2, 8).toUpperCase() }
      : { ok: false, reason: 'Simulated cancellation' });
    res.json({ ok: true, applied: ok ? 'paid' : 'failed' });
  });
}

/* ── shared result applier: idempotent, verifies amount, grants entitlement ─ */
function applyResult(checkoutId, { ok, amount, receipt, reason }) {
  const tx = store.getTx(checkoutId);
  if (!tx || tx.status !== 'pending') return; // idempotent: ignore dupes/unknown
  if (!ok) { store.patchTx(checkoutId, { status: 'failed', reason: reason || 'Payment failed' }); log('FAILED', checkoutId, reason); return; }
  if (amount != null && Number(amount) !== tx.amount) {
    store.patchTx(checkoutId, { status: 'amount_mismatch', reason: `expected ${tx.amount}, got ${amount}` });
    log('AMOUNT MISMATCH', checkoutId); return;
  }
  const paid = store.patchTx(checkoutId, { status: 'paid', receipt: receipt || null, paidAt: Date.now() });
  const ent = grantEntitlement(paid);
  if (paid.kind === 'session') onSessionPaid(paid); // create commission ledger entry
  log('PAID', checkoutId, receipt || '', '→ entitlement:', ent ? ent.grant : '(already owned)');
}

/* ── anonymous workplace reporting (privacy-hardened; see reports.js) ──────── */
app.use(reportsRouter());

/* ── counsellor payouts (M-Pesa B2C; see payouts.js) ──────────────────────── */
app.use(payoutsRouter());

app.listen(config.port, () => {
  console.log('\n' + banner());
  console.log(`  → listening on http://127.0.0.1:${config.port}\n`);
});
