/* ===========================================================
   views/chronic.js — Living with Chronic Illness 🩺
   Diabetes, hypertension, asthma, sickle cell, endometriosis,
   autoimmune conditions, HIV, epilepsy, chronic pain, and more.
   =========================================================== */
import { store, now, uid, fmtDate } from '../store.js';
import { html, esc, toast, appbar, sectionH, rows, crisisNote, refresh } from '../ui.js';
import { TOOLKITS } from '../data.js';

const FLARES = ['Fatigue', 'Pain', 'Brain fog', 'Nausea', 'Dizziness', 'Breathlessness', 'Mobility', 'Sleep', 'Appetite', 'Low mood', 'Anxiety', 'Flare'];
const QUESTIONS = [
  'What is causing this change in how I feel?',
  'Which of my medicines could be doing this?',
  'What should I be watching for at home?',
  'When do I need to come back, or come in urgently?',
  'What can I realistically do about work?',
  'Do I need a referral, a test, or a letter?',
  'What else can I do myself — diet, sleep, exercise, stress?',
  'Who do I call between appointments?',
];
const dayKey = () => new Date().toISOString().slice(0, 10);

function hub() {
  const a = store.get().assessments.chronic;
  const log = store.get().symptoms;
  const meds = store.get().meds;
  return {
    html: html`
      ${appbar('Chronic Illness', 'Living well with a long-term condition')}
      <div class="hero" style="background:linear-gradient(140deg,#0c4a6e,#0d9488)">
        <h1 style="font-size:1.25rem">🩺 More than your diagnosis</h1>
        <p>A condition you manage every day is a job as well as a health issue. This centre handles the second part: energy, appointments, medicines, work and the feelings nobody asks about.</p>
      </div>
      ${a ? `<div class="callout ${a.score >= 61 ? 'warn' : 'info'}" style="margin-bottom:12px">Illness-load check: <strong>${a.score}% · ${esc(a.band)}</strong>. <a href="#/assess/chronic" style="text-decoration:underline;font-weight:700">Retake</a></div>`
          : `<a class="btn primary" href="#/assess/chronic" style="margin-bottom:14px">Take the chronic-condition load check</a>`}
      ${sectionH('Your daily tools')}
      ${rows(TOOLKITS.chronic)}
      ${sectionH('Where you are this week')}
      <div class="card">
        <div class="kpi">
          <div class="k"><div class="n">${log.length}</div><div class="l">days logged</div></div>
          <div class="k"><div class="n">${meds.length}</div><div class="l">medicines</div></div>
          <div class="k"><div class="n">${log.length ? Math.round(log.slice(0, 7).reduce((s, e) => s + e.severity, 0) / log.slice(0, 7).length) : '—'}</div><div class="l">avg severity (7d)</div></div>
        </div>
        <p class="muted" style="margin-top:12px">Patterns are the point. Two weeks of entries tells you — and your clinic — more than one very good memory.</p>
      </div>
      <div class="card"><h3>The part nobody asks about</h3>
        <ul class="bul">
          <li>Grieving the version of yourself that did not need planning</li>
          <li>Cancelling things you love, then apologising for it constantly</li>
          <li>Fear of being seen as weak or unreliable at work</li>
          <li>The cost: clinic, medicine, transport, tests — paid every month</li>
          <li>Everyone having an opinion about your body</li>
        </ul>
        <p class="muted">All of that is a real load, and it responds to support. Counselling is not only for crisis.</p>
        <a class="btn" style="margin-top:6px" href="#/counselling?cat=Chronic%20illness%20%26%20disability">Talk to someone who gets it ›</a>
      </div>
      <div class="callout warn" style="margin-bottom:14px"><strong>This is self-help, not clinical advice.</strong> Keep taking what your clinic prescribes, and go to the nearest facility for new, severe or worsening symptoms.</div>
      ${crisisNote()}
      <div class="fab-space"></div>`,
  };
}

