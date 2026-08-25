/* ===========================================================
   views/counselling.js — Workplace Counselling Centre 💼
   =========================================================== */
import { store, now, uid, fmtDateTime } from '../store.js';
import { html, esc, toast, go, appbar, sectionH, rows, kes, crisisNote } from '../ui.js';
import { PROVIDERS, COUNSELLING_CATEGORIES, PROVIDER_TYPES, TOOLKITS } from '../data.js';

function hub({ cat }) {
  const active = cat || 'All';
  const filtered = active === 'All' ? PROVIDERS : PROVIDERS.filter(p => p.specialties.includes(active) || p.type === active);
  const bookings = store.get().bookings.filter(b => b.status !== 'cancelled');
  return {
    html: html`
      ${appbar('Workplace Counselling', 'Tools & verified professionals')}
      <div class="hero" style="background:linear-gradient(140deg,#1e3a8a,#0d9488)">
        <h1 style="font-size:1.25rem">💼 Support at work</h1>
        <p>Self-help tools for the pressures of work — plus verified professionals whenever you need to talk.</p>
      </div>
      <a class="card" href="#/workplace/report" style="display:flex;align-items:center;gap:12px;border-color:var(--brand)">
        <span style="font-size:1.6rem">🕵️</span>
        <span style="flex:1"><span style="font-weight:700;display:block">Report a concern anonymously</span>
          <span class="muted" style="font-size:.82rem">Confidential. No name attached. Protected from retaliation.</span></span>
        <span class="go" style="font-size:1.2rem;color:var(--brand)">›</span>
      </a>
      ${bookings.length ? html`<div class="card"><h3>Your sessions</h3>
        ${bookings.slice(0, 3).map(b => `<div class="row"><span class="ico">🗓️</span><span class="rt"><span class="rtl">${esc(b.provider)} · ${esc(b.mode)}</span><span class="rd">${esc(b.category)} · ${esc(b.when)}</span></span><span class="chip on">${esc(b.status)}</span></div>`).join('')}
      </div>` : ''}

      ${(() => { const wa = store.get().assessments.workplace; return wa
          ? `<div class="callout ${wa.score >= 61 ? 'warn' : 'info'}" style="margin-bottom:12px">Workplace wellbeing check: <strong>${wa.score}% · ${esc(wa.band)}</strong>. <a href="#/assess/workplace" style="text-decoration:underline;font-weight:700">Retake</a></div>`
          : `<a class="btn primary" href="#/assess/workplace" style="margin-bottom:14px">Take the workplace wellbeing check</a>`; })()}
      ${sectionH('Workplace self-help tools')}
      ${rows(TOOLKITS.workplace)}

      ${sectionH('Verified providers')}
      <label class="field" style="margin-bottom:12px"><span>Filter by need</span>
        <select id="catfilter">
          <option value="All" ${active === 'All' ? 'selected' : ''}>All specialities</option>
          ${COUNSELLING_CATEGORIES.map(c => `<option value="${esc(c)}" ${active === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
        </select>
      </label>
      ${filtered.length ? filtered.map(providerCard).join('') : `<div class="empty"><div class="e">🔍</div><p>No providers for "${esc(active)}" yet.</p><a class="btn" href="#/counselling">See all</a></div>`}
      ${crisisNote()}
      <div class="fab-space"></div>`,
    onMount(root) {
      const sel = root.querySelector('#catfilter');
      sel && sel.addEventListener('change', () => {
        const v = sel.value;
        go(v === 'All' ? '#/counselling' : `#/counselling?cat=${encodeURIComponent(v)}`);
      });
    },
  };
}

function providerCard(p) {
  return html`
    <a class="card" href="#/provider/${p.id}" style="display:block">
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div style="width:46px;height:46px;border-radius:50%;background:var(--teal-100);display:grid;place-items:center;font-weight:800;color:var(--teal-900);flex:0 0 auto">${esc(p.name.split(' ').map(n => n[0]).join('').slice(0, 2))}</div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong>${esc(p.name)}</strong>${p.verified ? '<span class="chip on" style="font-size:.68rem">✔ Verified</span>' : ''}
          </div>
          <div class="muted" style="font-size:.82rem">${esc(p.type)} · ⭐ ${p.rating} · ${esc(p.langs.join(', '))}</div>
          <div class="tag-row" style="margin-top:6px">${p.specialties.slice(0, 3).map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
          <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
            <span class="price">${p.rate === 0 ? 'Free' : kes(p.rate) + ' / session'}</span>
            <span class="muted" style="font-size:.8rem">${p.modes.join(' · ')}</span>
          </div>
        </div>
      </div>
    </a>`;
}

