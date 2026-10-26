/* ===========================================================
   views/substance.js — Substance Use & Recovery 🌿
   Harm-reduction, non-judgemental. All logs stay on-device.
   =========================================================== */
import { store, now, fmtDateTime } from '../store.js';
import { html, esc, toast, appbar, sectionH, rows, scoreBar, crisisNote, refresh } from '../ui.js';
import { TOOLKITS } from '../data.js';

const SUBSTANCES = ['Alcohol', 'Miraa (khat)', 'Cannabis', 'Tobacco / nicotine', 'Sedatives or painkillers', 'Stimulants', 'Other'];
const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];
const TRIGGERS = ['Payday', 'Friday after work', 'Arguments at home', 'Certain friends', 'Boredom', 'Weddings & celebrations',
  'Work stress', 'Can\'t sleep', 'Money pressure', 'Being left alone', 'Old routines'];

const dayKey = () => new Date().toISOString().slice(0, 10);

function hub() {
  const a = store.get().assessments.substance;
  const cravings = store.get().cravings;
  const logged = cravings.filter(c => dayKey() === new Date(c.ts).toISOString().slice(0, 10)).length;
  return {
    html: html`
      ${appbar('Substance Use & Recovery', 'One day at a time')}
      <div class="hero" style="background:linear-gradient(140deg,#064e3b,#65a30d)">
        <h1 style="font-size:1.25rem">🌿 You can change this</h1>
        <p>Use is usually a coping strategy that stopped working. Nobody is shaming you here. Track it, understand it, and choose the next hour.</p>
      </div>
      ${a ? `<div class="callout ${a.score >= 61 ? 'warn' : 'info'}" style="margin-bottom:12px">Substance-use check: <strong>${a.score}% · ${esc(a.band)}</strong>. <a href="#/assess/substance" style="text-decoration:underline;font-weight:700">Retake</a></div>`
          : `<a class="btn primary" href="#/assess/substance" style="margin-bottom:14px">Take the honest substance-use check</a>`}
      <div class="callout warn" style="margin-bottom:14px"><strong>Safety first.</strong> Stopping alcohol or sedatives suddenly can be medically dangerous. If you drink daily, take large doses, or have ever had a fit or hallucinations when stopping, talk to a clinic before you quit.
        <a href="#/counselling?cat=Substance-use concerns" style="text-decoration:underline;font-weight:700">Find support ›</a></div>
      ${sectionH('Your recovery toolkit')}
      ${rows(TOOLKITS.substance)}
      ${sectionH('Right now, in this moment')}
      <div class="card">
        <p class="muted">A craving normally peaks and passes in about 20 minutes. You only have to outlast this one.</p>
        <div class="btnrow">
          <a class="btn primary" href="#/tool/breathe?ctx=substance">🌬️ Breathe for 90 seconds</a>
          <a class="btn" href="#/substance/plan">Open my urge plan</a>
        </div>
        <div class="divider"></div>
        <div class="kpi"><div class="k"><div class="n">${logged}</div><div class="l">cravings logged today</div></div>
          <div class="k"><div class="n">${cravings.length}</div><div class="l">all time</div></div>
          <div class="k"><div class="n">${store.get().toolkit.recoveryStart ? '🌱' : '—'}</div><div class="l">counter started</div></div></div>
        <a class="btn" style="margin-top:12px" href="#/substance/counter">Start or view my day counter ›</a>
      </div>
      ${crisisNote()}
      <div class="fab-space"></div>`,
  };
}

