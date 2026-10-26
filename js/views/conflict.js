/* ===========================================================
   views/conflict.js — Conflict Resolution & Management 🤝
   Workplace friction, without carrying it home.
   =========================================================== */
import { store, now, fmtDateTime } from '../store.js';
import { html, esc, toast, appbar, sectionH, rows, crisisNote } from '../ui.js';
import { TOOLKITS } from '../data.js';

const STYLES = [
  { id: 'Competing', ico: '🦈', when: 'You need a fast, firm decision', cost: 'People stop telling you things' },
  { id: 'Accommodating', ico: '🐻', when: 'The relationship matters more than the point', cost: 'Resentment builds quietly' },
  { id: 'Avoiding', ico: '🐢', when: 'Tempers are too hot to be useful today', cost: 'The issue comes back bigger' },
  { id: 'Compromising', ico: '🦊', when: 'You need workable and both sides give something', cost: 'Nobody is fully satisfied' },
  { id: 'Collaborating', ico: '🦉', when: 'The stakes are high for both of you', cost: 'It takes real time' },
];
const OUTCOMES = ['Resolved', 'Partly resolved', 'Agreed to disagree', 'Escalated', 'Avoided', 'Still waiting'];

function hub() {
  const a = store.get().assessments.conflict;
  const logged = store.get().conflictLog;
  return {
    html: html`
      ${appbar('Conflict Resolution', 'Sort it out, don\'t carry it')}
      <div class="hero" style="background:linear-gradient(140deg,#78350f,#dc2626)">
        <h1 style="font-size:1.25rem">🤝 Conflict is information</h1>
        <p>Around most disagreement there is an unmet need — yours or theirs. The skill is getting the need on the table without a fight.</p>
      </div>
      ${a ? `<div class="callout ${a.score >= 61 ? 'warn' : 'info'}" style="margin-bottom:12px">Conflict check: <strong>${a.score}% · ${esc(a.band)}</strong>. <a href="#/assess/conflict" style="text-decoration:underline;font-weight:700">Retake</a></div>`
          : `<a class="btn primary" href="#/assess/conflict" style="margin-bottom:14px">Take the conflict style &amp; load check</a>`}
      ${sectionH('Your conflict toolkit')}
      ${rows(TOOLKITS.conflict)}
      ${sectionH('The order that works most of the time')}
      <div class="card"><div class="journey">
        <div class="jstep done"><div class="jw">Separate</div><div class="jd">Write the bare facts on one side, your feeling on the other. Most rows are about the feeling being read as an accusation.</div></div>
        <div class="jstep done"><div class="jw">Ask</div><div class="jd">"Help me understand your side." Then actually listen for one need you did not expect.</div></div>
        <div class="jstep done"><div class="jw">Name the shared goal</div><div class="jd">The delivery, the client, the team's peace. You are usually on the same side of it.</div></div>
        <div class="jstep done"><div class="jw">Agree one step</div><div class="jd">Specific, small, dated, written down. Then follow up once.</div></div>
      </div></div>
      <div class="card"><h3>Logging matters</h3>
        <p class="muted">${logged.length ? `${logged.length} incident${logged.length === 1 ? '' : 's'} recorded on this device.` : 'A dated record turns "this always happens" into evidence — useful for HR, mediation, or simply seeing your own pattern.'}</p>
        <a class="btn" href="#/conflict/log">Open my conflict log ›</a></div>
      <div class="callout warn" style="margin-bottom:14px"><strong>Not a conflict?</strong> Bullying, harassment, discrimination or threats are not something you have to "communicate better" about.
        <a href="#/workplace/report" style="text-decoration:underline;font-weight:700">Report it anonymously ›</a></div>
      ${crisisNote()}
      <div class="fab-space"></div>`,
  };
}

