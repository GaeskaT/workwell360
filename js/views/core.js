/* ===========================================================
   views/core.js — dashboard, onboarding, check-in, need-today,
   assessments, courses, tools, crisis, settings, about, journal
   =========================================================== */
import { store, uid, now, fmtDate, fmtDateTime, daysAgo } from '../store.js';
import { html, esc, go, toast, appbar, sectionH, rows, scoreBar, ring, likertGroup } from '../ui.js';
import {
  PILLARS, MOODS, NEED_PATHS, ASSESSMENTS, COURSES, PRODUCTS, CRISIS, PACKAGES,
} from '../data.js';

/* ---------- Onboarding ---------- */
function onboarding() {
  return {
    html: html`
      <div class="brandwrap" style="padding-top:24px">
        <span class="brandplate"><img class="brandlogo" src="icons/logo-full.png" alt="WorkWell 360 — Wellness. Performance. Purpose."/></span>
      </div>
      <div class="hero">
        <p style="margin:0">A complete workplace mental-wellness and retirement-transition companion — from everyday stress to a healthy retirement.</p>
      </div>
      <div class="card">
        <h2>Let's set you up</h2>
        <p class="muted">This takes 20 seconds. Everything you enter stays private on your device.</p>
        <label class="field"><span>Your name (optional)</span><input id="ob-name" placeholder="e.g. Jane" autocomplete="name"/></label>
        <label class="field"><span>Organisation</span><input id="ob-org" value="Demo Organisation"/></label>
        <label class="field"><span>I am a…</span>
          <select id="ob-role">
            <option value="employee">Employee</option>
            <option value="hr">HR / People manager</option>
            <option value="counsellor">Counsellor / provider</option>
            <option value="retiree">Approaching retirement</option>
          </select>
        </label>
        <div class="callout info" style="margin:10px 0">🔒 Your check-ins, journals and assessments never leave your phone. Employers only ever see anonymous, aggregated trends — never your personal entries.</div>
        <button class="btn primary" id="ob-go">Get started</button>
      </div>`,
    onMount(root) {
      root.querySelector('#ob-go').addEventListener('click', () => {
        store.update(s => {
          s.onboarded = true;
          s.profile.name = root.querySelector('#ob-name').value.trim();
          s.profile.org = root.querySelector('#ob-org').value.trim() || 'Demo Organisation';
          s.profile.role = root.querySelector('#ob-role').value;
        });
        toast('Welcome to WorkWell 360 👋');
        go('#/dashboard');
      });
    },
  };
}

/* ---------- Dashboard ---------- */
function dashboard() {
  const s = store.get();
  const last = s.checkins[0];
  const name = s.profile.name ? `, ${esc(s.profile.name)}` : '';
  const greetHr = new Date().getHours();
  const greet = greetHr < 12 ? 'Good morning' : greetHr < 17 ? 'Good afternoon' : 'Good evening';
  const streak = checkinStreak(s.checkins);

  return {
    html: html`
      <div class="brandwrap">
        <span class="brandplate"><img class="brandlogo" src="icons/logo-full.png" alt="WorkWell 360 — Wellness. Performance. Purpose."/></span>
      </div>

      <div class="hero">
        <h1 style="font-size:1.35rem">${greet}${name} 👋</h1>
        <p>How are you doing today? A quick check-in helps us point you to the right support.</p>
      </div>

      <div class="card" id="checkin-card">
        <h3>How are you doing today?</h3>
        <div class="moods" id="moods">
          ${MOODS.map(m => `<button class="mood" data-v="${m.v}"><span class="e">${m.e}</span><span class="l">${m.l}</span></button>`).join('')}
        </div>
        <div id="checkin-after"></div>
      </div>

      <div class="kpi card tight">
        <div class="k"><div class="n">${streak}🔥</div><div class="l">Day streak</div></div>
        <div class="k"><div class="n">${s.checkins.length}</div><div class="l">Check-ins</div></div>
        <div class="k"><div class="n">${s.bookings.filter(b=>b.status!=='cancelled').length}</div><div class="l">Sessions</div></div>
      </div>

      ${sectionH('What do you need today?', 'See all', '#/need-today')}
      <div class="grid g2">
        ${NEED_PATHS.slice(0, 4).map(p => `<a class="tile" href="${p.route}"><span class="emoji">${p.e}</span><span class="t">${esc(p.label)}</span><span class="d">${esc(p.tag)}</span></a>`).join('')}
      </div>

      ${sectionH('Your wellness centres')}
      <div class="grid g2">
        ${PILLARS.filter(p=>p.id!=='employer').map(p => `<a class="tile" href="${p.route}"><span class="emoji">${p.emoji}</span><span class="t">${esc(p.name)}</span><span class="d">${esc(p.desc)}</span></a>`).join('')}
      </div>

      ${sectionH('Quick tools')}
      ${rows([
        { ico: '🌬️', title: '90-second breathing reset', desc: 'Calm your body right now', href: '#/tool/breathe' },
        { ico: '🎯', title: 'Take a self-assessment', desc: 'Anger · Stress · Burnout', href: '#/need-today' },
        { ico: '🔄', title: 'Retirement readiness score', desc: 'See where you stand', href: '#/retirement/readiness' },
        { ico: '📊', title: 'Employer / HR dashboard', desc: 'Anonymous wellness trends', href: '#/employer' },
      ])}
      <div class="fab-space"></div>`,
    onMount(root) {
      if (last && daysAgo(last.ts) === 0) markMood(root, last.mood);
      root.querySelectorAll('#moods .mood').forEach(b => b.addEventListener('click', () => {
        const v = +b.dataset.v;
        store.push('checkins', { ts: now(), mood: v, note: '' });
        markMood(root, v);
        renderCheckinAdvice(root, v);
        toast('Check-in saved');
      }));
    },
  };
}

