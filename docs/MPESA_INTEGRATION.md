# WorkWell 360 — M-Pesa Payment Integration Plan

**Status:** Draft v1 · 2026-08-25
**Applies to:** WorkWell 360 PWA (`GaeskaT/workwell360`) + a new payments backend
**Rails:** Safaricom **Daraja API** (M-Pesa) — STK Push, C2B, B2C, Ratiba

---

## 0. The one thing to understand first

The app today is a **static, client-only PWA** (GitHub Pages + `localStorage`). M-Pesa **cannot** be
called from the browser:

- Daraja needs a **Consumer Key/Secret + Passkey** that must never ship to a client.
- Safaricom confirms every payment by **POSTing to a server callback URL** — there is no browser in
  that loop.
- Entitlements (a paid course unlock, a booked paid session) must be granted by a **trusted server**,
  or any user could just edit `localStorage` and unlock everything for free.

**So this plan adds a small backend.** The PWA stays where it is; a separate HTTPS service brokers
M-Pesa and records who paid for what.

```
  PWA (GitHub Pages)  ──HTTPS──▶  Payments API (serverless)  ──▶  Daraja (Safaricom)
        ▲                              │  writes                       │
        │  entitlement / status        ▼  transactions + entitlements  │ callback (POST)
        └──────────────────────  Database (Firestore/D1/Postgres) ◀────┘
```

---

## 1. Which M-Pesa product for which revenue stream

The spec has 8 revenue streams. Each maps to a specific Daraja product:

| # | Revenue stream | M-Pesa flow | Notes |
|---|----------------|-------------|-------|
| 1 | Corporate subscriptions | **Paybill (C2B)** w/ `AccountReference = ORG-CODE`, or **Ratiba** standing order | B2B; often invoiced. Recurring = Ratiba or a monthly STK reminder. |
| 2 | Counselling commission | **STK Push** to collect the session fee → **B2C** to pay the counsellor their share | The platform is the merchant of record; it settles counsellors. See §6. |
| 3 | Corporate workshops | **STK Push / Paybill** | One-off, larger amounts. |
| 4 | Digital courses | **STK Push** → unlock entitlement | ⚠️ Play billing caveat — see §9. |
| 5 | Premium membership | **Ratiba** (standing order) or monthly **STK** | True auto-recurring on M-Pesa = Ratiba. |
| 6 | Retirement packages | **STK Push** (one-off or installments) | High value; consider installment schedule. |
| 7 | Licensing | Invoice / bank (out of M-Pesa scope) | Large B2B; M-Pesa optional. |
| 8 | Training & certification | **STK Push** | One-off. |

**Build order by leverage:** STK Push (collections) first — it powers streams 2,3,4,6,8. Then B2C
(counsellor payouts). Then Ratiba (recurring 1,5).

---

## 2. Daraja endpoints we will use

Base URLs: sandbox `https://sandbox.safaricom.co.ke` · production `https://api.safaricom.co.ke`

| Purpose | Method + path |
|---------|---------------|
| OAuth token | `GET /oauth/v1/generate?grant_type=client_credentials` (Basic `key:secret`, token ~3600s — **cache it**) |
| STK Push (collect) | `POST /mpesa/stkpush/v1/processrequest` |
| STK query (confirm) | `POST /mpesa/stkpushquery/v1/query` |
| C2B register URLs | `POST /mpesa/c2b/v1/registerurl` |
| B2C (payout) | `POST /mpesa/b2c/v1/paymentrequest` |
| Transaction status | `POST /mpesa/transactionstatus/v1/query` |
| Reversal (refund) | `POST /mpesa/reversal/v1/request` |

Key facts: amounts are **whole KES integers** (min 1); STK Push per-txn cap **150,000**; MSISDN
format is `2547XXXXXXXX`; `AccountReference` ≤ 12 chars; the STK `Password` =
`base64(Shortcode + Passkey + Timestamp)` with `Timestamp = YYYYMMDDHHmmss`.

---

## 3. Backend: recommended stack

Pick one — all give free HTTPS callbacks and pair cleanly with the static PWA:

- **Firebase Cloud Functions + Firestore** *(recommended)* — trivial HTTPS callbacks, a real-time DB
  for transactions/entitlements, and a natural home for user accounts later (Firebase Auth).
- **Cloudflare Workers + D1/KV** — cheapest at scale, global, but you build more plumbing.
- **Node/Express on Render or Railway** — most familiar; a always-on container.

