/* WorkWell 360 — M-Pesa client helper (Phase 2 preview).
   NOT imported by the app yet, so the PWA keeps working offline. When the
   payments backend (../server) is deployed, set API and wire payWithMpesa()
   into the store checkout and paid counselling booking.

   Entitlements are granted by the SERVER on a confirmed payment — the client
   only mirrors a server-confirmed purchase into localStorage. */

import { store } from './store.js';

// Point this at your deployed payments backend.
export const API = 'http://127.0.0.1:8790';

// A stable per-device id so entitlements survive reloads (until real accounts exist).
function deviceId() {
  const s = store.get();
  if (!s.deviceId) store.update(st => { st.deviceId = 'dev-' + Math.random().toString(36).slice(2, 10); });
  return store.get().deviceId;
}

/** Start an STK Push and poll until the server confirms the result. */
export async function payWithMpesa(item, phone, { onStatus } = {}) {
  onStatus && onStatus('starting');
  const start = await fetch(`${API}/pay/stk`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item, phone, owner: deviceId() }),
  }).then(r => r.json());
  if (start.error) throw new Error(start.error);

  onStatus && onStatus('prompt-sent'); // "Check your phone for the M-Pesa prompt…"
  for (let i = 0; i < 24; i++) {                 // ~60s
    await new Promise(r => setTimeout(r, 2500));
    const s = await fetch(`${API}/pay/status/${start.checkoutId}`).then(r => r.json());
    if (s.status === 'paid') {
      if (s.entitlement) applyEntitlementLocally(s.entitlement);
      onStatus && onStatus('paid');
      return s;
    }
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
    s.cart = s.cart.filter(x => x !== ent.item);
  });
}