function markMood(root, v) {
  root.querySelectorAll('#moods .mood').forEach(x => x.classList.toggle('sel', +x.dataset.v === v));
  renderCheckinAdvice(root, v);
}
function renderCheckinAdvice(root, v) {
  const box = root.querySelector('#checkin-after');
  if (!box) return;
  const advice = {
    5: { t: 'Love that. Keep doing what works.', a: [['Log a gratitude note', '#/journal/gratitude'], ['Explore courses', '#/store?cat=Courses']] },
    4: { t: 'Steady. A small top-up never hurts.', a: [['2-min breathing', '#/tool/breathe'], ['Self-care checklist', '#/stress/selfcare']] },
    3: { t: 'Struggling is a signal, not a failure.', a: [['Stress check', '#/assess/stress'], ['Talk to someone', '#/counselling']] },
    2: { t: "Let's lighten the load together.", a: [['Breathing reset', '#/tool/breathe'], ['Burnout self-check', '#/assess/burnout'], ['Book counselling', '#/counselling']] },
    1: { t: "You don't have to carry this alone.", a: [['Book counselling', '#/counselling'], ['Grounding exercise', '#/tool/relax']] },
    0: { t: 'Please reach out now — support is available.', a: [['Get urgent help', '#/crisis'], ['Book counselling', '#/counselling']] },
  }[v];
  if (!advice) { box.innerHTML = ''; return; }
  box.innerHTML = html`
    <div class="divider"></div>
    <p style="font-weight:600;margin-bottom:8px">${esc(advice.t)}</p>
    <div class="btnrow">${advice.a.map(([l, h]) => `<a class="btn ${h === '#/crisis' ? 'danger' : ''}" href="${h}">${esc(l)}</a>`).join('')}</div>`;
}
function checkinStreak(checkins) {
  if (!checkins.length) return 0;
  let streak = 0, day = 0;
  const seen = new Set(checkins.map(c => daysAgo(c.ts)));
  while (seen.has(day)) { streak++; day++; }
  return streak;
}

/* ---------- What do you need today ---------- */
function needToday() {
  return {
    html: html`
      ${appbar('What do you need today?', 'Pick what fits — no diagnosis, just direction', false)}
      <p class="muted" style="margin:-4px 2px 14px">Tap how you feel and we'll open the right pathway.</p>
      <div class="grid g2">
        ${NEED_PATHS.map(p => `<a class="tile" href="${p.route}"><span class="emoji">${p.e}</span><span class="t">${esc(p.label)}</span><span class="d">${esc(p.tag)} ›</span></a>`).join('')}
      </div>
      <div class="callout info" style="margin-top:14px">Not sure? Start with a quick <a href="#/assess/stress" style="font-weight:700;text-decoration:underline">stress check</a> or <a href="#/counselling" style="font-weight:700;text-decoration:underline">talk to a counsellor</a>.</div>`,
  };
}

