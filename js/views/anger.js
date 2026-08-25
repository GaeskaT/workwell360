/* ===========================================================
   views/anger.js — Anger Management Centre 😡
   =========================================================== */
import { store, now, fmtDateTime } from '../store.js';
import { html, esc, toast, appbar, sectionH, rows, crisisNote } from '../ui.js';
import { TOOLKITS, ASSESSMENTS } from '../data.js';

function hub() {
  const a = store.get().assessments.anger;
  return {
    html: html`
      ${appbar('Anger Management', 'Pause · Reflect · Respond')}
      <div class="hero" style="background:linear-gradient(140deg,#7f1d1d,#f97316)">
        <h1 style="font-size:1.25rem">😡 Master the moment</h1>
        <p>Anger is normal. Reacting on it isn't the only option. Build the skill to pause and choose your response.</p>
      </div>
      ${a ? `<div class="callout info" style="margin-bottom:12px">Your anger self-assessment: <strong>${a.score}% · ${esc(a.band)}</strong>. <a href="#/assess/anger" style="text-decoration:underline;font-weight:700">Retake</a></div>`
          : `<a class="btn primary" href="#/assess/anger" style="margin-bottom:14px">Take the anger self-assessment</a>`}
      ${sectionH('Your anger toolkit')}
      ${rows(TOOLKITS.anger)}
      ${sectionH('The skill in one line')}
      <div class="card center">
        <div style="display:flex;justify-content:space-between;gap:6px;text-align:center;font-weight:700">
          <div>🛑<div style="font-size:.72rem">STOP</div></div><div style="align-self:center">›</div>
          <div>⏸️<div style="font-size:.72rem">PAUSE</div></div><div style="align-self:center">›</div>
          <div>🤔<div style="font-size:.72rem">REFLECT</div></div><div style="align-self:center">›</div>
          <div>💬<div style="font-size:.72rem">RESPOND</div></div>
        </div>
        <a class="btn" style="margin-top:14px" href="#/anger/scenario">Practise with a workplace scenario ›</a>
      </div>
      ${crisisNote()}
      <div class="fab-space"></div>`,
  };
}

