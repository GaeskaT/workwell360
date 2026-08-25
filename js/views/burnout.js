/* ===========================================================
   views/burnout.js — Burnout Prevention & Recovery 🔥
   =========================================================== */
import { store, now, fmtDate, fmtDateTime } from '../store.js';
import { html, esc, toast, appbar, sectionH, rows, scoreBar, crisisNote } from '../ui.js';
import { TOOLKITS } from '../data.js';

function hub() {
  const a = store.get().assessments.burnout;
  const energy = store.get().energy.slice(0, 7);
  const avgE = energy.length ? Math.round(energy.reduce((x, e) => x + e.energy, 0) / energy.length * 10) : null;
  return {
    html: html`
      ${appbar('Burnout Recovery', 'Recognise it. Recover from it.')}
      <div class="hero" style="background:linear-gradient(140deg,#7c2d12,#f59e0b)">
        <h1 style="font-size:1.25rem">🔥 From empty to restored</h1>
        <p>Burnout builds in stages. Catch it early, and recovery is faster and fuller.</p>
      </div>
      <div class="card"><h3>The burnout pattern</h3>
        <div style="display:flex;justify-content:space-between;text-align:center;font-weight:700;font-size:.8rem">
          <div>😫<div>Exhaustion</div></div><div style="align-self:center">›</div>
          <div>🧊<div>Detachment</div></div><div style="align-self:center">›</div>
          <div>📉<div>Reduced<br>effectiveness</div></div><div style="align-self:center">›</div>
          <div>🌱<div>Recovery</div></div>
        </div>
      </div>
      ${avgE !== null ? `<div class="card">${scoreBar('7-day energy', avgE, avgE >= 60 ? 'var(--green-500)' : avgE >= 35 ? 'var(--amber-500)' : 'var(--rose-500)')}</div>` : ''}
      ${a ? `<div class="callout ${a.score >= 55 ? 'warn' : 'info'}" style="margin-bottom:12px">Burnout self-check: <strong>${a.score}% · ${esc(a.band)}</strong>. <a href="#/assess/burnout" style="text-decoration:underline;font-weight:700">Retake</a></div>`
          : `<a class="btn primary" href="#/assess/burnout" style="margin-bottom:14px">Take the burnout self-check</a>`}
      ${sectionH('Your burnout toolkit')}
      ${rows(TOOLKITS.burnout)}
      ${crisisNote()}
      <div class="fab-space"></div>`,
  };
}

