/* ===========================================================
   views/stress.js — Stress Management Centre 😰
   =========================================================== */
import { store, now, fmtDateTime } from '../store.js';
import { html, esc, toast, appbar, sectionH, rows, scoreBar, crisisNote } from '../ui.js';
import { TOOLKITS } from '../data.js';

const STRESS_DOMAINS = ['Workload', 'Deadlines', 'Financial pressure', 'Relationships', 'Health concerns', 'Management', 'Workplace conflict', 'Sleep', 'Work–life balance'];

function hub() {
  const a = store.get().assessments.stress;
  const recent = store.get().stressDiary.slice(0, 7);
  const avg = recent.length ? Math.round(recent.reduce((x, e) => x + e.level, 0) / recent.length * 10) : null;
  return {
    html: html`
      ${appbar('Stress Management', 'Track it, then lighten it')}
      <div class="hero" style="background:linear-gradient(140deg,#1e3a8a,#0d9488)">
        <h1 style="font-size:1.25rem">😰 Lighten the load</h1>
        <p>Stress is manageable once it's visible. Track what's pressing on you and get targeted tools.</p>
      </div>
      ${avg !== null ? `<div class="card">${scoreBar('7-day stress level', avg, avg >= 70 ? 'var(--rose-500)' : avg >= 40 ? 'var(--amber-500)' : 'var(--green-500)')}</div>` : ''}
      ${a ? `<div class="callout info" style="margin-bottom:12px">Stress check: <strong>${a.score}% · ${esc(a.band)}</strong>. <a href="#/assess/stress" style="text-decoration:underline;font-weight:700">Retake</a></div>`
          : `<a class="btn primary" href="#/assess/stress" style="margin-bottom:14px">Take the stress check</a>`}
      ${sectionH('Your stress toolkit')}
      ${rows(TOOLKITS.stress)}
      ${crisisNote()}
      <div class="fab-space"></div>`,
  };
}

/* ---- Stress dashboard / diary ---- */
function diary() {
  return {
    html: html`
      ${appbar('Stress dashboard', "Log today's pressure points")}
      <div class="card">
        <label class="field"><span>What's weighing on you today?</span>
          <div class="chips" id="domains">${STRESS_DOMAINS.map(d => `<button class="chip" data-d="${esc(d)}">${esc(d)}</button>`).join('')}</div></label>
        <label class="field"><span>Overall stress level</span>
          <div class="range-wrap"><input type="range" id="level" min="0" max="10" value="5"/><output id="lo">5</output></div></label>
        <label class="field"><span>Note (optional)</span><textarea id="note" placeholder="What happened?"></textarea></label>
        <button class="btn primary" id="save">Save today</button>
      </div>
      <div id="list">${listStress(store.get().stressDiary)}</div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const picked = new Set();
      root.querySelectorAll('#domains .chip').forEach(c => c.addEventListener('click', () => { c.classList.toggle('on'); picked.has(c.dataset.d) ? picked.delete(c.dataset.d) : picked.add(c.dataset.d); }));
      root.querySelector('#level').addEventListener('input', e => root.querySelector('#lo').textContent = e.target.value);
      root.querySelector('#save').addEventListener('click', () => {
        store.push('stressDiary', { ts: now(), domains: [...picked], level: +root.querySelector('#level').value, note: root.querySelector('#note').value.trim() });
        toast('Logged'); root.querySelector('#list').innerHTML = listStress(store.get().stressDiary);
        picked.clear(); root.querySelectorAll('#domains .chip').forEach(c => c.classList.remove('on'));
        root.querySelector('#note').value = ''; root.querySelector('#level').value = 5; root.querySelector('#lo').textContent = '5';
      });
    },
  };
}
function listStress(entries) {
  if (!entries.length) return `<div class="empty"><div class="e">📊</div><p>No logs yet</p></div>`;
  return entries.slice(0, 20).map(e => html`<div class="card tight">
    <div style="display:flex;justify-content:space-between;align-items:center"><small>${fmtDateTime(e.ts)}</small>
      <span class="stat-pill ${e.level >= 7 ? 'r' : e.level >= 4 ? 'o' : 'y'}">${e.level}/10</span></div>
    ${e.domains.length ? `<div class="tag-row" style="margin-top:6px">${e.domains.map(d => `<span class="chip">${esc(d)}</span>`).join('')}</div>` : ''}
    ${e.note ? `<p style="margin:6px 0 0">${esc(e.note)}</p>` : ''}</div>`).join('');
}

/* ---- Time / priority tool (Eisenhower) ---- */
function timeTool() {
  const q = store.get().toolkit.eisenhower || { do: [], schedule: [], delegate: [], drop: [] };
  const box = (key, title, hint) => html`<div class="card"><h3>${esc(title)}</h3><div class="muted" style="font-size:.78rem;margin-bottom:8px">${esc(hint)}</div>
    <div class="chips" id="list-${key}">${(q[key] || []).map(t => `<span class="chip on" data-key="${key}" data-t="${esc(t)}">${esc(t)} ✕</span>`).join('')}</div>
    <div style="display:flex;gap:8px;margin-top:8px"><input data-in="${key}" placeholder="Add a task"/><button class="btn sm" data-add="${key}">Add</button></div></div>`;
  return {
    html: html`
      ${appbar('Time & priority', 'Urgent vs important')}
      <div class="callout info" style="margin-bottom:12px">Sort your tasks so the important ones don't get buried by the merely urgent.</div>
      ${box('do', '🔴 Do now', 'Urgent & important')}
      ${box('schedule', '🟢 Schedule', 'Important, not urgent — protect this time')}
      ${box('delegate', '🟡 Delegate', 'Urgent, not important')}
      ${box('drop', '⚪ Drop', 'Neither — let it go')}`,
    onMount(root) {
      const save = () => store.update(s => { s.toolkit.eisenhower = q; });
      root.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => {
        const key = btn.dataset.add, inp = root.querySelector(`[data-in="${key}"]`), v = inp.value.trim();
        if (!v) return; q[key] = q[key] || []; q[key].push(v); save(); inp.value = '';
        root.querySelector(`#list-${key}`).insertAdjacentHTML('beforeend', `<span class="chip on" data-key="${key}" data-t="${esc(v)}">${esc(v)} ✕</span>`);
      }));
      root.addEventListener('click', e => { const chip = e.target.closest('.chip.on[data-key]'); if (!chip) return;
        const key = chip.dataset.key, t = chip.dataset.t; q[key] = (q[key] || []).filter(x => x !== t); save(); chip.remove(); });
    },
  };
}

