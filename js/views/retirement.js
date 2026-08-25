/* ===========================================================
   views/retirement.js — Retirement Transition Centre 🔄
   =========================================================== */
import { store, now, fmtDate } from '../store.js';
import { html, esc, toast, go, appbar, sectionH, rows, scoreBar, ring } from '../ui.js';
import { RETIRE_PILLARS, RETIRE_READINESS, RETIRE_JOURNEY, TOOLKITS } from '../data.js';

function hub() {
  const s = store.get();
  const r = s.retirement;
  const scored = r.scores;
  const overall = scored ? Math.round(Object.values(scored).reduce((a, b) => a + b, 0) / Object.keys(scored).length) : null;
  const months = s.profile.retireInMonths;
  const phase = phaseFor(months);
  return {
    html: html`
      ${appbar('Retirement Transition', 'From employment to a healthy retirement')}
      <div class="hero" style="background:linear-gradient(140deg,#134e4a,#8b5cf6)">
        <h1 style="font-size:1.25rem">🔄 Your next chapter, planned</h1>
        <p>Retirement isn't a date — it's a 12–24 month journey. Start early and arrive ready in every dimension.</p>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong>Your timeline</strong><div class="muted" style="font-size:.82rem">~${months} months to retirement</div></div>
          <span class="chip on">${esc(phase.title)}</span>
        </div>
        <label class="field" style="margin-top:12px"><span>Adjust months to retirement</span>
          <div class="range-wrap"><input type="range" id="months" min="0" max="36" value="${months}"/><output id="mo">${months}</output></div></label>
      </div>

      ${scored ? html`<a class="card" href="#/retirement/readiness" style="display:block">
          ${ring(overall, 'Ready')}
          <p class="center" style="font-weight:700;margin:4px 0 0">Retirement Readiness: ${overall}%</p>
          <p class="center muted" style="font-size:.82rem">Tap to see your breakdown & priorities</p>
        </a>`
        : `<a class="btn primary" href="#/retirement/readiness" style="margin-bottom:14px">Get your Retirement Readiness Score</a>`}

      ${sectionH('Your retirement toolkit')}
      ${rows(TOOLKITS.retirement)}

      <div class="card"><h3>Flagship programme</h3>
        <p class="muted">The <strong>12-month Retirement Transition Programme</strong> bundles readiness assessment, purpose planning, financial-wellness education, relationship preparation, health & lifestyle planning, counselling and post-retirement follow-up.</p>
        <a class="btn" href="#/packages">For employers & individuals ›</a></div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const mo = root.querySelector('#mo');
      root.querySelector('#months').addEventListener('input', e => mo.textContent = e.target.value);
      root.querySelector('#months').addEventListener('change', e => { store.update(st => { st.profile.retireInMonths = +e.target.value; }); go('#/retirement'); });
    },
  };
}

function phaseFor(months) {
  if (months >= 20) return { title: 'Prepare' };
  if (months >= 14) return { title: 'Plan' };
  if (months >= 8) return { title: 'Transition' };
  if (months >= 1) return { title: 'Adjust' };
  if (months === 0) return { title: 'Launch' };
  return { title: 'Rebuild' };
}

/* ---- Readiness score ---- */
function readiness() {
  const prev = store.get().retirement.scores;
  return {
    html: html`
      ${appbar('Retirement Readiness Score', 'Six dimensions')}
      <div class="card"><p class="muted" style="margin:0">${esc(RETIRE_READINESS.intro)}</p></div>
      <div class="card"><div id="qs">
        ${RETIRE_READINESS.dims.map(d => html`
          <div class="q">
            <div class="qt">${d.emoji} ${esc(d.label)}</div>
            <div class="muted" style="font-size:.82rem;margin-bottom:6px">${esc(d.q)}</div>
            <div class="likert" data-dim="${d.id}">${[0, 1, 2, 3, 4].map(v => `<button data-v="${v}" class="${prev && prev[d.id] === v * 25 ? 'on' : ''}">${v}</button>`).join('')}</div>
          </div>`).join('')}
      </div></div>
      <button class="btn primary" id="calc">See my readiness</button>
      <div id="out">${prev ? renderReadiness(prev) : ''}</div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const answers = {};
      if (prev) RETIRE_READINESS.dims.forEach(d => { if (prev[d.id] != null) answers[d.id] = prev[d.id] / 25; });
      root.querySelectorAll('.likert').forEach(g => g.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        g.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); answers[g.dataset.dim] = +b.dataset.v;
      })));
      root.querySelector('#calc').addEventListener('click', () => {
        if (Object.keys(answers).length < RETIRE_READINESS.dims.length) return toast('Answer all six');
        const scores = {}; for (const k in answers) scores[k] = answers[k] * 25;
        store.update(s => { s.retirement.scores = scores; s.retirement.ts = now(); });
        root.querySelector('#out').innerHTML = renderReadiness(scores);
        root.querySelector('#out').scrollIntoView({ behavior: 'smooth' });
      });
    },
  };
}

