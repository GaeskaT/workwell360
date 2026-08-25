/* ===========================================================
   views/counselling.js — Workplace Counselling Centre 💼
   =========================================================== */
import { store, now, fmtDateTime } from '../store.js';
import { html, esc, toast, go, appbar, sectionH, kes, crisisNote } from '../ui.js';
import { PROVIDERS, COUNSELLING_CATEGORIES, PROVIDER_TYPES } from '../data.js';

function hub({ cat }) {
  const active = cat || 'All';
  const filtered = active === 'All' ? PROVIDERS : PROVIDERS.filter(p => p.specialties.includes(active) || p.type === active);
  const bookings = store.get().bookings.filter(b => b.status !== 'cancelled');
  return {
    html: html`
      ${appbar('Workplace Counselling', 'Talk to a verified professional')}
      ${crisisNote()}
      ${bookings.length ? html`<div class="card"><h3>Your sessions</h3>
        ${bookings.slice(0, 3).map(b => `<div class="row"><span class="ico">🗓️</span><span class="rt"><span class="rtl">${esc(b.provider)} · ${esc(b.mode)}</span><span class="rd">${esc(b.category)} · ${esc(b.when)}</span></span><span class="chip on">${esc(b.status)}</span></div>`).join('')}
      </div>` : ''}

      ${sectionH('Browse by need')}
      <div class="chips" style="margin-bottom:8px">
        <a class="chip ${active === 'All' ? 'on' : ''}" href="#/counselling">All</a>
        ${COUNSELLING_CATEGORIES.map(c => `<a class="chip ${active === c ? 'on' : ''}" href="#/counselling?cat=${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}
      </div>

      ${sectionH(active === 'All' ? 'Verified providers' : active)}
      ${filtered.length ? filtered.map(providerCard).join('') : `<div class="empty"><div class="e">🔍</div><p>No providers for "${esc(active)}" yet.</p><a class="btn" href="#/counselling">See all</a></div>`}
      <div class="fab-space"></div>`,
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

export const counsellingRoutes = {
  '/counselling': hub,
  '/provider/:id': provider,
  '/book/:id': book,
};