/* ---- Boundaries ---- */
function boundaries() {
  const items = [
    ['No work email after 7pm', 'Protect your evenings for recovery'],
    ['One full lunch break, away from the desk', 'Real breaks restore focus'],
    ['One tech-free hour before bed', 'Better sleep = lower stress'],
    ['Say "let me check and get back to you"', 'Buy time instead of over-committing'],
    ['Turn off non-urgent notifications', 'Reduce constant task-switching'],
    ['One full day off work thoughts weekly', 'Your mind needs a real reset'],
  ];
  const set = new Set(store.get().toolkit.boundaries || []);
  return {
    html: html`
      ${appbar('Boundary-setting', 'Protect your off-hours')}
      <div class="card"><p class="muted">Boundaries aren't selfish — they're what keeps you sustainable. Commit to the ones that fit your life.</p></div>
      <div class="card"><div class="list" id="b">
        ${items.map(([t, d], i) => `<label class="row" style="cursor:pointer"><span class="ico">${set.has(i) ? '✅' : '⭕'}</span>
          <span class="rt"><span class="rtl">${esc(t)}</span><span class="rd">${esc(d)}</span></span>
          <input type="checkbox" data-i="${i}" ${set.has(i) ? 'checked' : ''} style="width:22px;height:22px"/></label>`).join('')}
      </div></div>`,
    onMount(root) {
      root.querySelectorAll('#b input').forEach(cb => cb.addEventListener('change', () => {
        const i = +cb.dataset.i; cb.checked ? set.add(i) : set.delete(i);
        store.update(s => { s.toolkit.boundaries = [...set]; });
        cb.closest('.row').querySelector('.ico').textContent = cb.checked ? '✅' : '⭕';
      }));
    },
  };
}

/* ---- Workload conversation guide ---- */
function workload() {
  return {
    html: html`
      ${appbar('Workload conversation', 'A script for your manager')}
      <div class="card"><h3>Before the conversation</h3>
        <ul class="bul"><li>List your current commitments and rough hours each takes.</li>
        <li>Identify what's essential vs what could move, pause or go.</li>
        <li>Decide the outcome you want (re-prioritise, more time, help, or fewer tasks).</li></ul></div>
      <div class="card"><h3>A script that works</h3>
        <div class="callout info">"I want to do good work on what matters most. Right now I'm holding <em>[X, Y, Z]</em>. To deliver <em>[priority]</em> well, I'd like your help to <em>[reprioritise / extend / share]</em> <em>[the rest]</em>. Which of these is the real priority this week?"</div>
        <p class="muted" style="margin-top:10px">This frames it around <strong>quality and priorities</strong>, not complaint — managers respond to that.</p>
      </div>
      <a class="btn primary" href="#/stress/boundaries">Set boundaries to back it up ›</a>`,
  };
}

/* ---- Self-care checklist ---- */
function selfcare() {
  const items = ['Drank enough water', 'Moved my body', 'Ate a proper meal', 'Took a real break', 'Connected with someone', 'Got outside / daylight', 'Slept 7+ hours', 'Did one thing I enjoy'];
  const key = new Date().toDateString();
  const done = new Set((store.get().toolkit.selfcare || {})[key] || []);
  return {
    html: html`
      ${appbar('Self-care checklist', 'The basics that protect you')}
      <div class="card"><div class="list" id="sc">
        ${items.map((t, i) => `<label class="row" style="cursor:pointer"><span class="ico">${done.has(i) ? '✅' : '⭕'}</span>
          <span class="rt"><span class="rtl">${esc(t)}</span></span>
          <input type="checkbox" data-i="${i}" ${done.has(i) ? 'checked' : ''} style="width:22px;height:22px"/></label>`).join('')}
      </div><div id="tally" class="muted center" style="margin-top:10px">${done.size}/${items.length} today</div></div>`,
    onMount(root) {
      root.querySelectorAll('#sc input').forEach(cb => cb.addEventListener('change', () => {
        const i = +cb.dataset.i; cb.checked ? done.add(i) : done.delete(i);
        store.update(s => { s.toolkit.selfcare = s.toolkit.selfcare || {}; s.toolkit.selfcare[key] = [...done]; });
        cb.closest('.row').querySelector('.ico').textContent = cb.checked ? '✅' : '⭕';
        root.querySelector('#tally').textContent = `${done.size}/${items.length} today`;
        if (done.size === items.length) toast('Full self-care day! 🌟');
      }));
    },
  };
}

export const stressRoutes = {
  '/stress': hub,
  '/stress/diary': diary,
  '/stress/time': timeTool,
  '/stress/boundaries': boundaries,
  '/stress/workload': workload,
  '/stress/selfcare': selfcare,
};