/* ---------- Assessment runner ---------- */
function assessment({ id }) {
  const a = ASSESSMENTS[id];
  if (!a) return { html: `<div class="empty">Unknown assessment.</div>` };
  const prev = store.get().assessments[id];
  return {
    html: html`
      ${appbar(a.title, 'Reflection tool — not a diagnosis')}
      <div class="card"><p class="muted" style="margin:0">${esc(a.intro)}</p></div>
      ${prev ? `<div class="callout info" style="margin-bottom:12px">Last score: <strong>${prev.score}% · ${esc(prev.band)}</strong> on ${fmtDate(prev.ts)}</div>` : ''}
      <div class="card"><div id="qs"></div></div>
      <button class="btn primary" id="submit" disabled>See my result</button>
      <div id="result"></div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const qs = root.querySelector('#qs');
      const submit = root.querySelector('#submit');
      let current = {};
      likertGroup(qs, a.questions, (answers, complete) => { current = answers; submit.disabled = !complete; });
      submit.addEventListener('click', () => {
        const raw = Object.values(current).reduce((x, y) => x + y, 0);
        const score = Math.round((raw / (a.questions.length * 4)) * 100);
        const band = a.bands.find(b => score <= b.max);
        store.update(s => { s.assessments[id] = { ts: now(), score, band: band.band, answers: current }; });
        showResult(root.querySelector('#result'), a, score, band);
        root.querySelector('#result').scrollIntoView({ behavior: 'smooth' });
      });
    },
  };
}
function showResult(box, a, score, band) {
  const routeMap = { anger: '#/anger', stress: '#/stress', burnout: '#/burnout', mental: '#/mental' };
  box.innerHTML = html`
    <div class="card" style="margin-top:14px">
      ${ring(score, band.band)}
      <p style="text-align:center;font-weight:700;margin:6px 0 2px">${esc(band.band)}</p>
      <p class="muted" style="text-align:center">${esc(band.note)}</p>
      <div class="divider"></div>
      <div class="btnrow">
        <a class="btn primary" href="${routeMap[a.pillar]}">Open the ${esc(a.pillar)} toolkit</a>
        <a class="btn" href="#/counselling">Talk to a counsellor</a>
      </div>
    </div>`;
}

/* ---------- Course runner ---------- */
function course({ id }) {
  const c = COURSES[id];
  if (!c) return { html: `<div class="empty">Course not found.</div>` };
  const prog = store.get().courseProgress[id] || { lessons: [] };
  const product = PRODUCTS.find(p => p.courseId === id);
  const pct = Math.round((prog.lessons.length / c.lessons.length) * 100);
  return {
    html: html`
      ${appbar(c.title, `${c.lessons.length} lessons`)}
      <div class="card">
        ${scoreBar('Your progress', pct)}
        ${product ? `<div class="muted" style="font-size:.82rem">Full course with certificate: <span class="price">Ksh ${product.price.toLocaleString()}</span> — free preview below.</div>` : ''}
      </div>
      <div class="card"><div class="list" id="lessons">
        ${c.lessons.map((l, i) => `
          <label class="row" style="cursor:pointer">
            <span class="ico">${prog.lessons.includes(i) ? '✅' : '⭕'}</span>
            <span class="rt"><span class="rtl">Lesson ${i + 1}</span><span class="rd">${esc(l)}</span></span>
            <input type="checkbox" data-i="${i}" ${prog.lessons.includes(i) ? 'checked' : ''} style="width:22px;height:22px"/>
          </label>`).join('')}
      </div></div>
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelectorAll('#lessons input').forEach(cb => cb.addEventListener('change', () => {
        const i = +cb.dataset.i;
        store.update(s => {
          const p = s.courseProgress[id] || { lessons: [] };
          if (cb.checked) { if (!p.lessons.includes(i)) p.lessons.push(i); }
          else p.lessons = p.lessons.filter(x => x !== i);
          p.done = p.lessons.length === c.lessons.length;
          s.courseProgress[id] = p;
        });
        cb.closest('.row').querySelector('.ico').textContent = cb.checked ? '✅' : '⭕';
        if ((store.get().courseProgress[id] || {}).done) toast('Course complete! 🎓');
      }));
    },
  };
}