function provider({ id }) {
  const p = PROVIDERS.find(x => x.id === id);
  if (!p) return { html: `<div class="empty">Provider not found</div>` };
  return {
    html: html`
      ${appbar(p.name, p.type)}
      <div class="card">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
          <div style="width:60px;height:60px;border-radius:50%;background:var(--teal-100);display:grid;place-items:center;font-weight:800;font-size:1.3rem;color:var(--teal-900)">${esc(p.name.split(' ').map(n => n[0]).join('').slice(0, 2))}</div>
          <div><div style="font-weight:800;font-size:1.1rem">${esc(p.name)} ${p.verified ? '✔' : ''}</div>
          <div class="muted">${esc(p.type)} · ⭐ ${p.rating}</div></div>
        </div>
        <p>${esc(p.bio)}</p>
        <div class="tag-row">${p.specialties.map(s => `<span class="chip on">${esc(s)}</span>`).join('')}</div>
        <div class="divider"></div>
        <div class="kpi">
          <div class="k"><div class="n" style="font-size:1.1rem">${p.rate === 0 ? 'Free' : kes(p.rate)}</div><div class="l">Per session</div></div>
          <div class="k"><div class="n" style="font-size:1.1rem">${esc(p.modes.join(', '))}</div><div class="l">Session modes</div></div>
          <div class="k"><div class="n" style="font-size:1.1rem">${esc(p.langs.join(', '))}</div><div class="l">Languages</div></div>
        </div>
      </div>
      <button class="btn primary" id="book">Request a session</button>
      <div class="fab-space"></div>`,
    onMount(root) { root.querySelector('#book').addEventListener('click', () => go(`#/book/${p.id}`)); },
  };
}

function book({ id }) {
  const p = PROVIDERS.find(x => x.id === id);
  if (!p) return { html: `<div class="empty">Provider not found</div>` };
  return {
    html: html`
      ${appbar('Request a session', 'with ' + p.name)}
      <div class="card">
        <label class="field"><span>What's it about?</span><select id="cat">${p.specialties.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
        <label class="field"><span>How would you like to meet?</span><select id="mode">${p.modes.map(m => `<option>${esc(m)}</option>`).join('')}</select></label>
        <label class="field"><span>Preferred day & time</span><input id="when" placeholder="e.g. Thu afternoon"/></label>
        <label class="field"><span>Anything you'd like them to know? (optional, private)</span><textarea id="note" placeholder="Shared only with your counsellor"></textarea></label>
        <div class="callout info">🔒 Your request and notes are shared only with this counsellor — never with your employer.</div>
        <button class="btn primary" id="confirm" style="margin-top:12px">${p.rate === 0 ? 'Request session (free)' : 'Request — ' + kes(p.rate)}</button>
      </div>`,
    onMount(root) {
      root.querySelector('#confirm').addEventListener('click', () => {
        const when = root.querySelector('#when').value.trim() || 'To be confirmed';
        store.push('bookings', { ts: now(), provider: p.name, providerId: p.id, category: root.querySelector('#cat').value, mode: root.querySelector('#mode').value, when, status: 'requested' });
        toast('Session requested ✔');
        go('#/counselling');
      });
    },
  };
}

/* ---------- Anonymous workplace reporting ---------- */
const REPORT_CATEGORIES = [
  'Harassment or bullying', 'Sexual harassment', 'Discrimination', 'Unfair treatment',
  'Safety hazard', 'Wage or working-hours issue', 'Fraud or corruption',
  'Substance misuse at work', 'Abuse of power', 'Other concern',
];
const REPORT_SEVERITY = ['Low', 'Medium', 'High', 'Someone is at risk'];

function makeRef() {
  const part = () => uid().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, 'X');
  return `WW-${part()}-${part()}`;
}

