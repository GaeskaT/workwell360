# WorkWell 360 — Anonymous intake backend

A privacy-hardened endpoint for confidential, **anonymous** workplace reports, mounted in the same
`server/` service as payments. It is engineered so a report **cannot be traced back to the reporter**,
so people can raise concerns without fear of victimization.

## Privacy guarantees (by construction)

- **No identity is ever collected.** The API accepts only the concern (category, description, optional
  area/when/others, urgency). There is no name/email/phone/account field.
- **IP addresses are never logged or stored.** `trust proxy` is off; the client IP is used only
  transiently — hashed with a **rotating in-memory salt** — for rate-limiting, then discarded. Nothing
  in `data/reports.json` or the logs contains an IP, user-agent, or request metadata.
- **Timestamps are coarsened to the calendar day** (`createdDate`, no time), to reduce the chance of
  correlating a report with a login or other event.
- **Ownership without an account.** On submit, the server issues a one-time **access key**; only its
  salted **scrypt** hash is stored. The reporter uses `ref` + access key to check back or add
  info — anonymously. Keys are unrecoverable by design.
- **Even handlers see no reporter identity** — because none exists.

## Endpoints

Reporter (public, rate-limited):
| Method | Path | Body / headers | Returns |
|--------|------|----------------|---------|
| POST | `/report` | `{category, detail, area?, when?, severity?, others?}` | `{ ref, accessKey, notice }` |
| GET | `/report/:ref` | header `x-report-key: <accessKey>` | status + updates + thread |
| POST | `/report/:ref/message` | header `x-report-key`, `{text}` | updated thread |

Handler / ombudsperson (requires `x-admin-token`):
| Method | Path | Does |
|--------|------|------|
| GET | `/admin/reports?status=` | list/triage (newest first) |
| GET | `/admin/reports/:ref` | one report |
| POST | `/admin/reports/:ref/status` | `{status?, note?}` — update status; a note becomes a reply visible to the reporter |

## Run & test

```bash
cd server
cp .env.example .env            # set REPORT_ADMIN_TOKEN to a long random string
npm install
npm start                       # http://127.0.0.1:8790
```

```bash
B=http://127.0.0.1:8790
# submit anonymously
OUT=$(curl -s -X POST $B/report -H 'Content-Type: application/json' \
  -d '{"category":"Harassment or bullying","detail":"Repeated shouting from a supervisor.","area":"Operations","severity":"High"}')
echo "$OUT"                     # -> {"ref":"WW-XXXX-XXXX","accessKey":"XXXX-XXXX-XXXX", ...}
REF=$(echo "$OUT"  | python -c "import sys,json;print(json.load(sys.stdin)['ref'])")
KEY=$(echo "$OUT"  | python -c "import sys,json;print(json.load(sys.stdin)['accessKey'])")

# reporter checks status (needs the key)
curl -s $B/report/$REF -H "x-report-key: $KEY"
curl -s $B/report/$REF -H "x-report-key: WRONG"        # -> 404

# handler triages (needs admin token from your .env)
T=your-admin-token
curl -s $B/admin/reports -H "x-admin-token: $T"
curl -s -X POST $B/admin/reports/$REF/status -H "x-admin-token: $T" \
  -H 'Content-Type: application/json' -d '{"status":"Under review","note":"Thank you — we are looking into this."}'

# reporter sees the handler's reply, anonymously
curl -s $B/report/$REF -H "x-report-key: $KEY"
```

## Wiring the app

The client helper is [`../js/report.js`](../js/report.js) (`submitReport`, `checkReport`,
`addReportMessage`). It is **not** imported yet, so the PWA keeps working offline and reports stay
on-device. To go live, set `REPORT_API` to your deployed backend and call `submitReport()` from
`#/workplace/report` instead of the local-only save; store the returned `ref` + `accessKey` on-device
so the reporter can follow up.

## Production hardening (do before real use)

- **Admin access:** put `/admin/*` behind real SSO / least-privilege auth restricted to the
  ombudsperson; the bearer token here is a placeholder. Consider a separate admin host.
- **Transport & storage:** HTTPS only; replace the JSON file with a database **encrypted at rest**;
  restrict DB access.
- **No correlation:** keep `trust proxy` off (or strip `X-Forwarded-For`); ensure your host/CDN access
  logs don't record IPs for `/report*`, or disable them for those paths.
- **Retention:** set `REPORT_RETENTION_DAYS` and honour local whistleblower/data-protection law.
- **Separation of duties:** run intake on infrastructure separate from identity/HR systems; the
  employer dashboard must only ever receive **aggregated** counts, never individual reports.
- **Abuse vs. anonymity:** the rate-limiter is memory-only and IP-hashed with a rotating salt — tune
  `windowMs`/`max` to your needs without ever persisting IPs.
- **Duty of care:** define an escalation path for "Someone is at risk" reports; the app already routes
  imminent-danger cases to urgent help rather than the queue.