function renderReadiness(scores) {
  const dims = RETIRE_READINESS.dims;
  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / dims.length);
  const ranked = [...dims].sort((a, b) => scores[a.id] - scores[b.id]);
  const priorities = ranked.slice(0, 3);
  const colorFor = v => v >= 70 ? 'var(--green-500)' : v >= 50 ? 'var(--amber-500)' : 'var(--rose-500)';
  return html`
    <div class="card" style="margin-top:14px">
      ${ring(overall, 'Ready')}
      <p class="center" style="font-weight:800;margin:6px 0 12px">Overall readiness: ${overall}%</p>
      ${dims.map(d => scoreBar(`${d.emoji} ${d.label}`, scores[d.id], colorFor(scores[d.id]))).join('')}
    </div>
    <div class="card">
      <h3>Your priority areas</h3>
      <div class="journey">
        ${priorities.map((d, i) => `<div class="jstep"><div class="jw">Priority ${i + 1}</div><div class="jt">${d.emoji} ${esc(d.label)}</div><div class="jd">${esc(priorityTip(d.id))}</div></div>`).join('')}
      </div>
      <a class="btn primary" href="#/retirement/journey">See your transition programme ›</a>
    </div>`;
}
function priorityTip(id) {
  return {
    financial: 'Build a funded cashflow plan — take the Financial Wellness course and speak to a coach.',
    emotional: 'Prepare emotionally for the identity shift — journalling and counselling help.',
    health: 'Invest in physical health now — it compounds for the decades ahead.',
    relationships: 'Have honest conversations at home about the change ahead.',
    purpose: 'Explore what will give your days meaning — hobbies, volunteering, learning.',
    social: 'Grow connections beyond work so your circle survives the transition.',
  }[id];
}

/* ---- Journey ---- */
function journey() {
  const months = store.get().profile.retireInMonths;
  const currentPhase = phaseFor(months).title;
  const order = RETIRE_JOURNEY.map(j => j.title);
  const curIdx = order.indexOf(currentPhase);
  return {
    html: html`
      ${appbar('The 7-stage journey', 'Long-term engagement, not one session')}
      <div class="callout info" style="margin-bottom:12px">You're around the <strong>${esc(currentPhase)}</strong> stage (~${months} months out). Each stage builds on the last.</div>
      <div class="card"><div class="journey">
        ${RETIRE_JOURNEY.map((j, i) => `<div class="jstep ${i <= curIdx ? 'done' : ''}">
          <div class="jw">${esc(j.when)}</div><div class="jt">${esc(j.title)} ${i === curIdx ? '· you are here' : ''}</div><div class="jd">${esc(j.desc)}</div></div>`).join('')}
      </div></div>
      <a class="btn primary" href="#/retirement/pillars">Work the four pillars ›</a>
      <div class="fab-space"></div>`,
  };
}

/* ---- Four pillars ---- */
function pillars() {
  return {
    html: html`
      ${appbar('Four transition pillars', 'Where the work happens')}
      ${RETIRE_PILLARS.map(p => html`
        <div class="card">
          <h3>${p.emoji} ${esc(p.name)}</h3>
          <div class="tag-row">${p.items.map(i => `<span class="chip">${esc(i)}</span>`).join('')}</div>
        </div>`).join('')}
      <div class="card"><h3>Turn it into a plan</h3>
        <div class="btnrow">
          <a class="btn primary" href="#/retirement/readiness">Score your readiness</a>
          <a class="btn" href="#/counselling?cat=Retirement counselling">Retirement counselling</a>
        </div>
      </div>
      <div class="fab-space"></div>`,
  };
}