The rest of this doc is stack-agnostic Node.

### 3.1 Environment / secrets (never in the client)
```
MPESA_ENV=sandbox|production
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_PASSKEY=...                # Lipa na M-Pesa Online passkey
MPESA_SHORTCODE=174379           # paybill/till for collections
MPESA_CALLBACK_BASE=https://api.workwell360.app   # public HTTPS
MPESA_CALLBACK_SECRET=<random-32-hex>             # unguessable callback path segment
# B2C payouts:
MPESA_B2C_SHORTCODE=...
MPESA_B2C_INITIATOR=apiuser
MPESA_B2C_SECURITY_CREDENTIAL=<initiator-password encrypted with Safaricom prod cert>
```

### 3.2 Endpoints the backend exposes
| Endpoint | Who calls it | Does |
|----------|--------------|------|
| `POST /pay/stk` | PWA | Starts an STK Push, creates a `transaction` (status `pending`) |
| `GET  /pay/status/:checkoutId` | PWA (polls) | Returns `pending/paid/failed` + entitlement |
| `POST /mpesa/callback/:secret` | **Safaricom** | Receives STK result, marks paid, grants entitlement |
| `POST /mpesa/b2c/result/:secret` | Safaricom | B2C payout result |
| `POST /mpesa/b2c/timeout/:secret` | Safaricom | B2C queue timeout |

---

## 4. Core server logic (representative)

### 4.1 Cached OAuth token
```js
let cached = { token: null, exp: 0 };
async function token() {
  if (cached.token && Date.now() < cached.exp) return cached.token;
  const auth = Buffer.from(`${KEY}:${SECRET}`).toString('base64');
  const r = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } });
  const j = await r.json();
  cached = { token: j.access_token, exp: Date.now() + 3300_000 }; // refresh a bit early
  return cached.token;
}
```

### 4.2 Start an STK Push
```js
// POST /pay/stk  { phone, item }  -> validates PRICE SERVER-SIDE, not from the client
app.post('/pay/stk', async (req, res) => {
  const { phone, item } = req.body;
  const product = CATALOG[item];                       // server-owned price list
  if (!product) return res.status(400).json({ error: 'unknown item' });
  const msisdn = normalizeMsisdn(phone);               // -> 2547XXXXXXXX
  const ts = timestamp();                              // YYYYMMDDHHmmss
  const password = Buffer.from(SHORTCODE + PASSKEY + ts).toString('base64');

  const body = {
    BusinessShortCode: SHORTCODE, Password: password, Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',          // or CustomerBuyGoodsOnline for a Till
    Amount: product.price, PartyA: msisdn, PartyB: SHORTCODE, PhoneNumber: msisdn,
    CallBackURL: `${CALLBACK_BASE}/mpesa/callback/${CALLBACK_SECRET}`,
    AccountReference: product.ref.slice(0, 12), TransactionDesc: product.name.slice(0, 20),
  };
  const r = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`,
    { method: 'POST', headers: authJson(await token()), body: JSON.stringify(body) });
  const j = await r.json();
  if (j.ResponseCode !== '0') return res.status(502).json({ error: j.errorMessage || 'stk failed' });

  await db.transactions.put(j.CheckoutRequestID, {
    status: 'pending', item, amount: product.price, msisdn: mask(msisdn), createdAt: Date.now(),
  });
  res.json({ checkoutId: j.CheckoutRequestID });        // client polls this
});
```

### 4.3 Handle Safaricom's callback (source of truth)
```js
app.post('/mpesa/callback/:secret', async (req, res) => {
  if (req.params.secret !== CALLBACK_SECRET) return res.status(404).end();
  res.json({ ResultCode: 0, ResultDesc: 'ok' });        // ACK fast; Safaricom retries otherwise

  const cb = req.body?.Body?.stkCallback;
  if (!cb) return;
  const tx = await db.transactions.get(cb.CheckoutRequestID);
  if (!tx || tx.status === 'paid') return;               // idempotent: ignore dupes

  if (cb.ResultCode === 0) {
    const meta = Object.fromEntries(cb.CallbackMetadata.Item.map(i => [i.Name, i.Value]));
    if (Number(meta.Amount) !== tx.amount) {             // verify amount, never trust blindly
      await db.transactions.patch(cb.CheckoutRequestID, { status: 'amount_mismatch' });
      return;
    }
    await db.transactions.patch(cb.CheckoutRequestID, {
      status: 'paid', receipt: meta.MpesaReceiptNumber, paidAt: Date.now(),
    });
    await grantEntitlement(tx);                           // unlock course / confirm booking / etc.
  } else {
    await db.transactions.patch(cb.CheckoutRequestID, { status: 'failed', reason: cb.ResultDesc });
  }
});
```

> **Defence in depth:** callbacks arrive over the public internet. Don't rely on them alone —
> (a) use an unguessable `:secret` path, (b) verify the **amount** matches, and (c) for anything
> high-value, additionally call **STK query** server-side to re-confirm before granting. Safaricom
> does not sign callbacks, so treat the callback as a *trigger* and the query as *proof*.

---

## 5. Client (PWA) changes

Small and contained. Replace the **demo checkout** in `js/views/store.js` (`#checkout`) and add a
paid path to counselling booking (`js/views/counselling.js`).