/* ---------- Symptom & flare log ---------- */
function symptoms() {
  const list = store.get().symptoms;
  return {
    html: html`
      ${appbar('Symptom log', 'Ten seconds, once a day')}
      <div class="card">
        <label class="field"><span>How bad has today been?</span>
          <div class="range-wrap"><input type="range" id="sev" min="0" max="10" value="5"/><output id="so">5</output></div></label>
        <label class="field"><span>Energy left</span>
          <div class="range-wrap"><input type="range" id="energy" min="0" max="10" value="5"/><output id="eo">5</output></div></label>
        <label class="field"><span>Sleep last night</span>
          <div class="range-wrap"><input type="range" id="sleep" min="0" max="10" value="5"/><output id="lo">5</output></div></label>
        <div class="field"><span style="display:block;margin-bottom:6px">What showed up today?</span>
          <div class="chips" id="flares">${FLARES.map(f => `<button type="button" class="chip" data-f="${esc(f)}">${esc(f)}</button>`).join('')}</div></div>
        <label class="field"><span>Did you take everything prescribed?</span>
          <select id="medsTaken"><option>Yes, all of it</option><option>Most of it</option><option>Missed doses</option><option>Couldn\'t get the medicine</option></select></label>
        <label class="field"><span>Anything worth remembering</span><textarea id="note" placeholder="e.g. Worse after the night shift; ran out of the inhaler"></textarea></label>
        <button class="btn primary" id="save">Save today</button>
      </div>
      <div id="list">${listEntries(list)}</div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const pair = [['#sev', '#so'], ['#energy', '#eo'], ['#sleep', '#lo']];
      pair.forEach(([i, o]) => root.querySelector(i).addEventListener('input', e => root.querySelector(o).textContent = e.target.value));
      root.querySelectorAll('#flares .chip').forEach(c => c.addEventListener('click', () => c.classList.toggle('on')));
      root.querySelector('#save').addEventListener('click', () => {
        const g = id => root.querySelector(id).value;
        store.push('symptoms', {
          ts: now(), severity: +g('#sev'), energy: +g('#energy'), sleep: +g('#sleep'),
          flares: [...root.querySelectorAll('#flares .chip.on')].map(c => c.dataset.f),
          meds: g('#medsTaken'), note: g('#note').trim(),
        });
        ['#sev', '#energy', '#sleep'].forEach(i => { root.querySelector(i).value = 5; });
        ['#so', '#eo', '#lo'].forEach(o => root.querySelector(o).textContent = '5');
        root.querySelectorAll('#flares .chip').forEach(c => c.classList.remove('on'));
        root.querySelector('#note').value = '';
        root.querySelector('#list').innerHTML = listEntries(store.get().symptoms);
        toast('Logged privately');
      });
    },
  };
}
function listEntries(list) {
  if (!list.length) return `<div class="empty"><div class="e">📓</div><p>Nothing logged yet. Do it once tonight — it takes ten seconds.</p></div>`;
  return list.map(e => html`
    <div class="card tight">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${esc(fmtDate(e.ts))}</strong><span class="stat-pill ${e.severity >= 8 ? 'r' : e.severity >= 5 ? 'o' : 'g'}">${e.severity}/10</span>
      </div>
      <small>Energy ${e.energy}/10 · Sleep ${e.sleep}/10 · ${esc(e.meds)}</small>
      ${e.flares && e.flares.length ? `<div class="tag-row" style="margin-top:8px">${e.flares.map(f => `<span class="chip">${esc(f)}</span>`).join('')}</div>` : ''}
      ${e.note ? `<p style="margin:6px 0 0">${esc(e.note)}</p>` : ''}
    </div>`).join('');
}

/* ---------- Medication tracker ---------- */
function meds() {
  const list = store.get().meds;
  const taken = (store.get().toolkit.medsTaken || {})[dayKey()] || {};
  return {
    html: html`
      ${appbar('Medication tracker', 'What you take, and today\'s doses')}
      <div class="card"><h3>Add a medicine</h3>
        <label class="field"><span>Name</span><input id="name" placeholder="e.g. Metformin"/></label>
        <label class="field"><span>Dose</span><input id="dose" placeholder="e.g. 500mg"/></label>
        <label class="field"><span>How often</span>
          <select id="freq"><option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>As needed</option><option>Weekly / monthly</option></select></label>
        <button class="btn primary" id="add">Add to my list</button>
      </div>
      ${list.length ? `<div class="card"><h3>Today</h3><div class="list" id="rows">
        ${list.map(m => html`
          <div class="row">
            <button class="btn sm ${taken[m.id] ? 'primary' : 'ghost'}" data-id="${m.id}" style="min-width:44px">${taken[m.id] ? '✔' : '○'}</button>
            <span class="rt"><span class="rtl">${esc(m.name)} ${esc(m.dose)}</span><span class="rd">${esc(m.freq)}</span></span>
            <button class="btn sm ghost" data-del="${m.id}" aria-label="Remove" style="color:var(--rose-500)">✕</button>
          </div>`).join('')}
      </div>
      <p class="muted" style="margin-top:10px">The ticks reset every morning. Take the list with you to clinic — it saves time and mistakes.</p></div>`
      : `<div class="empty"><div class="e">💊</div><p>No medicines added. Add what you take daily.</p></div>`}
      <div class="card"><h3>Getting this right</h3>
        <ul class="bul">
          <li>Tie doses to something you already do — brushing teeth, the 7pm news, the commute</li>
          <li>Refill before you run out, not on the day; clinic queues are a common reason for missed doses</li>
          <li>Never stop a prescribed medicine because you feel fine — ask the clinic first</li>
          <li>Side effects are a conversation, not a reason to quit quietly</li>
        </ul>
      </div>
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelector('#add').addEventListener('click', () => {
        const name = root.querySelector('#name').value.trim();
        if (!name) return toast('Add the medicine name');
        store.update(s => { s.meds = [{ id: uid(), name, dose: root.querySelector('#dose').value.trim(), freq: root.querySelector('#freq').value }, ...(s.meds || [])]; });
        toast('Added'); refresh();
      });
      root.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.id;
        store.update(s => {
          const day = s.toolkit.medsTaken = s.toolkit.medsTaken || {};
          const t = day[dayKey()] = day[dayKey()] || {};
          t[id] = !t[id];
        });
        const on = ((store.get().toolkit.medsTaken || {})[dayKey()] || {})[id];
        b.textContent = on ? '✔' : '○';
        b.classList.toggle('primary', !!on); b.classList.toggle('ghost', !on);
      }));
      root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.del;
        store.update(s => { s.meds = (s.meds || []).filter(m => m.id !== id); });
        toast('Removed'); refresh();
      }));
    },
  };
}