/* ---- Purpose & engagement planner ---- */
function purpose() {
  const ideas = ['Volunteering', 'Mentoring', 'A small business', 'Learning a skill', 'Faith community', 'Travel', 'Gardening / farming', 'Grandchildren', 'Sports & fitness', 'Arts & music', 'Writing', 'Community leadership', 'Consulting part-time', 'A new hobby'];
  const saved = store.get().toolkit.retirePurpose || [];
  return {
    html: html`
      ${appbar('Purpose & engagement', 'What will fill your days')}
      <div class="card"><p class="muted">Work gives structure, identity and connection. Plan what will provide those next — pick what appeals, then add your own.</p>
        <div class="chips" id="chips">${ideas.map(t => `<button class="chip ${saved.includes(t) ? 'on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        <div style="display:flex;gap:8px;margin-top:10px"><input id="own" placeholder="Add your own idea"/><button class="btn sm" id="add">Add</button></div>
      </div>
      <div class="card"><h3>My purpose plan</h3><div id="mine" class="tag-row"></div>
        <a class="btn" style="margin-top:12px" href="#/journal/retire">Reflect in your journal ›</a></div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const paint = () => { const cur = store.get().toolkit.retirePurpose || []; root.querySelector('#mine').innerHTML = cur.length ? cur.map(t => `<span class="chip on">${esc(t)}</span>`).join('') : '<span class="muted">Nothing chosen yet</span>'; };
      const toggle = (t) => { store.update(s => { const a = s.toolkit.retirePurpose = s.toolkit.retirePurpose || []; const i = a.indexOf(t); i >= 0 ? a.splice(i, 1) : a.push(t); }); paint(); };
      paint();
      root.querySelectorAll('#chips .chip').forEach(c => c.addEventListener('click', () => { c.classList.toggle('on'); toggle(c.dataset.t); }));
      root.querySelector('#add').addEventListener('click', () => {
        const v = root.querySelector('#own').value.trim(); if (!v) return;
        store.update(s => { (s.toolkit.retirePurpose = s.toolkit.retirePurpose || []).push(v); });
        root.querySelector('#own').value = ''; paint(); toast('Added');
      });
    },
  };
}

/* ---- Cashflow readiness planner ---- */
function cashflow() {
  const items = [
    ['I know roughly what income I\'ll have after work', 'Pension, savings, investments, other'],
    ['I have estimated my monthly retirement expenses', 'What life will actually cost'],
    ['I have an emergency fund (3–6 months)', 'A buffer for surprises'],
    ['My debts have a clear repayment plan', 'Aim to enter retirement lighter'],
    ['I have some income beyond a single pension', 'Diversify where you can'],
    ['I have reviewed my plan with a professional', 'A coach or financial adviser'],
  ];
  const set = new Set(store.get().toolkit.retireCashflow || []);
  return {
    html: html`
      ${appbar('Cashflow readiness', 'Money for the next chapter')}
      <div class="card"><p class="muted">Financial peace of mind is a huge part of a healthy retirement. Tick what's in place — the gaps are your to-do list.</p></div>
      <div class="card"><div class="list" id="cf">
        ${items.map(([t, d], i) => `<label class="row" style="cursor:pointer"><span class="ico">${set.has(i) ? '✅' : '⭕'}</span>
          <span class="rt"><span class="rtl">${esc(t)}</span><span class="rd">${esc(d)}</span></span>
          <input type="checkbox" data-i="${i}" ${set.has(i) ? 'checked' : ''} style="width:22px;height:22px"/></label>`).join('')}
      </div><div id="tally" class="muted center" style="margin-top:10px">${set.size}/${items.length} in place</div></div>
      <div class="btnrow">
        <a class="btn primary" href="#/course/finance">Financial Wellness course</a>
        <a class="btn" href="#/counselling?cat=Financial stress">Talk it through</a>
      </div>
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelectorAll('#cf input').forEach(cb => cb.addEventListener('change', () => {
        const i = +cb.dataset.i; cb.checked ? set.add(i) : set.delete(i);
        store.update(s => { s.toolkit.retireCashflow = [...set]; });
        cb.closest('.row').querySelector('.ico').textContent = cb.checked ? '✅' : '⭕';
        root.querySelector('#tally').textContent = `${set.size}/${items.length} in place`;
      }));
    },
  };
}

/* ---- Relationships & home guide ---- */
function relationships() {
  return {
    html: html`
      ${appbar('Relationships & home', 'Prepare the people around you')}
      <div class="card"><h3>Retirement changes home life too</h3>
        <p class="muted">More time together, shifting routines and roles, and a changing sense of identity all affect the people closest to you. Talking about it early prevents friction later.</p>
      </div>
      <div class="card"><h3>Conversations worth having</h3>
        <ul class="bul">
          <li>How do we each picture a typical day and week?</li>
          <li>What do we want to do together — and separately?</li>
          <li>How will we share space, chores and decisions at home?</li>
          <li>What does each of us need for our own purpose and friendships?</li>
          <li>How will we handle money and spending together?</li>
        </ul>
      </div>
      <div class="card"><h3>A gentle way to start</h3>
        <div class="callout info">"This next chapter affects both of us. I'd love for us to plan it together — what are you looking forward to, and what are you unsure about?"</div>
      </div>
      <div class="btnrow">
        <a class="btn" href="#/family">Family & relationships</a>
        <a class="btn primary" href="#/counselling?cat=Couples counselling">Talk to a counsellor</a>
      </div>
      <div class="fab-space"></div>`,
  };
}

export const retirementRoutes = {
  '/retirement': hub,
  '/retirement/readiness': readiness,
  '/retirement/journey': journey,
  '/retirement/pillars': pillars,
  '/retirement/purpose': purpose,
  '/retirement/cashflow': cashflow,
  '/retirement/relationships': relationships,
};