/* ---------- Conflict style self-map ---------- */
function style() {
  const saved = store.get().toolkit.conflictStyle || [];
  return {
    html: html`
      ${appbar('Your conflict style', 'There is no wrong answer')}
      <div class="card"><p class="muted">Tap the way you usually react under pressure — the instinct, not the ideal. Most people have one default and one stress response.</p>
        <div class="chips" id="chips">${STYLES.map(s => `<button class="chip ${saved.includes(s.id) ? 'on' : ''}" data-id="${s.id}">${s.ico} ${esc(s.id)}</button>`).join('')}</div>
      </div>
      <div id="readout"></div>
      <div class="btnrow">
        <a class="btn" href="#/anger/assertive">Assertive script</a>
        <a class="btn primary" href="#/conflict/prepare">Prepare my conversation</a>
      </div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const paint = () => {
        const cur = store.get().toolkit.conflictStyle || [];
        root.querySelector('#readout').innerHTML = cur.length ? cur.map(id => {
          const s = STYLES.find(x => x.id === id);
          return html`<div class="card"><h3>${s.ico} ${esc(s.id)}</h3>
            <p style="margin:0"><span class="muted">Use it well when:</span> ${esc(s.when)}</p>
            <p style="margin:6px 0 0"><span class="muted">Its cost:</span> ${esc(s.cost)}</p></div>`;
        }).join('') : '<div class="card"><p class="muted" style="margin:0">Nothing selected yet — pick at least one above.</p></div>';
      };
      paint();
      root.querySelectorAll('#chips .chip').forEach(c => c.addEventListener('click', () => {
        const id = c.dataset.id;
        store.update(s => { const arr = s.toolkit.conflictStyle = s.toolkit.conflictStyle || []; const i = arr.indexOf(id); i >= 0 ? arr.splice(i, 1) : arr.push(id); });
        c.classList.toggle('on'); paint();
      }));
    },
  };
}

/* ---------- Conversation prep builder ---------- */
function prepare() {
  const p = store.get().toolkit.conflictPrep || {};
  return {
    html: html`
      ${appbar('Prepare the hard conversation', 'Six boxes, then a script')}
      <div class="card">
        <label class="field"><span>1 · The facts only (no adjectives)</span><input id="facts" value="${esc(p.facts || '')}" placeholder="e.g. The report was handed in two days late, twice"/></label>
        <label class="field"><span>2 · What it cost me or the work</span><input id="impact" value="${esc(p.impact || '')}" placeholder="e.g. I rebuilt the deck overnight and missed my own deadline"/></label>
        <label class="field"><span>3 · A fair reason they might have</span><input id="theirs" value="${esc(p.theirs || '')}" placeholder="e.g. They were covering for someone who left"/></label>
        <label class="field"><span>4 · What I actually want</span><input id="want" value="${esc(p.want || '')}" placeholder="e.g. A heads-up before it lands on me"/></label>
        <label class="field"><span>5 · My one doable request</span><input id="ask" value="${esc(p.ask || '')}" placeholder="e.g. Flag delays the same day, in writing"/></label>
        <label class="field"><span>6 · When and where I'll raise it</span><input id="when" value="${esc(p.when || '')}" placeholder="e.g. Tuesday, 10am, the small meeting room"/></label>
        <div class="btnrow">
          <button class="btn primary" id="build">Build my script</button>
          <button class="btn" id="clear">Clear</button>
        </div>
      </div>
      <div id="script"></div>
      <div class="card"><h3>How to open it</h3>
        <div class="callout info">"Can I have ten minutes about <em>the situation</em>? I think we see it differently, and I'd rather sort it with you than about you."</div>
        <ul class="bul">
          <li>Say it early, privately, and in person or on a call — never in a group chat</li>
          <li>One issue per conversation. Do not bring up last year</li>
          <li>If they get defensive, slow down and ask their side again</li>
          <li>End with what was agreed, in writing, same day</li>
        </ul>
      </div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const show = () => {
        const v = store.get().toolkit.conflictPrep || {};
        if (!v.facts) { root.querySelector('#script').innerHTML = ''; return; }
        root.querySelector('#script').innerHTML = html`
          <div class="card" style="border-color:var(--brand)"><h3>🗣️ Your script</h3>
            <p style="font-size:1.02rem;line-height:1.7">"When <strong>${esc(v.facts)}</strong>, it affected me because <strong>${esc(v.impact || '…')}</strong>. I imagine <strong>${esc(v.theirs || 'there was a reason I don\'t know yet')}</strong>, and I want to hear that.<br/><br/>
            What I need is <strong>${esc(v.want || '…')}</strong>. So my ask is: <strong>${esc(v.ask || '…')}</strong>. Does that feel workable?"</p>
            ${v.when ? `<p class="muted" style="margin-top:8px">Raise it: ${esc(v.when)}</p>` : ''}
            <div class="btnrow" style="margin-top:12px">
              <a class="btn" href="#/tool/breathe?ctx=conflict">Steady first</a>
              <button class="btn primary" id="done">I'm ready</button>
            </div></div>`;
        const d = root.querySelector('#done');
        d && d.addEventListener('click', () => { toast('Good luck. Log how it went.'); location.hash = '#/conflict/log'; });
      };
      show();
      root.querySelector('#build').addEventListener('click', () => {
        const get = id => root.querySelector('#' + id).value.trim();
        if (!get('facts')) return toast('Start with the bare facts');
        store.update(s => { s.toolkit.conflictPrep = { facts: get('facts'), impact: get('impact'), theirs: get('theirs'), want: get('want'), ask: get('ask'), when: get('when') }; });
        show(); toast('Script built — read it out loud once');
      });
      root.querySelector('#clear').addEventListener('click', () => {
        store.update(s => { delete s.toolkit.conflictPrep; });
        root.querySelectorAll('input').forEach(i => i.value = '');
        root.querySelector('#script').innerHTML = '';
      });
    },
  };
}