/* ---- Anger diary ---- */
function diary() {
  const entries = store.get().angerDiary;
  return {
    html: html`
      ${appbar('Anger diary', 'Notice the pattern, change the response')}
      <div class="card">
        <label class="field"><span>What triggered it?</span><input id="trigger" placeholder="e.g. My supervisor criticised my work"/></label>
        <label class="field"><span>What did your body do?</span><input id="body" placeholder="e.g. Clenched jaw, racing heart"/></label>
        <label class="field"><span>Intensity</span>
          <div class="range-wrap"><input type="range" id="intensity" min="0" max="10" value="5"/><output id="io">5</output></div></label>
        <label class="field"><span>How did you respond?</span><input id="response" placeholder="e.g. Snapped back / walked away"/></label>
        <label class="field"><span>What could you try next time?</span><textarea id="note" placeholder="A calmer response…"></textarea></label>
        <button class="btn primary" id="save">Save entry</button>
      </div>
      <div id="list">${listEntries(entries)}</div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const io = root.querySelector('#io');
      root.querySelector('#intensity').addEventListener('input', e => io.textContent = e.target.value);
      root.querySelector('#save').addEventListener('click', () => {
        const trigger = root.querySelector('#trigger').value.trim();
        if (!trigger) return toast('Add a trigger first');
        store.push('angerDiary', {
          ts: now(), trigger,
          body: root.querySelector('#body').value.trim(),
          intensity: +root.querySelector('#intensity').value,
          response: root.querySelector('#response').value.trim(),
          note: root.querySelector('#note').value.trim(),
        });
        root.querySelectorAll('input,textarea').forEach(i => { if (i.type !== 'range') i.value = ''; });
        root.querySelector('#intensity').value = 5; io.textContent = '5';
        root.querySelector('#list').innerHTML = listEntries(store.get().angerDiary);
        toast('Entry saved privately');
      });
    },
  };
}
function listEntries(entries) {
  if (!entries.length) return `<div class="empty"><div class="e">📓</div><p>No entries yet — start noticing your triggers.</p></div>`;
  return entries.map(e => html`
    <div class="card tight">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${esc(e.trigger)}</strong><span class="stat-pill ${e.intensity >= 7 ? 'r' : e.intensity >= 4 ? 'o' : 'y'}">${e.intensity}/10</span>
      </div>
      <small>${fmtDateTime(e.ts)}</small>
      ${e.body ? `<p style="margin:6px 0 0"><span class="muted">Body:</span> ${esc(e.body)}</p>` : ''}
      ${e.response ? `<p style="margin:2px 0 0"><span class="muted">Response:</span> ${esc(e.response)}</p>` : ''}
      ${e.note ? `<p style="margin:2px 0 0"><span class="muted">Next time:</span> ${esc(e.note)}</p>` : ''}
    </div>`).join('');
}

/* ---- Trigger identification ---- */
function triggers() {
  const common = ['Being criticised', 'Feeling disrespected', 'Unfair treatment', 'Interruptions', 'Heavy workload', 'Being ignored', 'Broken promises', 'Micromanagement', 'Blame', 'Technology failing', 'Traffic / lateness', 'Money pressure'];
  const saved = store.get().toolkit.angerTriggers || [];
  return {
    html: html`
      ${appbar('Trigger identification', 'Name it to tame it')}
      <div class="card"><p class="muted">Tap the situations that tend to set off your anger. Knowing your triggers gives you a head start.</p>
        <div class="chips" id="chips">${common.map(t => `<button class="chip ${saved.includes(t) ? 'on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      </div>
      <div class="card"><h3>Your top triggers</h3><div id="mine" class="tag-row"></div>
        <a class="btn" style="margin-top:12px" href="#/anger/scenario">Practise responding ›</a></div>`,
    onMount(root) {
      const paint = () => { const cur = store.get().toolkit.angerTriggers || []; root.querySelector('#mine').innerHTML = cur.length ? cur.map(t => `<span class="chip on">${esc(t)}</span>`).join('') : '<span class="muted">None selected yet</span>'; };
      paint();
      root.querySelectorAll('#chips .chip').forEach(c => c.addEventListener('click', () => {
        const t = c.dataset.t;
        store.update(s => { const arr = s.toolkit.angerTriggers = s.toolkit.angerTriggers || []; const i = arr.indexOf(t); i >= 0 ? arr.splice(i, 1) : arr.push(t); });
        c.classList.toggle('on'); paint();
      }));
    },
  };
}

/* ---- Scenario coach ---- */
function scenario() {
  const scenarios = [
    { s: 'My supervisor criticised my work in front of the team.', better: 'Thank them for the feedback, ask for specifics privately, and give yourself a night before responding.' },
    { s: 'A colleague took credit for my idea.', better: 'Calmly name it: "I\'d like to clarify — that idea came from our earlier discussion." Facts, not attack.' },
    { s: 'I was blamed for a delay that wasn\'t my fault.', better: 'Pause, breathe, then present the timeline factually and propose a fix rather than defending.' },
  ];
  return {
    html: html`
      ${appbar('Workplace scenario', 'STOP · PAUSE · REFLECT · RESPOND')}
      <div id="sc"></div>`,
    onMount(root) {
      let idx = 0;
      const render = () => {
        const sc = scenarios[idx];
        root.querySelector('#sc').innerHTML = html`
          <div class="card"><h3>Situation</h3><p style="font-weight:600">"${esc(sc.s)}"</p></div>
          <div class="card">
            <div class="journey">
              <div class="jstep done"><div class="jw">Stop</div><div class="jd">Notice the heat rising. Don't act yet.</div></div>
              <div class="jstep done"><div class="jw">Pause</div><div class="jd">One slow breath. Unclench your jaw and hands.</div></div>
              <div class="jstep done"><div class="jw">Reflect</div><div class="jd">What do I actually want here? What matters tomorrow?</div></div>
              <div class="jstep done"><div class="jw">Respond</div><div class="jd">${esc(sc.better)}</div></div>
            </div>
            <div class="btnrow">
              <a class="btn" href="#/tool/breathe?ctx=anger">Breathe first</a>
              <button class="btn primary" id="next">Next scenario</button>
            </div>
          </div>`;
        root.querySelector('#next').addEventListener('click', () => { idx = (idx + 1) % scenarios.length; render(); });
      };
      render();
    },
  };
}

/* ---- Assertive communication ---- */
function assertive() {
  return {
    html: html`
      ${appbar('Assertive communication', 'Firm, not fierce')}
      <div class="card"><h3>The "I" formula</h3>
        <p class="muted">Swap blame ("You always…") for ownership ("I feel…"). It lowers defences and gets heard.</p>
        <ul class="bul">
          <li><strong>When</strong> … (the specific behaviour, no exaggeration)</li>
          <li><strong>I feel</strong> … (your emotion)</li>
          <li><strong>Because</strong> … (the impact on you)</li>
          <li><strong>I'd like</strong> … (a clear, doable request)</li>
        </ul>
      </div>
      <div class="card"><h3>Build your statement</h3>
        <label class="field"><span>When…</span><input id="w" placeholder="you changed the deadline without telling me"/></label>
        <label class="field"><span>I feel…</span><input id="f" placeholder="frustrated"/></label>
        <label class="field"><span>Because…</span><input id="b" placeholder="I had already planned my week"/></label>
        <label class="field"><span>I'd like…</span><input id="l" placeholder="us to agree changes together in future"/></label>
        <button class="btn primary" id="make">Build it</button>
        <div id="out"></div>
      </div>`,
    onMount(root) {
      root.querySelector('#make').addEventListener('click', () => {
        const w = root.querySelector('#w').value.trim(), f = root.querySelector('#f').value.trim(),
          b = root.querySelector('#b').value.trim(), l = root.querySelector('#l').value.trim();
        root.querySelector('#out').innerHTML = html`<div class="callout info" style="margin-top:12px">
          "When ${esc(w || '…')}, I feel ${esc(f || '…')}, because ${esc(b || '…')}. I'd like ${esc(l || '…')}."</div>`;
        toast('Practise saying it out loud');
      });
    },
  };
}

export const angerRoutes = {
  '/anger': hub,
  '/anger/diary': diary,
  '/anger/triggers': triggers,
  '/anger/scenario': scenario,
  '/anger/assertive': assertive,
};
