# Publishing WorkWell 360 to Google Play

WorkWell 360 is an installable **PWA**. The fastest, cheapest route to the Play Store is a
**Trusted Web Activity (TWA)** wrapper built with **Bubblewrap** — the app runs full-screen with
no browser chrome and is indistinguishable from a native app.

---

## 0. Prerequisites
- A **Google Play Developer account** (one-time US$25).
- The app must be hosted over **HTTPS** at a stable domain (see step 1).
- **Node.js** (already installed) and the **JDK 17** (Bubblewrap installs one if missing).

---

## 1. Host the PWA over HTTPS
Any static HTTPS host works. Easiest free option — **GitHub Pages**:

1. Push this folder to a GitHub repo (already set up: `GaeskaT/workwell360`).
2. Repo → **Settings → Pages → Deploy from branch → `main` / root**.
3. Your app is live at `https://gaeskat.github.io/workwell360/`.

> If you use a custom domain (e.g. `app.workwell360.com`) point DNS at the host and set it as the
> Pages custom domain. Update the `host` field in `playstore/twa-manifest.json` and the URL in
> `.well-known/assetlinks.json` accordingly.

Verify the PWA passes install criteria: open the site in Chrome → DevTools → **Lighthouse → PWA**.

---

## 2. Generate the Android app with Bubblewrap
```bash
npm install -g @bubblewrap/cli
cd playstore
# Edit twa-manifest.json first: set "host" and the icon URLs to your real HTTPS domain.
bubblewrap init --manifest="https://YOUR_DOMAIN/manifest.webmanifest"
# (or)  bubblewrap init --manifest=./twa-manifest.json
bubblewrap build
```
`bubblewrap build` produces:
- `app-release-signed.aab`  ← upload this to Play Console
- `android.keystore`        ← **BACK THIS UP.** You need it for every future update.
- It also prints your **SHA-256 signing fingerprint**.

---

## 3. Link the app to your website (Digital Asset Links)
1. Copy the SHA-256 fingerprint Bubblewrap printed.
2. Paste it into `.well-known/assetlinks.json` (replace the placeholder), commit & redeploy.
3. Confirm it is reachable at `https://YOUR_DOMAIN/.well-known/assetlinks.json`.

This is what removes the browser address bar from the installed app.

---

## 4. Create the Play Console listing
Upload the `.aab`, then fill in the store listing. Assets are pre-generated in this folder:

| Asset | Size | File |
|-------|------|------|
| App icon | 512×512 | `../icons/icon-512.png` |
| Feature graphic | 1024×500 | `feature-graphic.png` |
| Phone screenshots (min 2) | 1080×1920 | `../screenshots/*.png` |

**Suggested listing copy** is in `listing.md`.

Complete the required **Data safety**, **Content rating**, and **Health apps** declarations —
see `listing.md → Compliance notes` (this app stores wellbeing data **on-device only**, which
makes the data-safety form straightforward).

---

## 5. Alternative: Capacitor (if you later add native features)
If you need push notifications, native payments (M-Pesa SDK), or background reminders, wrap the
same web build with **Capacitor** instead of a TWA:
```bash
npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init "WorkWell 360" app.workwell360 --web-dir=.
npx cap add android && npx cap open android
```
Then build the signed `.aab` from Android Studio.

---

## Update checklist (every new version)
1. Bump `appVersionCode` (+1) and `appVersionName` in `twa-manifest.json`.
2. Bump the cache name in `sw.js` (e.g. `ww360-v2`) so users get the update.
3. `bubblewrap update && bubblewrap build` with the **same keystore**.
4. Upload the new `.aab` to Play Console → new release.