/* ---------- Incident log ---------- */
function log() {
  const list = store.get().conflictLog;
  return {
    html: html`
      ${appbar('Conflict log', 'Dated, factual, on your device')}
      <div class="callout info" style="margin-bottom:12px">Record the <strong>role</strong>, not the name, if that feels safer. Nothing here leaves your phone.</div>
      <div class="card">
        <label class="field"><span>Who (role, not name)</span><input id="with" placeholder="e.g. My supervisor / a peer in finance"/></label>
        <label class="field"><span>What happened</span><input id="issue" placeholder="e.g. Disagreed on priorities in the stand-up"/></label>
        <label class="field"><span>How I handled it</span>
          <select id="approach">${STYLES.map(s => `<option>${esc(s.id)}</option>`).join('')}<option>Direct &amp; calm</option><option>Walked away</option></select></label>
        <label class="field"><span>Outcome</span>
          <select id="outcome">${OUTCOMES.map(o => `<option>${esc(o)}</option>`).join('')}</select></label>
        <label class="field"><span>What would work better next time</span><textarea id="note" placeholder="One sentence…"></textarea></label>
        <button class="btn primary" id="save">Save entry</button>
      </div>
      <div id="list">${listEntries(list)}</div>
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelector('#save').addEventListener('click', () => {
        const issue = root.querySelector('#issue').value.trim();
        if (!issue) return toast('Describe what happened first');
        store.push('conflictLog', {
          ts: now(), issue,
          with: root.querySelector('#with').value.trim(),
          approach: root.querySelector('#approach').value,
          outcome: root.querySelector('#outcome').value,
          note: root.querySelector('#note').value.trim(),
        });
        root.querySelectorAll('input,textarea').forEach(i => i.value = '');
        root.querySelector('#list').innerHTML = listEntries(store.get().conflictLog);
        toast('Entry saved privately');
      });
    },
  };
}
function listEntries(list) {
  if (!list.length) return `<div class="empty"><div class="e">📓</div><p>No entries yet.</p></div>`;
  const good = o => /Resolved/i.test(o);
  const mid = o => /Partly|Agreed|waiting/i.test(o);
  return list.map(e => html`
    <div class="card tight">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <strong>${esc(e.issue)}</strong><span class="stat-pill ${good(e.outcome) ? 'g' : mid(e.outcome) ? 'y' : 'o'}">${esc(e.outcome)}</span>
      </div>
      <small>${fmtDateTime(e.ts)}${e.with ? ' · ' + esc(e.with) : ''} · ${esc(e.approach)}</small>
      ${e.note ? `<p style="margin:6px 0 0"><span class="muted">Next time:</span> ${esc(e.note)}</p>` : ''}
    </div>`).join('');
}

/* ---------- Escalation ladder ---------- */
function escalate() {
  return {
    html: html`
      ${appbar('Escalation ladder', 'Know your next rung')}
      <div class="card"><p class="muted">Work up the rungs. Each step is reasonable. Skip to step 4 immediately if it involves threats, harassment, discrimination or anything illegal.</p>
        <div class="journey">
          <div class="jstep done"><div class="jw">1 · Name it to yourself</div><div class="jd">Write the facts and the cost. Decide whether it is worth raising at all — some things are not.</div></div>
          <div class="jstep done"><div class="jw">2 · Raise it directly</div><div class="jd">Private, early, calm. Use your prepared script and agree one next step.</div></div>
          <div class="jstep done"><div class="jw">3 · Put it in writing</div><div class="jd">Short, factual email to the person: "As we agreed today…". Gives you both a record and removes memory disputes.</div></div>
          <div class="jstep done"><div class="jw">4 · Bring in your manager</div><div class="jd">Frame it as a work problem: impact on delivery, not personalities. Ask specifically what you want them to do.</div></div>
          <div class="jstep done"><div class="jw">5 · HR, EAP or mediation</div><div class="jd">A neutral third party is often the cheapest fix. Mediation is confidential and works even when a row has gone on for months.</div></div>
          <div class="jstep done"><div class="jw">6 · Formal or anonymous report</div><div class="jd">For bullying, harassment or safety. Use the anonymous channel, keep your own dated copy, and know your organisation's retaliation policy.</div></div>
          <div class="jstep done"><div class="jw">7 · Protect yourself</div><div class="jd">If nothing changes, decide on your own limits — reduced contact, transfer, or exit. That is a strategy, not a defeat.</div></div>
        </div>
      </div>
      <div class="btnrow">
        <a class="btn" href="#/workplace/report">🕵️ Report anonymously</a>
        <a class="btn primary" href="#/counselling?cat=Workplace%20conflict">💬 Talk it through first</a>
      </div>
      <div class="fab-space"></div>`,
  };
}

export const conflictRoutes = {
  '/conflict': hub,
  '/conflict/style': style,
  '/conflict/prepare': prepare,
  '/conflict/log': log,
  '/conflict/escalate': escalate,
};
