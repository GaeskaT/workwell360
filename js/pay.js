/* WorkWell 360 — M-Pesa client helper.
   Wired into the store checkout. Uses the backend URL from Settings; when that
   is blank the caller falls back to on-device demo mode, so the PWA still works
   offline. Entitlements are granted by the SERVER on a confirmed payment — the
   client only mirrors a server-confirmed purchase into localStorage. */

import { store, apiBase } from './store.js';

export const backendConfigured = () => !!apiBase();

// A stable per-device id so entitlements survive reloads (until real accounts exist).
function deviceId() {
  const s = store.get();
  if (!s.deviceId) store.update(st => { st.deviceId = 'dev-' + Math.random().toString(36).slice(2, 10); });
  return store.get().deviceId;
}

/** Start an STK Push for one catalog item and poll until the server confirms.
 *  `item` is a backend catalog id (== the app product id, or 'session_counsel'). */
export async function payWithMpesa(item, phone, { onStatus } = {}) {
  const base = apiBase();
  if (!base) throw new Error('NO_BACKEND');
  onStatus && onStatus('starting');
  const start = await fetch(`${base}/pay/stk`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item, phone, owner: deviceId() }),
  }).then(r => r.json());
  if (start.error) throw new Error(start.error);

  onStatus && onStatus('prompt-sent'); // "Check your phone for the M-Pesa prompt…"
  for (let i = 0; i < 24; i++) {        // ~60s
    await new Promise(r => setTimeout(r, 2500));
    const s = await fetch(`${base}/pay/status/${start.checkoutId}`).then(r => r.json());
    if (s.status === 'paid') { if (s.entitlement) applyEntitlementLocally(s.entitlement); onStatus && onStatus('paid'); return s; }
    if (s.status === 'failed' || s.status === 'amount_mismatch') throw new Error(s.reason || 'Payment failed');
  }
  throw new Error('Timed out — if you were charged it will still be recorded. Try refreshing.');
}

/** Pay a per-provider counselling session (server prices it by provider id).
 *  Returns { free:true } for free providers, or { paid:true, receipt } on success. */
export async function payBooking(providerId, phone, { onStatus } = {}) {
  const base = apiBase();
  if (!base) throw new Error('NO_BACKEND');
  onStatus && onStatus('starting');
  const start = await fetch(`${base}/pay/booking`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: providerId, phone, owner: deviceId() }),
  }).then(r => r.json());
  if (start.error) throw new Error(start.error);
  if (start.free) return { free: true };

  onStatus && onStatus('prompt-sent');
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 2500));
    const s = await fetch(`${base}/pay/status/${start.checkoutId}`).then(r => r.json());
    if (s.status === 'paid') { onStatus && onStatus('paid'); return { paid: true, receipt: s.receipt || null }; }
    if (s.status === 'failed' || s.status === 'amount_mismatch') throw new Error(s.reason || 'Payment failed');
  }
  throw new Error('Timed out — if you were charged it will still be recorded. Try refreshing.');
}

/** Mirror a server-confirmed purchase into local state (unlock course/journal/membership). */
function applyEntitlementLocally(ent) {
  store.update(s => {
    if (ent.kind === 'course') { const p = s.courseProgress[ent.grant] || { lessons: [] }; p.owned = true; s.courseProgress[ent.grant] = p; }
    else if (ent.kind === 'membership') s.profile.premium = true;
    else if (ent.kind === 'journal') (s.owned = s.owned || []).push(ent.grant);
    s.cart = (s.cart || []).filter(x => x !== ent.item);
  });
}