```js
// js/pay.js (new)
const API = 'https://api.workwell360.app';
export async function payWithMpesa(item, phone) {
  const r = await fetch(`${API}/pay/stk`, { method:'POST',
    headers:{'Content-Type':'application/json'}, body: JSON.stringify({ item, phone }) });
  const { checkoutId, error } = await r.json();
  if (error) throw new Error(error);
  // poll until the callback resolves it (max ~60s)
  for (let i = 0; i < 24; i++) {
    await new Promise(s => setTimeout(s, 2500));
    const s = await fetch(`${API}/pay/status/${checkoutId}`).then(x => x.json());
    if (s.status === 'paid') return s;                   // server says paid -> unlock
    if (s.status === 'failed') throw new Error('Payment failed or cancelled');
  }
  throw new Error('Timed out — check your phone and try again');
}
```

UI: a "Pay with M-Pesa" sheet that asks for the phone number, shows "Check your phone for the
STK prompt…", then a success/failure state. Entitlements come **from the server response**, not from
writing `localStorage` directly (local unlock only mirrors a server-confirmed purchase).

---

## 6. Counselling commission (collect → split → payout)

1. Client pays the **full session fee** via STK Push (§4.2).
2. On `paid`, record a ledger entry: `platformFee` + `counsellorShare` (e.g. 20% / 80%).
3. Settle counsellors on a schedule (e.g. weekly) via **B2C** `paymentrequest`
   (`CommandID: BusinessPayment`) from the funded B2C shortcode to each counsellor's MSISDN.
4. Reconcile: mark ledger `settled` on the B2C `ResultURL` callback; retry on timeout.

B2C requires: a separate **B2C shortcode**, a funded **Bulk Disbursement / Utility account**, an
**Initiator** user, and a **SecurityCredential** (the initiator password encrypted with Safaricom's
production certificate). Keep a **manual-approval threshold** for large payouts at launch.

---

## 7. Recurring (subscriptions & premium membership)

M-Pesa has no card-style silent recurring. Options, best first:

- **M-Pesa Ratiba (Standing Order API)** — the customer authorises a recurring debit; ideal for
  premium membership and small-org subscriptions. Set frequency + amount + start/end.
- **Monthly STK reminder** — a scheduled job sends a push notification + STK each cycle. Simple,
  but relies on the customer approving each time.
- **Corporate = invoice + Paybill** — larger orgs pay per invoice into the paybill with
  `AccountReference = ORG-CODE`; a C2B confirmation URL reconciles it to the subscription.

---

## 8. Data model additions (server-side)

```
transactions:  checkoutId(pk), item, amount, status, receipt, msisdn(masked), userId?, createdAt, paidAt
entitlements:  id(pk), userId|deviceId, kind(course|journal|membership|session), ref, source(checkoutId), grantedAt, expiresAt?
bookings:      id, providerId, userId, category, mode, when, fee, paymentStatus, checkoutId
payouts:       id, counsellorId, msisdn, amount, b2cRef, status, requestedAt, settledAt
ledger:        txId, gross, platformFee, counsellorShare, settled(bool)
```

> **Accounts:** subscriptions, memberships and cross-device entitlements really need **user accounts**
> (Firebase Auth / phone-OTP). For pure one-off digital goods you can start with a `deviceId`, but
> plan the account model before selling anything recurring.

---

## 9. ⚠️ Google Play billing compliance (read before shipping paid features)

This is a Play-Store app, so Google's Payments policy applies:

- **Real-world services are exempt** — **counselling sessions, corporate workshops, in-person
  training** may be paid with M-Pesa. This covers your biggest streams (2, 3, 8-in-person).