/* ---- Energy / sleep / workload tracker ---- */
function energy() {
  return {
    html: html`
      ${appbar('Energy tracker', 'Energy · Sleep · Workload')}
      <div class="card">
        <label class="field"><span>Energy today</span><div class="range-wrap"><input type="range" id="e" min="0" max="10" value="5"/><output id="eo">5</output></div></label>
        <label class="field"><span>Hours slept last night</span><div class="range-wrap"><input type="range" id="s" min="0" max="12" value="7"/><output id="so">7</output></div></label>
        <label class="field"><span>Workload pressure</span><div class="range-wrap"><input type="range" id="w" min="0" max="10" value="5"/><output id="wo">5</output></div></label>
        <button class="btn primary" id="save">Log today</button>
      </div>
      <div id="list">${listEnergy(store.get().energy)}</div>
      <div class="fab-space"></div>`,
    onMount(root) {
      [['e', 'eo'], ['s', 'so'], ['w', 'wo']].forEach(([i, o]) => root.querySelector('#' + i).addEventListener('input', ev => root.querySelector('#' + o).textContent = ev.target.value));
      root.querySelector('#save').addEventListener('click', () => {
        store.push('energy', { ts: now(), energy: +root.querySelector('#e').value, sleep: +root.querySelector('#s').value, workload: +root.querySelector('#w').value });
        toast('Logged'); root.querySelector('#list').innerHTML = listEnergy(store.get().energy);
      });
    },
  };
}
function listEnergy(entries) {
  if (!entries.length) return `<div class="empty"><div class="e">🔋</div><p>Track a few days to see your trend</p></div>`;
  const max = 10;
  return html`<div class="card"><h3>Recent trend</h3>
    <div style="display:flex;align-items:flex-end;gap:6px;height:110px;margin-top:6px">
      ${entries.slice(0, 10).reverse().map(e => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;justify-content:flex-end;height:100%">
        <div style="width:100%;background:var(--brand);border-radius:5px 5px 0 0;height:${(e.energy / max) * 100}%;min-height:4px" title="Energy ${e.energy}/10"></div>
        <small style="font-size:.6rem">${fmtDate(e.ts).split(' ')[1] || ''}</small></div>`).join('')}
    </div><small class="muted">Bars show energy. Watch for a downward slope with poor sleep + high workload.</small></div>
    ${entries.slice(0, 8).map(e => `<div class="card tight"><div style="display:flex;justify-content:space-between"><small>${fmtDateTime(e.ts)}</small>
      <span>🔋${e.energy} · 😴${e.sleep}h · 📋${e.workload}</span></div></div>`).join('')}`;
}

/* ---- Rest & leave planner ---- */
function rest() {
  const p = store.get().toolkit.restPlan || {};
  return {
    html: html`
      ${appbar('Rest & leave planner', 'Plan real recovery')}
      <div class="card"><p class="muted">Recovery doesn't happen by accident. Put it in the calendar like any other commitment.</p>
        <label class="field"><span>My next full day off</span><input type="date" id="dayoff" value="${p.dayoff || ''}"/></label>
        <label class="field"><span>Next block of leave I'll take</span><input id="leave" value="${esc(p.leave || '')}" placeholder="e.g. 5 days in December"/></label>
        <label class="field"><span>One restful thing I'll protect weekly</span><input id="weekly" value="${esc(p.weekly || '')}" placeholder="e.g. Sunday walk, no phone"/></label>
        <label class="field"><span>What refills me (my recovery menu)</span><textarea id="menu" placeholder="Sleep, nature, friends, worship, music, cooking…">${esc(p.menu || '')}</textarea></label>
        <button class="btn primary" id="save">Save my plan</button>
      </div>`,
    onMount(root) {
      root.querySelector('#save').addEventListener('click', () => {
        store.update(s => { s.toolkit.restPlan = { dayoff: root.querySelector('#dayoff').value, leave: root.querySelector('#leave').value.trim(), weekly: root.querySelector('#weekly').value.trim(), menu: root.querySelector('#menu').value.trim() }; });
        toast('Plan saved');
      });
    },
  };
}

/* ---- Recovery plan ---- */
function recovery() {
  const steps = [
    ['Stabilise', 'Protect sleep, cut non-essentials, tell one trusted person.'],
    ['Reduce load', 'Renegotiate workload; pause what can wait; delegate or drop.'],
    ['Restore energy', 'Daily movement, daylight, real breaks, boundaries after hours.'],
    ['Reconnect', 'Rebuild meaning: relationships, small wins, values.'],
    ['Rebuild sustainably', 'Return at a pace you can hold. Keep the boundaries that helped.'],
  ];
  const done = new Set(store.get().toolkit.recoveryPlan || []);
  return {
    html: html`
      ${appbar('Recovery plan', 'Your step-by-step comeback')}
      <div class="callout info" style="margin-bottom:12px">Recovery is not linear. Tick a step when you've started it — progress, not perfection.</div>
      <div class="card"><div class="journey">
        ${steps.map(([t, d], i) => `<div class="jstep ${done.has(i) ? 'done' : ''}" data-i="${i}" style="cursor:pointer">
          <div class="jw">Step ${i + 1}</div><div class="jt">${esc(t)} ${done.has(i) ? '✅' : ''}</div><div class="jd">${esc(d)}</div></div>`).join('')}
      </div></div>
      <a class="btn primary" href="#/counselling?cat=Burnout">Talk to a burnout counsellor ›</a>`,
    onMount(root) {
      root.querySelectorAll('.jstep').forEach(el => el.addEventListener('click', () => {
        const i = +el.dataset.i; done.has(i) ? done.delete(i) : done.add(i);
        store.update(s => { s.toolkit.recoveryPlan = [...done]; });
        el.classList.toggle('done'); el.querySelector('.jt').innerHTML = el.querySelector('.jt').textContent.replace(' ✅', '') + (done.has(i) ? ' ✅' : '');
      }));
    },
  };
}

/* ---- Return to work ---- */
function rtw() {
  return {
    html: html`
      ${appbar('Return-to-work support', 'Ease back sustainably')}
      <div class="card"><h3>A phased return</h3>
        <ul class="bul">
          <li><strong>Week 1–2:</strong> Reduced hours or lighter duties. No catching up on everything at once.</li>
          <li><strong>Week 3–4:</strong> Gradually add responsibilities; keep one protected recovery block daily.</li>
          <li><strong>Ongoing:</strong> Regular check-ins with your manager and, where available, your EAP or counsellor.</li>
        </ul>
      </div>
      <div class="card"><h3>Talk to HR / your manager</h3>
        <div class="callout info">"I'm returning and committed to doing this well. A phased start over the next few weeks will help me come back sustainably. Can we agree priorities and a light first week?"</div>
      </div>
      <a class="btn" href="#/burnout/rest">Plan your recovery time ›</a>`,
  };
}

export const burnoutRoutes = {
  '/burnout': hub,
  '/burnout/energy': energy,
  '/burnout/rest': rest,
  '/burnout/recovery': recovery,
  '/burnout/rtw': rtw,
};
