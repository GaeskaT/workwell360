# WorkWell 360 — Payments backend (Phase 1)

M-Pesa (Daraja) skeleton: **STK Push → callback → entitlement**, with a server-owned price catalog
and a file-backed store. Runs in **MOCK mode** out of the box so you can test the whole flow with
**no Daraja credentials**, then flip to the real sandbox by filling in `.env`.

See the full design in [`../docs/MPESA_INTEGRATION.md`](../docs/MPESA_INTEGRATION.md).

## Run

```bash
cd server
npm install
cp .env.example .env      # MOCK mode by default (MPESA_ENV=mock)
npm start                 # → http://127.0.0.1:8790
```

## Try the full flow (MOCK — no phone needed)

```bash
# 1. health
curl -s localhost:8790/health

# 2. start a payment (server looks up the price; client never sends an amount)
CID=$(curl -s -X POST localhost:8790/pay/stk \
  -H 'Content-Type: application/json' \
  -d '{"item":"course_stress","phone":"0708374149","owner":"device-123"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['checkoutId'])")
echo "checkoutId=$CID"

# 3. still pending
curl -s localhost:8790/pay/status/$CID

# 4. simulate Safaricom's success callback (DEV_ROUTES only)
curl -s -X POST "localhost:8790/dev/simulate-callback/$CID?result=success"

# 5. now paid + entitlement granted
curl -s localhost:8790/pay/status/$CID
curl -s localhost:8790/entitlements/device-123
```

Use `?result=fail` in step 4 to test the cancelled/failed path.

## Switch to the real Daraja sandbox

1. Create a sandbox app at <https://developer.safaricom.co.ke>, copy the **Consumer Key/Secret** and
   the **Lipa na M-Pesa Online passkey**.
2. In `.env`: set `MPESA_ENV=sandbox`, paste the creds, keep `MPESA_SHORTCODE=174379`.
3. Safaricom must be able to reach your callback. Run a tunnel and paste its URL:
   ```bash
   npx cloudflared tunnel --url http://localhost:8790   # or: ngrok http 8790
   ```
   Set `MPESA_CALLBACK_BASE` to the https tunnel URL and pick a random `MPESA_CALLBACK_SECRET`.
4. Restart, then `POST /pay/stk` with a **sandbox test number** (`254708374149`). Approve the STK
   prompt in the Daraja simulator; the real callback marks it `paid`.

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | mode + mock flag |
| GET | `/catalog` | public price list |
| POST | `/pay/stk` | `{ item, phone, owner? }` → `{ checkoutId }` |
| GET | `/pay/status/:id` | `pending` \| `paid` \| `failed` \| `amount_mismatch` (+ entitlement) |
| GET | `/entitlements/:owner` | entitlements for a device/user |
| POST | `/mpesa/callback/:secret` | Safaricom → us (source of truth) |
| POST | `/dev/simulate-callback/:id` | dev only; `?result=success\|fail` |

## Anonymous workplace reporting

This service also hosts the **anonymous intake** endpoints (`/report`, `/admin/reports`) used by the
app's "Report anonymously" feature — privacy-hardened (no identity, no IP logging, coarse timestamps,
access-key ownership). See **[REPORTS.md](REPORTS.md)** for the design, endpoints, and curl examples.

## What's intentionally NOT here yet (later phases)

- B2C counsellor payouts, Ratiba recurring, reversals/refunds (Phases 4–6).
- Real DB (swap `src/store.js`), user accounts, Safaricom IP allow-listing, rate limiting.
- Wiring into the PWA checkout — a ready client helper is at [`../js/pay.js`](../js/pay.js); it is
  **not** imported by the app yet so the PWA keeps working offline.