/* ---------- Breathing tool ---------- */
function breathe({ ctx }) {
  return {
    html: html`
      ${appbar('Breathing reset', 'Follow the circle for ~90 seconds')}
      <div class="card center">
        <div id="breath-ring" style="width:190px;height:190px;border-radius:50%;margin:20px auto;display:grid;place-items:center;
            background:radial-gradient(circle,var(--teal-100),var(--teal-500));transition:transform 4s ease-in-out;color:#04211d;font-weight:800">
          <span id="breath-txt">Breathe in</span>
        </div>
        <p class="muted" id="breath-count">Get comfortable. We'll do 6 slow cycles.</p>
        <button class="btn primary" id="breath-start">Start</button>
      </div>
      <div class="card"><h3>Why it works</h3><p class="muted">Slow breathing calms the body's stress response — lowering heart rate and easing tension. Use it before a hard conversation or when anger or panic rises.</p></div>`,
    onMount(root) {
      const r = root.querySelector('#breath-ring'), txt = root.querySelector('#breath-txt'),
        cnt = root.querySelector('#breath-count'), btn = root.querySelector('#breath-start');
      let running = false, cycle = 0;
      const phases = [['Breathe in', 1.35, 4000], ['Hold', 1.35, 4000], ['Breathe out', 0.75, 6000], ['Hold', 0.75, 2000]];
      let pi = 0;
      function step() {
        if (!running) return;
        const [label, scale, ms] = phases[pi];
        txt.textContent = label; r.style.transform = `scale(${scale})`;
        if (pi === 0) { cycle++; cnt.textContent = `Cycle ${cycle} of 6`; }
        pi = (pi + 1) % phases.length;
        if (cycle > 6) { running = false; txt.textContent = 'Well done'; r.style.transform = 'scale(1)'; cnt.textContent = 'Notice how your body feels now.'; btn.textContent = 'Again'; return; }
        setTimeout(step, ms);
      }
      btn.addEventListener('click', () => { if (running) return; running = true; cycle = 0; pi = 0; btn.textContent = 'Breathing…'; step(); });
    },
  };
}

/* ---------- Relaxation / grounding ---------- */
function relax() {
  const steps = [
    '5 things you can SEE around you', '4 things you can TOUCH', '3 things you can HEAR',
    '2 things you can SMELL', '1 thing you can TASTE', 'Take one slow breath. You are here, now.',
  ];
  return {
    html: html`
      ${appbar('Grounding & relaxation', '5-4-3-2-1 technique')}
      <div class="card"><p class="muted">This exercise gently brings your attention back to the present. Move at your own pace.</p></div>
      <div class="card"><div class="journey">
        ${steps.map((s, i) => `<div class="jstep ${i === steps.length - 1 ? '' : ''}"><div class="jt">${esc(s)}</div></div>`).join('')}
      </div></div>
      <a class="btn primary" href="#/tool/breathe">Follow with breathing ›</a>`,
  };
}

/* ---------- Journal ---------- */
function journal({ id }) {
  const titles = { gratitude: 'Gratitude journal', reflection: 'Daily reflection', grief: 'Grief journal', retire: 'Retirement journal' };
  const prompts = {
    gratitude: 'Name one thing that went well today, and why.',
    reflection: 'What drained you today, and what restored you?',
    grief: 'However you feel today is okay. Write whatever needs to come out.',
    retire: 'What are you looking forward to — or worried about — in this next chapter?',
  };
  const entries = store.get().journals[id] || [];
  return {
    html: html`
      ${appbar(titles[id] || 'Journal', 'Private to your device')}
      <div class="card">
        <label class="field"><span>${esc(prompts[id] || 'Write freely')}</span>
          <textarea id="j-text" placeholder="Start writing…"></textarea></label>
        <button class="btn primary" id="j-save">Save entry</button>
      </div>
      <div id="j-list">${entries.map(e => entryCard(e)).join('') || `<div class="empty"><div class="e">📝</div><p>No entries yet</p></div>`}</div>`,
    onMount(root) {
      root.querySelector('#j-save').addEventListener('click', () => {
        const t = root.querySelector('#j-text').value.trim();
        if (!t) return toast('Write something first');
        store.update(s => { (s.journals[id] = s.journals[id] || []).unshift({ ts: now(), text: t }); });
        root.querySelector('#j-text').value = '';
        const list = root.querySelector('#j-list');
        list.innerHTML = (store.get().journals[id] || []).map(e => entryCard(e)).join('');
        toast('Saved privately');
      });
    },
  };
}
const entryCard = (e) => html`<div class="card tight"><small>${fmtDateTime(e.ts)}</small><p style="margin:6px 0 0">${esc(e.text)}</p></div>`;

