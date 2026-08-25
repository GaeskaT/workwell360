# WorkWell 360 — Counsellor payouts (M-Pesa B2C)

Phase 4 of the payments plan: after the platform **collects** a session fee (STK, done), it **splits**
the fee into a platform fee + counsellor share and **settles** the counsellor via **B2C**.

## Flow

```
paid session (kind 'session')
        │  onSessionPaid()
        ▼
   LEDGER entry   gross = platformFee + counsellorShare   (settled:false)
        │  POST /admin/payouts/run
        ▼
   PAYOUT record  ── share > PAYOUT_MAX_AUTO ? 'held' (needs approval) : B2C paymentrequest ('processing')
        │  Safaricom → /mpesa/b2c/result   (or /dev/b2c-result in mock)
        ▼
   payout 'settled' (+receipt)  →  ledger settled:true
```

- **Commission split:** `COMMISSION_PLATFORM_PCT` (default 0.2 → platform 20%, counsellor 80%).
- **Manual approval:** shares above `PAYOUT_MAX_AUTO` (default 20 000) are **held** until an admin
  approves them — a safe default for launch.
- **Payout number:** the counsellor's B2C MSISDN lives only in the server-owned providers table
  (`providers.js`, set during onboarding). It is **never** sent to the client and only stored
  **masked** on a payout record.

## Endpoints (all require `x-admin-token`, falls back to `REPORT_ADMIN_TOKEN`)

| Method | Path | Does |
|--------|------|------|
| GET  | `/admin/ledger` | commission ledger (one row per paid session) |
| GET  | `/admin/payouts?status=` | payout records |
| POST | `/admin/payouts/run` | queue B2C for all unsettled, un-queued ledger entries |
| POST | `/admin/payouts/:id/approve` | approve a held (large) payout, then send it |
| POST | `/mpesa/b2c/result/:secret` | Safaricom B2C result → settle |
| POST | `/mpesa/b2c/timeout/:secret` | Safaricom queue timeout → mark retryable |
| POST | `/dev/b2c-result/:conversationId?result=success\|fail` | mock-only simulate |

## Test (mock — no B2C creds needed)

```bash
B=http://127.0.0.1:8790 ; T=your-admin-token
# 1. collect a session fee
CID=$(curl -s -X POST $B/pay/booking -H 'Content-Type: application/json' \
  -d '{"provider":"p2","phone":"254708374149","owner":"dev-x"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['checkoutId'])")
curl -s -X POST "$B/dev/simulate-callback/$CID?result=success" >/dev/null
# 2. ledger split appears
curl -s $B/admin/ledger -H "x-admin-token: $T"
# 3. run payouts (sends B2C)
curl -s -X POST $B/admin/payouts/run -H "x-admin-token: $T"
# 4. simulate Safaricom's B2C result to settle
CONV=... # conversationId from /admin/payouts
curl -s -X POST "$B/dev/b2c-result/$CONV?result=success"
```

## Going live (B2C specifics)

- Request a **B2C shortcode** and fund its **Utility / disbursement** account; keep enough float.
- Create the **Initiator** user and generate the **SecurityCredential** (the initiator password
  encrypted with Safaricom's **production B2C certificate**). Put it in `MPESA_B2C_SECURITY_CREDENTIAL`;
  never expose it to the client.
- Set `MPESA_B2C_SHORTCODE`, `MPESA_B2C_INITIATOR`, and a real HTTPS `MPESA_CALLBACK_BASE`; whitelist
  the result/timeout URLs with Safaricom.
- **Idempotency & reconciliation:** results are matched by `ConversationID`; run a nightly reconcile
  of ledger vs payouts vs the M-Pesa statement. Handle `timeout` with a retry policy.
- **Charges & compliance:** B2C transactions incur Safaricom charges — fold them into the platform
  fee. Consider tax/withholding, KYC of counsellors, payout schedules (e.g. weekly batching), and a
  minimum payout threshold. Keep an audit trail of approvals for held payouts.
- Swap the JSON store for an encrypted DB (see `docs/MPESA_INTEGRATION.md` §8).