- **In-app digital content** (digital **courses, journals, premium membership** consumed inside the
  app) is the category Google generally requires **Google Play Billing** for. Shipping these on
  M-Pesa *inside the Android app* risks removal.

**Mitigations (choose per item):**
1. Sell digital courses/journals/membership through the **web** (the PWA on `gaeskat.github.io`, or a
   web checkout) and simply *grant access* in the app — don't present an in-app purchase flow for them
   in the Play build.
2. Use **Google Play Billing** for digital goods in the Android build, and **M-Pesa** for services.
3. Apply for Google's **user-choice / alternative billing** where available in Kenya.

Keep the **counselling, workshop and training** flows on M-Pesa in-app (compliant), and route
digital-goods purchases per the mitigation you pick. Confirm current policy at build time.

---

## 10. Security, reliability & compliance checklist

- [ ] Secrets only server-side; rotate the `MPESA_CALLBACK_SECRET`.
- [ ] **Idempotent** callbacks (dedupe on `CheckoutRequestID`); callbacks may arrive twice or late.
- [ ] **Verify amount** on every callback; re-confirm high-value via STK query.
- [ ] Prices live **server-side** (`CATALOG`) — never trust an amount sent by the client.
- [ ] Whitelist Safaricom callback IPs at the edge *in addition to* the secret path.
- [ ] Store minimal PII: masked MSISDN + `MpesaReceiptNumber` only; no full numbers in logs.
- [ ] Handle STK edge cases: user cancels, wrong PIN, insufficient funds, timeout (no callback) →
      fall back to STK query, then mark `failed` and let the user retry.
- [ ] Refunds via **Reversal API** with an internal approval step; log reason + operator.
- [ ] Reconciliation job: nightly compare `transactions(paid)` vs entitlements vs M-Pesa statement.
- [ ] Update **`privacy.html`** and the Play **Data safety** form once money/PII flows to a server —
      currently it states "data stays on device", which stops being true here.
- [ ] Rate-limit `/pay/stk` per device/phone to prevent STK spam.

---

## 11. Safaricom onboarding (do this in parallel)

1. Create a Daraja account and **sandbox app** → get sandbox Consumer Key/Secret; test with
   shortcode `174379` and the sandbox passkey.
2. Register your **business shortcode/paybill or Till** (production) and request **Lipa na M-Pesa
   Online** (STK) enablement → production passkey.
3. For payouts, request a **B2C shortcode**, create the **Initiator** + **SecurityCredential**, and
   fund the disbursement account.
4. Submit the **Go-Live** request in Daraja (test cases + callback URLs) → production credentials.
5. Whitelist your production callback domain.

---

## 12. Phased rollout

| Phase | Deliverable | Depends on |
|-------|-------------|-----------|
| **0** | Safaricom onboarding (sandbox creds, shortcodes) | — |
| **1** | Backend skeleton: token cache, `/pay/stk`, `/mpesa/callback`, transactions store (sandbox) | 0 |
| **2** | PWA checkout: store + paid counselling booking, status polling, entitlement unlock | 1 |
| **3** | Go-live for **collections** (courses/services), monitoring, reconciliation | 2, Safaricom go-live |
| **4** | **B2C** counsellor payouts + ledger settlement | 3, B2C shortcode |
| **5** | **Ratiba** recurring for membership/subscriptions; corporate paybill reconciliation | 3 |
| **6** | Refunds/reversals, dashboards, alerting, hardening | 3–5 |

**MVP = Phases 0–3** (collect money for services + courses). Payouts and recurring follow.

---

## 13. Costs

- **Daraja API:** free to use. You pay standard **M-Pesa transaction tariffs** (paybill/till on
  collections; B2C charges on payouts) — model these into the platform fee.
- **Backend:** Firebase/Cloudflare free tiers cover early volume; low hundreds of KES/mo at modest
  scale.
- **One-offs:** business shortcode/paybill registration; Play developer account (already noted, $25).

---

## 14. Open decisions (need your call)

1. **Commission split** for counselling (e.g. platform 15–25% / counsellor 75–85%)?
2. **Backend stack** — Firebase (recommended) vs Cloudflare Workers vs Node/Render?
3. **Accounts now or later** — phone-OTP accounts unlock cross-device + recurring; delay them and
   you're limited to per-device one-off goods.
4. **Digital-goods compliance** — sell courses/journals via web-grant, Play Billing, or alt-billing?
5. **Go-to-market first** — services-only on M-Pesa (fastest, compliant), digital goods next?
```
