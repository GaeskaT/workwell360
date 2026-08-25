/* WorkWell 360 — anonymous reporting client helper.
   Wired into #/workplace/report. Uses the backend URL from Settings; when that
   is blank the caller falls back to on-device storage, so the PWA still works
   offline. Nothing identifying is ever sent. */

import { store, apiBase } from './store.js';

export const backendConfigured = () => !!apiBase();

/** Submit anonymously. Returns { ref, accessKey } and mirrors them on-device so
 *  the reporter can follow up. The server keeps only a hash of the access key. */
export async function submitReport({ category, detail, area, when, severity, others }) {
  const base = apiBase();
  if (!base) throw new Error('NO_BACKEND');
  const r = await fetch(`${base}/report`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    // deliberately only the concern — no name/email/phone/device id
    body: JSON.stringify({ category, detail, area, when, severity, others }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  store.update(s => {
    (s.reports = s.reports || []).unshift({
      ts: Date.now(), ref: j.ref, accessKey: j.accessKey,
      category, detail, area, when, severity, others, status: 'Submitted',
    });
  });
  return j; // { ref, accessKey, notice }
}

/** Check a report's status/thread anonymously (needs ref + access key). */
export async function checkReport(ref, accessKey) {
  const base = apiBase();
  if (!base) throw new Error('NO_BACKEND');
  const r = await fetch(`${base}/report/${encodeURIComponent(ref)}`, { headers: { 'x-report-key': accessKey } });
  if (!r.ok) throw new Error('Not found or wrong access key');
  return r.json();
}

/** Add follow-up info to an existing report, still anonymously. */
export async function addReportMessage(ref, accessKey, text) {
  const base = apiBase();
  if (!base) throw new Error('NO_BACKEND');
  const r = await fetch(`${base}/report/${encodeURIComponent(ref)}/message`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-report-key': accessKey },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error('Not found or wrong access key');
  return r.json();
}