/* ---------- Energy pacing ---------- */
function pacing() {
  const plan = store.get().toolkit.pacingPlan;
  const today = dayKey();
  const fresh = plan && plan.date === today;
  return {
    html: html`
      ${appbar('Energy pacing', 'Plan the day you actually have')}
      <div class="card"><h3>How much energy do you have today?</h3>
        <div class="range-wrap"><input type="range" id="budget" min="0" max="10" value="${fresh ? plan.budget : 5}"/><output id="bo">${fresh ? plan.budget : 5}</output></div>
        <p class="muted" id="advice" style="margin-top:10px"></p>
      </div>
      <div class="card">
        <label class="field"><span>The one thing that must happen</span><input id="must" value="${esc(fresh ? plan.must : '')}" placeholder="Only one. Choose it well."/></label>
        <label class="field"><span>Nice to do, if the day holds</span><input id="could" value="${esc(fresh ? plan.could : '')}" placeholder="Two at most"/></label>
        <label class="field"><span>What I am deliberately postponing</span><input id="drop" value="${esc(fresh ? plan.drop : '')}" placeholder="Permission granted. Write it down so it stops nagging."/></label>
        <label class="field"><span>My rest anchor</span><input id="rest" value="${esc(fresh ? plan.rest : '')}" placeholder="e.g. 20 quiet minutes after lunch, no screen"/></label>
        <button class="btn primary" id="save">Save today's plan</button>
      </div>
      ${fresh ? `<div class="card" style="border-color:var(--brand)"><h3>Today, written down</h3>
        <p style="margin:0"><strong>Must:</strong> ${esc(plan.must || '—')}</p>
        <p style="margin:4px 0 0"><strong>Could:</strong> ${esc(plan.could || '—')}</p>
        <p style="margin:4px 0 0"><strong>Postponed on purpose:</strong> ${esc(plan.drop || '—')}</p>
        <p style="margin:4px 0 0"><strong>Rest:</strong> ${esc(plan.rest || '—')}</p>
        <div class="divider"></div>
        <p class="muted" style="margin:0">If you crash before the end of the day, the plan was too big — not you.</p></div>` : ''}
      <div class="card"><h3>The boom-and-bust trap</h3>
        <p class="muted">Good days tempt you to catch up on everything. That is usually how the next bad week is bought. Take about 80% of what you think you can do on a good day, and bank the rest.</p>
        <div class="btnrow" style="margin-top:10px">
          <a class="btn" href="#/stress/boundaries">Boundaries</a>
          <a class="btn primary" href="#/chronic/disclose">Explaining it at work</a>
        </div>
      </div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const advice = root.querySelector('#advice');
      const paint = v => {
        advice.textContent = v <= 3 ? 'Survival day: one small must-do, rest anchored, and nothing added later as a "bonus".'
          : v <= 6 ? 'Standard day: one must-do, two could-dos, rest still scheduled.'
          : 'Good day: do the must-do and one could-do — and deliberately hold some back for tomorrow.';
      };
      const r = root.querySelector('#budget');
      paint(+r.value);
      r.addEventListener('input', e => { root.querySelector('#bo').textContent = e.target.value; paint(+e.target.value); });
      root.querySelector('#save').addEventListener('click', () => {
        const g = id => root.querySelector('#' + id).value.trim();
        if (!g('must')) return toast('Pick the one thing that must happen');
        store.update(s => { s.toolkit.pacingPlan = { date: dayKey(), budget: +r.value, must: g('must'), could: g('could'), drop: g('drop'), rest: g('rest') }; });
        toast('Plan saved for today'); refresh();
      });
    },
  };
}

/* ---------- Appointment prep ---------- */
function appointment() {
  const asked = store.get().toolkit.clinicQuestions || [];
  const notes = store.get().toolkit.clinicNotes || '';
  return {
    html: html`
      ${appbar('Appointment prep', 'Clinic time is short. Use it.')}
      <div class="card"><p class="muted">Tap what you want answered this visit. Print or screenshot the list before you go in.</p>
        <div class="chips" id="qs">${QUESTIONS.map(q => `<button class="chip ${asked.includes(q) ? 'on' : ''}" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      </div>
      <div class="card"><h3>What to bring</h3>
        <ul class="bul">
          <li>Your medicine list (from the tracker on this app)</li>
          <li>The last seven days of your symptom log</li>
          <li>Your numbers, if you measure them at home</li>
          <li>One sentence: "The thing I most want to change is…"</li>
        </ul>
        <label class="field"><span>The thing I most want to change</span><textarea id="notes" placeholder="e.g. I cannot get through a full work week without two crash days.">${esc(notes)}</textarea></label>
        <button class="btn primary" id="save">Save my prep</button>
      </div>
      ${asked.length ? `<div class="card"><h3>My questions</h3><ul class="bul">${asked.map(q => `<li>${esc(q)}</li>`).join('')}</ul></div>` : ''}
      <div class="btnrow"><a class="btn" href="#/chronic/symptoms">Open my symptom log</a><a class="btn" href="#/chronic/meds">Medicine list</a></div>
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelectorAll('#qs .chip').forEach(c => c.addEventListener('click', () => {
        const q = c.dataset.q;
        store.update(s => { const arr = s.toolkit.clinicQuestions = s.toolkit.clinicQuestions || []; const i = arr.indexOf(q); i >= 0 ? arr.splice(i, 1) : arr.push(q); });
        c.classList.toggle('on');
      }));
      root.querySelector('#save').addEventListener('click', () => {
        store.update(s => { s.toolkit.clinicNotes = root.querySelector('#notes').value.trim(); });
        toast('Saved on this device');
      });
    },
  };
}

/* ---------- Telling work ---------- */
function disclose() {
  const d = store.get().toolkit.workDisclosure || {};
  return {
    html: html`
      ${appbar('Explaining it at work', 'You choose how much they know')}
      <div class="callout info" style="margin-bottom:12px">You are generally not obliged to give a diagnosis. What unblocks things is the <strong>impact and the adjustment</strong> — that is what this script builds.</div>
      <div class="card">
        <label class="field"><span>Who I am talking to</span><input id="who" value="${esc(d.who || '')}" placeholder="e.g. My line manager"/></label>
        <label class="field"><span>What they need to know (no more than this)</span><input id="know" value="${esc(d.know || '')}" placeholder="e.g. I have a long-term health condition that comes in flares"/></label>
        <label class="field"><span>What I am asking for</span><input id="need" value="${esc(d.need || '')}" placeholder="e.g. Two days a week working from home, and predictable shifts"/></label>
        <label class="field"><span>What I will keep holding up</span><input id="hold" value="${esc(d.hold || '')}" placeholder="e.g. All my reporting deadlines, and the team stand-up"/></label>
        <button class="btn primary" id="build">Build my message</button>
        <div id="out"></div>
      </div>
      <div class="card"><h3>Worth knowing</h3>
        <ul class="bul">
          <li>Ask in writing after the talk — a short email protects both you and your manager</li>
          <li>Reasonable adjustment often costs almost nothing: seating, shift start, water, a fridge for medicine, rest breaks</li>
          <li>You can tell HR without telling your team. Decide your circle of knowledge first</li>
          <li>If attendance is being disciplined while you are under treatment, that is a matter for HR and, if needed, outside advice</li>
        </ul>
        <div class="btnrow" style="margin-top:10px">
          <a class="btn" href="#/stress/workload">Workload conversation guide</a>
          <a class="btn primary" href="#/counselling?cat=Chronic%20illness%20%26%20disability">Talk to a counsellor</a>
        </div>
      </div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const show = () => {
        const v = store.get().toolkit.workDisclosure || {};
        if (!v.know) { root.querySelector('#out').innerHTML = ''; return; }
        root.querySelector('#out').innerHTML = html`
          <div class="callout info" style="margin-top:12px">
            "${esc(v.who ? v.who : 'Hi')}, thank you for the time. I want to be straightforward with you: <strong>${esc(v.know)}</strong>.
            ${v.need ? `What would help most is <strong>${esc(v.need)}</strong>.` : ''}
            ${v.hold ? `I am still fully committed to this: <strong>${esc(v.hold)}</strong>.` : ''}
            Can we agree how to review it in a month?"</div>
          <p class="muted" style="font-size:.8rem">Practise it out loud once. Then send the follow-up email the same day.</p>`;
      };
      show();
      root.querySelector('#build').addEventListener('click', () => {
        const g = id => root.querySelector('#' + id).value.trim();
        if (!g('know')) return toast('Say what they need to know');
        store.update(s => { s.toolkit.workDisclosure = { who: g('who'), know: g('know'), need: g('need'), hold: g('hold') }; });
        show(); toast('Message built');
      });
    },
  };
}

export const chronicRoutes = {
  '/chronic': hub,
  '/chronic/symptoms': symptoms,
  '/chronic/meds': meds,
  '/chronic/pacing': pacing,
  '/chronic/appointment': appointment,
  '/chronic/disclose': disclose,
};