/* ---------- Packages ---------- */
function packages() {
  return {
    html: html`
      ${appbar('Corporate wellness packages', 'For employers & HR')}
      <p class="muted" style="margin:-4px 2px 14px">Bring WorkWell 360 to your whole organisation. Pricing scales with headcount.</p>
      ${PACKAGES.map(p => html`
        <div class="card" style="${p.popular ? 'border-color:var(--brand);box-shadow:0 0 0 2px var(--ring)' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h2 style="margin:0">${esc(p.name)}</h2>${p.popular ? '<span class="badge pro">Most popular</span>' : ''}
          </div>
          <div class="muted" style="font-size:.85rem;margin-bottom:6px">${esc(p.tagline)}</div>
          <div class="price" style="font-size:1.05rem;margin-bottom:10px">${esc(p.price)}</div>
          <ul class="bul">${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
          <a class="btn ${p.popular ? 'primary' : ''}" href="#/employer">Preview HR dashboard</a>
        </div>`).join('')}
      <div class="card"><h3>Revenue-ready</h3><p class="muted">Corporate subscriptions, counselling commission, workshops, digital courses, premium memberships, retirement-transition packages, licensing, and training & certification.</p></div>`,
  };
}

/* ---------- Crisis ---------- */
function crisis() {
  return {
    html: html`
      ${appbar('Get urgent help', 'You are not alone')}
      <div class="callout crisis" style="margin-bottom:14px"><strong>If life is in immediate danger, call emergency services now.</strong></div>
      <div class="card"><div class="list">
        ${CRISIS.map(c => `<a class="row" href="${/\d/.test(c.number) ? 'tel:' + c.number.replace(/[^0-9+]/g, '') : '#'}">
          <span class="ico">📞</span><span class="rt"><span class="rtl">${esc(c.name)}</span><span class="rd">${esc(c.note)}</span></span>
          <span class="go" style="font-weight:700;color:var(--brand)">${esc(c.number)}</span></a>`).join('')}
      </div></div>
      <div class="card"><h3>Right now</h3>
        <div class="btnrow">
          <a class="btn" href="#/tool/breathe">Breathe with me</a>
          <a class="btn" href="#/tool/relax">Grounding</a>
        </div>
        <a class="btn primary" style="margin-top:10px" href="#/counselling">Book a counsellor</a>
      </div>
      <p class="muted center" style="font-size:.78rem">Numbers shown are Kenya-based examples. Replace with your organisation's EAP and local hotlines before publishing.</p>`,
  };
}

/* ---------- More menu ---------- */
function more() {
  const s = store.get();
  return {
    html: html`
      ${appbar('More', esc(s.profile.org), false)}
      ${sectionH('For organisations')}
      ${rows([
        { ico: '📊', title: 'Employer / HR dashboard', desc: 'Anonymous wellness analytics', href: '#/employer' },
        { ico: '👩‍💼', title: 'Counsellor portal', desc: 'Manage clients & sessions', href: '#/counsellor' },
        { ico: '🏷️', title: 'Corporate packages', desc: 'Basic · Professional · Enterprise', href: '#/packages' },
      ])}
      ${sectionH('Wellness centres')}
      ${rows(PILLARS.filter(p=>p.id!=='employer').map(p => ({ ico: p.emoji, title: p.name, desc: p.desc, href: p.route })))}
      ${sectionH('Account')}
      ${rows([
        { ico: '⚙️', title: 'Settings & privacy', desc: 'Theme, data, reminders', href: '#/settings' },
        { ico: '🚨', title: 'Urgent help', desc: 'Crisis resources', href: '#/crisis' },
        { ico: 'ℹ️', title: 'About WorkWell 360', desc: 'Vision & confidentiality', href: '#/about' },
      ])}
      <div class="fab-space"></div>`,
  };
}

/* ---------- Settings ---------- */
function settings() {
  const s = store.get();
  return {
    html: html`
      ${appbar('Settings & privacy')}
      <div class="card">
        <h3>Appearance</h3>
        <div class="tabs" id="theme">
          ${['system', 'light', 'dark'].map(t => `<button data-t="${t}" class="${s.settings.theme === t ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}
        </div>
      </div>
      <div class="card">
        <h3>Privacy</h3>
        <label class="row" style="cursor:pointer">
          <span class="ico">📈</span>
          <span class="rt"><span class="rtl">Contribute to anonymous trends</span><span class="rd">Only aggregated, de-identified data — never your entries</span></span>
          <input type="checkbox" id="agg" ${s.settings.shareAnonAggregate ? 'checked' : ''} style="width:22px;height:22px"/>
        </label>
        <div class="callout info" style="margin-top:10px">🔒 Check-ins, journals and assessments are stored only on this device. Employers can never see individual counselling or personal data.</div>
      </div>
      <div class="card">
        <h3>Your data</h3>
        <div class="btnrow">
          <button class="btn" id="export">Export my data</button>
          <button class="btn" id="import">Import</button>
        </div>
        <button class="btn danger" id="reset" style="margin-top:10px">Erase all my data</button>
      </div>
      <div class="card tight center"><small>WorkWell 360 · v1.0 · Powered by Counsellor Priscilla Maina</small></div>
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelectorAll('#theme button').forEach(b => b.addEventListener('click', () => {
        store.update(st => { st.settings.theme = b.dataset.t; });
        window.__ww.applyTheme();
        root.querySelectorAll('#theme button').forEach(x => x.classList.toggle('on', x === b));
      }));
      root.querySelector('#agg').addEventListener('change', e => store.update(st => { st.settings.shareAnonAggregate = e.target.checked; }));
      root.querySelector('#export').addEventListener('click', () => {
        const blob = new Blob([store.exportJSON()], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'workwell360-data.json'; a.click();
        toast('Exported');
      });
      root.querySelector('#import').addEventListener('click', () => {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
        inp.onchange = () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { store.importJSON(rd.result); toast('Imported'); window.__ww.applyTheme(); location.hash = '#/dashboard'; } catch { toast('Invalid file'); } }; rd.readAsText(f); };
        inp.click();
      });
      root.querySelector('#reset').addEventListener('click', () => {
        if (confirm('Erase ALL your WorkWell 360 data on this device? This cannot be undone.')) { store.reset(); toast('All data erased'); location.hash = '#/onboarding'; location.reload(); }
      });
    },
  };
}

