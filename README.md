# WorkWell 360

**Healthy People. Healthy Workplaces. Healthy Futures.**

A complete **workplace mental-wellness and retirement-transition ecosystem** — not just a
counselling-booking app. Built as an installable, offline-capable **PWA**, ready to wrap for the
Google Play Store.

Powered by Counsellor Priscilla Maina.

![icon](icons/icon-512.png)

---

## The 8 pillars
| | Pillar | What it does |
|---|--------|--------------|
| 🧠 | Mental Health | Everyday emotional wellbeing + counselling |
| 😡 | Anger Management | Self-assessment, diary, triggers, STOP–PAUSE–REFLECT–RESPOND, assertive-communication builder |
| 😰 | Stress Management | Stress dashboard, breathing, time/priority tool, boundaries, workload script, self-care checklist |
| 🔥 | Burnout Recovery | Self-check, energy/sleep tracker, rest planner, recovery plan, return-to-work |
| 💼 | Workplace Counselling | Verified provider directory (16 categories) + in-app session requests |
| 🔄 | Retirement Transition | Readiness score (6 dimensions), 7-stage journey, 4 transition pillars |
| 👨‍👩‍👧 | Family & Relationships | Couples, family, parenting, caregiving, grief |
| 📊 | Employer & Analytics | Aggregated, **anonymised** HR wellness dashboard |

Plus: **"What do you need today?"** router, **Self-care store** (journals + courses), breathing &
grounding tools, corporate packages, and a crisis-support screen.

## Privacy by design
All personal data (check-ins, journals, assessments) lives **on-device** in `localStorage`.
Employers see only aggregated, anonymised trends — never individual entries or counselling. Users
can export or erase everything from Settings.

## Run locally
```bash
python -m http.server 8787
# open http://127.0.0.1:8787/index.html
```
It's a static site — any static server works. Requires HTTPS (or localhost) for the service worker.

## Project structure
```
index.html            App shell + bottom nav
manifest.webmanifest  PWA manifest (icons, shortcuts, screenshots)
sw.js                 Offline-first service worker
privacy.html          Privacy policy (required for Play listing)
css/app.css           Design system (light/dark, mobile-first)
js/
  app.js              Router + bootstrap
  store.js            Local-first persistence
  ui.js               Shared components/helpers
  data.js             All content (pillars, providers, courses, packages…)
  views/*.js          One module per area
icons/                App icons (SVG master + PNG 192/512 + maskable)
.well-known/          assetlinks.json for TWA verification
playstore/            Bubblewrap manifest + publishing guide + listing copy
screenshots/          Store screenshots
```

## Publish to Google Play
See **[playstore/PLAYSTORE.md](playstore/PLAYSTORE.md)** — host on HTTPS (GitHub Pages works),
wrap with Bubblewrap (TWA), link via Digital Asset Links, upload the `.aab`.

## Tech
Vanilla JS (ES modules), no build step, no dependencies. Themable, accessible, responsive.

## Roadmap (backend-ready hooks)
- Accounts + cloud sync (currently local-only)
- M-Pesa / card payments for store & counselling commission
- Real provider onboarding & verification
- Live employer aggregation pipeline (consent-gated)
- Push reminders (via Capacitor wrapper)
