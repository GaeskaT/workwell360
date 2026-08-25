/* Daraja client: OAuth token cache, STK Push, STK query, plus helpers.
   In MOCK mode every network call is simulated so the flow is testable offline. */
import { config } from './config.js';

const { baseUrl, mock, mpesa } = config;

/* ── helpers ─────────────────────────────────────────────────────────────── */

// Accepts 07XX…, 7XX…, +2547XX…, 2547XX… → 2547XXXXXXXX
export function normalizeMsisdn(input) {
  let d = String(input || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '254' + d.slice(1);
  else if (d.startsWith('7') || d.startsWith('1')) d = '254' + d;
  else if (d.startsWith('2540')) d = '254' + d.slice(4);
  if (!/^254(7|1)\d{8}$/.test(d)) throw new Error('Invalid Kenyan phone number');
  return d;
}

export function timestamp(date = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return (
    date.getFullYear().toString() +
    p(date.getMonth() + 1) + p(date.getDate()) +
    p(date.getHours()) + p(date.getMinutes()) + p(date.getSeconds())
  );
}

function stkPassword(ts) {
  return Buffer.from(mpesa.shortcode + mpesa.passkey + ts).toString('base64');
}
function mask(msisdn) { return msisdn.replace(/(\d{6})\d{3}(\d{3})/, '$1***$2'); }
export { mask };

/* ── OAuth token (cached ~55 min) ────────────────────────────────────────── */
let cached = { token: null, exp: 0 };
async function accessToken() {
  if (mock) return 'mock-token';
  if (cached.token && Date.now() < cached.exp) return cached.token;
  const auth = Buffer.from(`${mpesa.key}:${mpesa.secret}`).toString('base64');
  const r = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!r.ok) throw new Error(`OAuth failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  cached = { token: j.access_token, exp: Date.now() + 3300_000 };
  return cached.token;
}

/* ── STK Push (collect) ──────────────────────────────────────────────────── */
export async function stkPush({ msisdn, amount, accountRef, desc }) {
  const ts = timestamp();
  const callbackUrl = `${mpesa.callbackBase}/mpesa/callback/${mpesa.callbackSecret}`;

  if (mock) {
    const id = 'ws_CO_' + Math.random().toString(36).slice(2, 12).toUpperCase();
    return { ok: true, checkoutId: id, merchantId: 'mock-merchant', mock: true };
  }

  const body = {
    BusinessShortCode: mpesa.shortcode,
    Password: stkPassword(ts),
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: msisdn,
    PartyB: mpesa.shortcode,
    PhoneNumber: msisdn,
    CallBackURL: callbackUrl,
    AccountReference: String(accountRef).slice(0, 12),
    TransactionDesc: String(desc).slice(0, 20),
  };
  const r = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.ResponseCode !== '0') {
    return { ok: false, error: j.errorMessage || j.ResponseDescription || 'STK push failed', raw: j };
  }
  return { ok: true, checkoutId: j.CheckoutRequestID, merchantId: j.MerchantRequestID };
}

/* ── B2C (pay a counsellor their share) ──────────────────────────────────── */
export async function b2cPayment({ msisdn, amount, remarks = 'WorkWell 360 payout', occasion = 'session-share' }) {
  if (mock) {
    return { ok: true, conversationId: 'ws_B2C_' + Math.random().toString(36).slice(2, 12).toUpperCase(), mock: true };
  }
  const b = config.payouts.b2c;
  const body = {
    InitiatorName: b.initiator,
    SecurityCredential: b.securityCredential,
    CommandID: 'BusinessPayment',
    Amount: amount,
    PartyA: b.shortcode,
    PartyB: msisdn,
    Remarks: String(remarks).slice(0, 100),
    QueueTimeOutURL: `${mpesa.callbackBase}/mpesa/b2c/timeout/${mpesa.callbackSecret}`,
    ResultURL: `${mpesa.callbackBase}/mpesa/b2c/result/${mpesa.callbackSecret}`,
    Occasion: String(occasion).slice(0, 100),
  };
  const r = await fetch(`${baseUrl}/mpesa/b2c/v1/paymentrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.ResponseCode !== '0') return { ok: false, error: j.errorMessage || j.ResponseDescription || 'B2C failed', raw: j };
  return { ok: true, conversationId: j.ConversationID, originatorId: j.OriginatorConversationID };
}

/* ── STK query (reconcile when a callback is late/unreachable) ────────────── */
export async function stkQuery(checkoutId) {
  if (mock) return { pending: true, mock: true }; // dev uses /dev/simulate-callback instead
  const ts = timestamp();
  const r = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: mpesa.shortcode, Password: stkPassword(ts), Timestamp: ts,
      CheckoutRequestID: checkoutId,
    }),
  });
  const j = await r.json();
  // Still processing → Daraja returns an errorCode like 500.001.1001
  if (j.errorCode) return { pending: true, raw: j };
  const code = String(j.ResultCode);
  if (code === '0') return { paid: true, raw: j };
  return { failed: true, reason: j.ResultDesc || 'Payment not completed', code, raw: j };
}