/* ---------- Craving log ---------- */
function cravings() {
  const list = store.get().cravings;
  return {
    html: html`
      ${appbar('Craving log', 'Catch it, ride it, record it')}
      <div class="card"><p class="muted">Log the urge <em>when it hits</em>, not later. The pattern is what teaches you.</p>
        <label class="field"><span>What was it?</span>
          <select id="sub">${SUBSTANCES.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
        <label class="field"><span>How strong?</span>
          <div class="range-wrap"><input type="range" id="strength" min="0" max="10" value="6"/><output id="so">6</output></div></label>
        <label class="field"><span>What was happening just before?</span><input id="trigger" placeholder="e.g. Argument with my supervisor, then drove past the bar"/></label>
        <label class="field"><span>What did I do instead?</span><input id="did" placeholder="e.g. Called my brother, walked the compound, box breathing"/></label>
        <label class="field"><span>Anything else?</span><textarea id="note" placeholder="What I learned…"></textarea></label>
        <button class="btn primary" id="save">Save entry</button>
      </div>
      <div id="list">${listEntries(list)}</div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const so = root.querySelector('#so');
      root.querySelector('#strength').addEventListener('input', e => so.textContent = e.target.value);
      root.querySelector('#save').addEventListener('click', () => {
        const did = root.querySelector('#did').value.trim();
        store.push('cravings', {
          ts: now(),
          sub: root.querySelector('#sub').value,
          strength: +root.querySelector('#strength').value,
          trigger: root.querySelector('#trigger').value.trim(),
          did, coped: did ? true : false,
          note: root.querySelector('#note').value.trim(),
        });
        root.querySelectorAll('input,textarea').forEach(i => { if (i.type !== 'range') i.value = ''; });
        root.querySelector('#strength').value = 6; so.textContent = '6';
        root.querySelector('#list').innerHTML = listEntries(store.get().cravings);
        toast(did ? 'Recorded — you did something about it' : 'Recorded privately');
      });
    },
  };
}
function listEntries(list) {
  if (!list.length) return `<div class="empty"><div class="e">🌿</div><p>No cravings logged yet. Log the next one while it is happening.</p></div>`;
  return list.map(e => html`
    <div class="card tight">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${esc(e.sub)}</strong><span class="stat-pill ${e.strength >= 8 ? 'r' : e.strength >= 5 ? 'o' : 'g'}">${e.strength}/10</span>
      </div>
      <small>${fmtDateTime(e.ts)}</small>
      ${e.trigger ? `<p style="margin:6px 0 0"><span class="muted">Before:</span> ${esc(e.trigger)}</p>` : ''}
      ${e.did ? `<p style="margin:2px 0 0"><span class="muted">Instead:</span> ${esc(e.did)}</p>` : '<p style="margin:2px 0 0" class="muted">No action recorded — try the urge plan next time.</p>'}
      ${e.note ? `<p style="margin:2px 0 0"><span class="muted">Note:</span> ${esc(e.note)}</p>` : ''}
    </div>`).join('');
}

/* ---------- Recovery day counter ---------- */
function counter() {
  const start = store.get().toolkit.recoveryStart;
  const days = start ? Math.max(0, Math.floor((now() - new Date(start + 'T12:00:00').getTime()) / 86400000)) : null;
  const next = days === null ? null : (MILESTONES.find(m => m > days) || null);
  return {
    html: html`
      ${appbar('Recovery counter', 'Milestones, not perfection')}
      ${days === null ? `<div class="card"><h3>Choose a start date</h3>
        <p class="muted">Today, last weekend, or the morning you decided. Any of those is a real start.</p>
        <label class="field"><span>I started on</span><input type="date" id="start" value="${dayKey()}"/></label>
        <button class="btn primary" id="begin">Start counting</button></div>`
      : `<div class="card center">
          <div style="font-size:3rem;font-weight:800;line-height:1">${days}</div>
          <div class="muted">day${days === 1 ? '' : 's'} since ${esc(start)}</div>
          ${next ? `<div style="margin-top:14px">${scoreBar(`Next milestone · ${next} days`, (days / next) * 100)}</div>` : '<div class="callout info" style="margin-top:14px">Every milestone passed. Keep going.</div>'}
          <div class="muted" style="font-size:.78rem;margin-top:10px">Day 1 · 3 · 7 · 14 · 30 · 60 · 90 · 180 · 365</div>
          <div class="btnrow" style="margin-top:14px">
            <button class="btn" id="reset">Reset the date</button>
            <a class="btn primary" href="#/substance/cravings">Log a craving</a>
          </div>
        </div>
        <div class="callout info"><strong>If you used today?</strong> That is data, not a verdict. Most recovery has several of these. Reset the date, read your urge plan, and tell one person.</div>`}
      <div class="card"><h3>What changes over time</h3>
        <ul class="bul">
          <li><strong>24–72 hrs</strong> — sleep and appetite often settle; moods can swing</li>
          <li><strong>2 weeks</strong> — focus and energy improve; cravings get quieter</li>
          <li><strong>1–3 months</strong> — mood stabilises, money stops disappearing</li>
          <li><strong>6–12 months</strong> — relationships and self-respect rebuild</li>
        </ul>
        <p class="muted" style="font-size:.78rem">General guidance, not medical advice. Your clinic can tell you what to expect for you.</p>
      </div>
      ${crisisNote()}
      <div class="fab-space"></div>`,
    onMount(root) {
      const begin = root.querySelector('#begin');
      begin && begin.addEventListener('click', () => {
        const v = root.querySelector('#start').value;
        if (!v) return toast('Pick a date first');
        store.update(s => { s.toolkit.recoveryStart = v; });
        toast('Counting from ' + v); refresh();
      });
      const reset = root.querySelector('#reset');
      reset && reset.addEventListener('click', () => {
        store.update(s => { delete s.toolkit.recoveryStart; });
        refresh();
      });
    },
  };
}

/* ---------- Trigger map ---------- */
function triggers() {
  const saved = store.get().toolkit.substanceTriggers || [];
  return {
    html: html`
      ${appbar('Trigger map', 'Most relapse is scheduled, not random')}
      <div class="card"><p class="muted">Tap what reliably pulls you toward using. Knowing the shape of the risk lets you plan around it.</p>
        <div class="chips" id="chips">${TRIGGERS.map(t => `<button class="chip ${saved.includes(t) ? 'on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      </div>
      <div class="card"><h3>My risk list</h3><div id="mine" class="tag-row"></div>
        <p class="muted" style="margin-top:10px">For each one, decide in advance: <em>if</em> that happens, <em>then</em> I will…</p>
        <a class="btn primary" style="margin-top:12px" href="#/substance/plan">Write my if→then plan ›</a></div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const paint = () => {
        const cur = store.get().toolkit.substanceTriggers || [];
        root.querySelector('#mine').innerHTML = cur.length ? cur.map(t => `<span class="chip on">${esc(t)}</span>`).join('') : '<span class="muted">Nothing selected yet</span>';
      };
      paint();
      root.querySelectorAll('#chips .chip').forEach(c => c.addEventListener('click', () => {
        const t = c.dataset.t;
        store.update(s => { const arr = s.toolkit.substanceTriggers = s.toolkit.substanceTriggers || []; const i = arr.indexOf(t); i >= 0 ? arr.splice(i, 1) : arr.push(t); });
        c.classList.toggle('on'); paint();
      }));
    },
  };
}

/* ---------- Personal urge plan ---------- */
function plan() {
  const p = store.get().toolkit.urgePlan || {};
  const shown = p.why;
  return {
    html: html`
      ${appbar('My urge plan', 'For the next 20 minutes')}
      ${shown ? html`
        <div class="card" style="border-color:var(--brand)">
          <h3>🆘 When the urge hits</h3>
          ${p.sign ? `<p><span class="muted">My warning sign:</span> ${esc(p.sign)}</p>` : ''}
          ${p.doing ? `<p style="margin-top:8px"><span class="muted">I will do:</span></p><ul class="bul">${p.doing.split(/[\r\n]+/).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          ${p.call ? `<p style="margin-top:8px"><span class="muted">I will call:</span> <strong>${esc(p.call)}</strong>${p.phone ? ` — <a href="tel:${esc(p.phone.replace(/[^0-9+]/g, ''))}" style="text-decoration:underline;font-weight:700">${esc(p.phone)}</a>` : ''}</p>` : ''}
          ${p.why ? `<div class="divider"></div><div class="callout info">Why I am doing this: <strong>${esc(p.why)}</strong></div>` : ''}
          <div class="btnrow" style="margin-top:12px">
            <a class="btn" href="#/tool/breathe?ctx=substance">🌬️ Breathe now</a>
            <a class="btn primary" href="tel:1192">Call NACADA 1192</a>
          </div>
        </div>
        <button class="btn ghost" id="edit" style="margin-bottom:12px">Edit my plan</button>` : ''}
      <div class="card"><h3>${shown ? 'Update your plan' : 'Build your plan'}</h3>
        <label class="field"><span>My earliest warning sign that an urge is coming</span><input id="sign" value="${esc(p.sign || '')}" placeholder="e.g. Counting money, pacing, checking the time"/></label>
        <label class="field"><span>Three things I will actually do</span><textarea id="doing" placeholder="1. Walk outside&#10;2. Box breathing 4-4-4-4&#10;3. Wash my face and drink water">${esc(p.doing || '')}</textarea></label>
        <label class="field"><span>Who I will call</span><input id="call" value="${esc(p.call || '')}" placeholder="e.g. My brother, my sponsor, my counsellor"/></label>
        <label class="field"><span>Their number</span><input id="phone" value="${esc(p.phone || '')}" placeholder="e.g. 07…"/></label>
        <label class="field"><span>Why I am doing this — in one sentence</span><input id="why" value="${esc(p.why || '')}" placeholder="e.g. I want my children to know me sober"/></label>
        <button class="btn primary" id="save">Save my plan</button>
      </div>
      <div class="card"><h3>Free, confidential, in Kenya</h3>
        <div class="list">
          <a class="row" href="tel:1192"><span class="ico">🌿</span><span class="rt"><span class="rtl">NACADA helpline</span><span class="rd">24-hour substance-use counselling &amp; referral</span></span><span class="go" style="font-weight:700;color:var(--brand)">1192</span></a>
          <a class="row" href="tel:1199"><span class="ico">📞</span><span class="rt"><span class="rtl">Kenya Red Cross</span><span class="rd">Toll-free psychosocial support</span></span><span class="go" style="font-weight:700;color:var(--brand)">1199</span></a>
          <a class="row" href="#/counselling?cat=Substance-use%20concerns"><span class="ico">💬</span><span class="rt"><span class="rtl">Verified counsellors</span><span class="rd">Book a confidential session</span></span><span class="go">›</span></a>
        </div>
      </div>
      ${crisisNote()}
      <div class="fab-space"></div>`,
    onMount(root) {
      const edit = root.querySelector('#edit');
      edit && edit.addEventListener('click', () => { root.querySelector('#sign').focus(); root.querySelector('#sign').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
      root.querySelector('#save').addEventListener('click', () => {
        const get = id => root.querySelector('#' + id).value.trim();
        if (!get('why')) return toast('Write your one-sentence reason');
        store.update(s => { s.toolkit.urgePlan = { sign: get('sign'), doing: get('doing'), call: get('call'), phone: get('phone'), why: get('why') }; });
        toast('Plan saved on this device'); refresh();
      });
    },
  };
}

export const substanceRoutes = {
  '/substance': hub,
  '/substance/cravings': cravings,
  '/substance/counter': counter,
  '/substance/triggers': triggers,
  '/substance/plan': plan,
};