function reportAnon() {
  return {
    html: html`
      ${appbar('Report anonymously', 'Confidential · protected from retaliation')}
      <div class="callout info" style="margin-bottom:12px">
        🔒 <strong>This report is anonymous.</strong> Your name, phone, email and device are <strong>not</strong> attached.
        Reports reach the organisation only as <strong>anonymised</strong> concerns — they cannot be traced back to you.
        Retaliating against anyone who reports a concern in good faith is prohibited.
      </div>

      <div class="card" id="form-card">
        <label class="field"><span>What is this about?</span>
          <select id="r-cat">${REPORT_CATEGORIES.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>

        <label class="field"><span>What happened? *</span>
          <textarea id="r-detail" placeholder="Describe what happened — facts, not names of individuals unless essential."></textarea></label>

        <label class="field"><span>Area / department (optional)</span>
          <input id="r-area" placeholder="e.g. Operations — night shift"/>
          <span style="font-weight:400;color:var(--muted);font-size:.75rem;display:block;margin-top:4px">Only add detail that won't identify you.</span></label>

        <label class="field"><span>When did it happen? (optional)</span>
          <input id="r-when" placeholder="e.g. last week, ongoing"/></label>

        <label class="field"><span>How urgent is it?</span>
          <select id="r-sev">${REPORT_SEVERITY.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>

        <label class="field"><span>Anyone else affected? (optional)</span>
          <input id="r-others" placeholder="e.g. several colleagues, don't know"/></label>

        <label class="row" style="cursor:pointer;padding:10px 2px">
          <input type="checkbox" id="r-consent" style="width:22px;height:22px"/>
          <span class="rt"><span class="rd" style="color:var(--text)">I understand this is submitted anonymously, and I'm reporting in good faith.</span></span>
        </label>

        <div class="callout warn" style="margin:6px 0 12px">If you or someone else is in immediate danger, use <a href="#/crisis" style="text-decoration:underline;font-weight:700">Get urgent help</a> or contact emergency services — don't wait for a report.</div>

        <button class="btn primary" id="r-submit">Submit anonymously</button>
      </div>

      <div id="r-done"></div>

      ${sectionH('Your reports')}
      <div id="r-list">${renderReports(store.get().reports)}</div>
      <p class="muted center" style="font-size:.76rem">Reports are stored privately on your device with a reference code. When your organisation connects a confidential reporting channel (EAP / ombudsperson), reports are delivered anonymised — never with your identity.</p>
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelector('#r-submit').addEventListener('click', () => {
        const detail = root.querySelector('#r-detail').value.trim();
        if (!detail) return toast('Please describe what happened');
        if (!root.querySelector('#r-consent').checked) return toast('Please tick the confirmation');
        const ref = makeRef();
        const report = {
          ts: now(), ref,
          category: root.querySelector('#r-cat').value,
          detail,
          area: root.querySelector('#r-area').value.trim(),
          when: root.querySelector('#r-when').value.trim(),
          severity: root.querySelector('#r-sev').value,
          others: root.querySelector('#r-others').value.trim(),
          status: 'Submitted',
        };
        store.push('reports', report);
        root.querySelector('#form-card').classList.add('hidden');
        root.querySelector('#r-done').innerHTML = html`
          <div class="card" style="border-color:var(--brand)">
            <h3>✅ Report submitted anonymously</h3>
            <p class="muted">Keep this reference to check back — you never have to give your name.</p>
            <div class="callout info" style="font-size:1.05rem;text-align:center;font-weight:800;letter-spacing:.04em">${ref}</div>
            <ul class="bul" style="margin-top:10px">
              <li>No identifying information was attached to your report.</li>
              <li>You are protected from retaliation for reporting in good faith.</li>
              <li>Follow up any time using your reference code — anonymously.</li>
            </ul>
            <div class="btnrow">
              <button class="btn" id="r-copy">Copy report</button>
              <button class="btn" id="r-another">File another</button>
            </div>
          </div>`;
        root.querySelector('#r-list').innerHTML = renderReports(store.get().reports);
        root.querySelector('#r-copy').addEventListener('click', async () => {
          const txt = `WorkWell 360 anonymous report\nRef: ${ref}\nCategory: ${report.category}\nUrgency: ${report.severity}\nArea: ${report.area || 'n/a'}\nWhen: ${report.when || 'n/a'}\nOthers affected: ${report.others || 'n/a'}\n\n${report.detail}`;
          try { await navigator.clipboard.writeText(txt); toast('Report copied'); } catch { toast('Copy not available'); }
        });
        root.querySelector('#r-another').addEventListener('click', () => go('#/workplace/report'));
        window.scrollTo(0, 0);
        toast('Submitted anonymously ✔');
      });
    },
  };
}

function renderReports(reports) {
  if (!reports.length) return `<div class="empty"><div class="e">🗂️</div><p>No reports yet</p></div>`;
  const sevClass = s => s === 'Someone is at risk' ? 'r' : s === 'High' ? 'o' : s === 'Medium' ? 'y' : 'g';
  return reports.map(r => html`
    <div class="card tight">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${esc(r.category)}</strong><span class="stat-pill ${sevClass(r.severity)}">${esc(r.severity)}</span>
      </div>
      <div class="muted" style="font-size:.8rem;margin:2px 0">${esc(r.ref)} · ${fmtDateTime(r.ts)} · ${esc(r.status)}</div>
      <p style="margin:6px 0 0">${esc(r.detail)}</p>
    </div>`).join('');
}

export const counsellingRoutes = {
  '/counselling': hub,
  '/provider/:id': provider,
  '/book/:id': book,
  '/workplace/report': reportAnon,
};
