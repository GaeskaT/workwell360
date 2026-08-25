/* ===========================================================
   views/retirement.js — Retirement Transition Centre 🔄
   =========================================================== */
import { store, now, fmtDate } from '../store.js';
import { html, esc, toast, go, appbar, sectionH, rows, scoreBar, ring } from '../ui.js';
import { RETIRE_PILLARS, RETIRE_READINESS, RETIRE_JOURNEY } from '../data.js';

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

      ${sectionH('Explore your transition')}
      ${rows([
        { ico: '📊', title: 'Retirement Readiness Score', desc: 'Six dimensions, your priorities', href: '#/retirement/readiness' },
        { ico: '🗺️', title: 'The 7-stage journey', desc: 'Prepare → Launch → Thrive', href: '#/retirement/journey' },
        { ico: '🧩', title: 'The four transition pillars', desc: 'Uncertainty · Engagement · Cashflows · Relationships', href: '#/retirement/pillars' },
        { ico: '🎓', title: 'Preparing for Retirement course', desc: '8 lessons · certificate', href: '#/course/retire' },
        { ico: '💰', title: 'Financial Wellness course', desc: 'Plan your cashflows', href: '#/course/finance' },
        { ico: '💼', title: 'Retirement counselling', desc: 'Talk to a specialist', href: '#/counselling?cat=Retirement counselling' },
      ])}

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

export const retirementRoutes = {
  '/retirement': hub,
  '/retirement/readiness': readiness,
  '/retirement/journey': journey,
  '/retirement/pillars': pillars,
};