/* ---------- About ---------- */
function about() {
  return {
    html: html`
      ${appbar('About WorkWell 360')}
      <div class="brandwrap"><span class="brandplate"><img class="brandlogo" src="icons/logo-full.png" alt="WorkWell 360 — Wellness. Performance. Purpose."/></span></div>
      <div class="hero"><p style="margin:0">From workplace stress to workplace well-being — and from employment to a healthy retirement.</p></div>
      <div class="card"><h3>One journey, fully covered</h3>
        <p class="muted">Most wellness apps stop at the working years. WorkWell 360 covers the whole arc:</p>
        <p style="font-weight:600;font-size:.85rem">Joining work → Adjustment → Stress → Anger → Burnout → Relationships → Caregiving → Career → Pre-retirement → Retirement → Post-retirement well-being.</p>
      </div>
      <div class="card"><h3>Eight connected pillars</h3>
        <div class="tag-row">${PILLARS.map(p => `<span class="chip">${p.emoji} ${esc(p.name)}</span>`).join('')}</div>
      </div>
      <div class="card"><h3>Confidential by design</h3>
        <p class="muted">Employee confidential data is kept strictly separate from employer organisational data. Employers receive only aggregated, anonymised wellness trends — subject to consent, law and professional ethics — never private counselling conversations or individual clinical information.</p>
      </div>
      <div class="card tight center"><small>Powered by Counsellor Priscilla Maina · v1.0</small></div>
      <div class="fab-space"></div>`,
  };
}

export const coreRoutes = {
  '/onboarding': onboarding,
  '/dashboard': dashboard,
  '/need-today': needToday,
  '/assess/:id': assessment,
  '/course/:id': course,
  '/tool/breathe': breathe,
  '/tool/relax': relax,
  '/journal/:id': journal,
  '/packages': packages,
  '/crisis': crisis,
  '/more': more,
  '/settings': settings,
  '/about': about,
};
