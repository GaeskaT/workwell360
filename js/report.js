/* WorkWell 360 — anonymous reporting client helper (integration point).
   NOT imported by the app yet, so the PWA keeps working offline and reports
   currently stay on-device. When the intake backend (../server) is deployed,
   wire submitReport() into #/workplace/report so reports are actually delivered
   — anonymously. Nothing identifying is ever sent. */

import { store } from './store.js';

// Point this at your deployed intake backend.
export const REPORT_API = 'http://127.0.0.1:8790';

/** Submit anonymously. Returns { ref, accessKey } — save BOTH locally so the
 *  reporter can follow up. The server keeps only a hash of the access key. */
export async function submitReport({ category, detail, area, when, severity, others }) {
  const r = await fetch(`${REPORT_API}/report`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    // deliberately only the concern — no name/email/phone/device id
    body: JSON.stringify({ category, detail, area, when, severity, others }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  // mirror ref + accessKey on-device so the user can check back
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
  const r = await fetch(`${REPORT_API}/report/${encodeURIComponent(ref)}`, { headers: { 'x-report-key': accessKey } });
  if (!r.ok) throw new Error('Not found or wrong access key');
  return r.json();
}

/** Add follow-up info to an existing report, still anonymously. */
export async function addReportMessage(ref, accessKey, text) {
  const r = await fetch(`${REPORT_API}/report/${encodeURIComponent(ref)}/message`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-report-key': accessKey },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error('Not found or wrong access key');
  return r.json();
}
