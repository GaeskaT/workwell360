/* ===========================================================
   views/centres.js — Mental Health 🧠, Grief & Loss 🕊️,
   and the Workplace conflict tool. Self-help toolkits that
   mirror the anger / stress / burnout centres.
   =========================================================== */
import { store, now, fmtDateTime } from '../store.js';
import { html, esc, toast, appbar, sectionH, rows, crisisNote } from '../ui.js';
import { TOOLKITS } from '../data.js';

/* ---------- Mental Health centre ---------- */
function mentalHub() {
  const a = store.get().assessments.wellbeing;
  return {
    html: html`
      ${appbar('Mental Health', 'Everyday emotional wellbeing')}
      <div class="hero" style="background:linear-gradient(140deg,#134e4a,#6d28d9)">
        <h1 style="font-size:1.25rem">🧠 Look after your mind</h1>
        <p>Small daily habits protect your wellbeing. Check in, use the tools, and reach out when you need to.</p>
      </div>
      ${a ? `<div class="callout ${a.score >= 61 ? 'warn' : 'info'}" style="margin-bottom:12px">Wellbeing self-check: <strong>${a.score}% · ${esc(a.band)}</strong>. <a href="#/assess/wellbeing" style="text-decoration:underline;font-weight:700">Retake</a></div>`
          : `<a class="btn primary" href="#/assess/wellbeing" style="margin-bottom:14px">Take the wellbeing self-check</a>`}
      ${sectionH('Your wellbeing toolkit')}
      ${rows(TOOLKITS.mental)}
      <div class="card"><h3>Daily check-in</h3><p class="muted">A quick mood check each day helps you spot patterns early.</p>
        <a class="btn" href="#/dashboard">Do today's check-in ›</a></div>
      ${crisisNote()}
      <div class="fab-space"></div>`,
  };
}

/* ---------- Grief & Loss centre ---------- */
function griefHub() {
  const a = store.get().assessments.grief;
  return {
    html: html`
      ${appbar('Grief & Loss', 'You do not have to carry it alone')}
      <div class="hero" style="background:linear-gradient(140deg,#334155,#64748b)">
        <h1 style="font-size:1.25rem">🕊️ Support through loss</h1>
        <p>There is no right way and no timetable for grief. Move gently, at your own pace.</p>
      </div>
      <div class="callout info" style="margin-bottom:12px">Whatever you feel — sadness, numbness, anger, relief, or all at once — is a normal part of grief.</div>
      ${a ? `<div class="callout ${a.score >= 61 ? 'warn' : 'info'}" style="margin-bottom:12px">Grief support check: <strong>${a.score}% · ${esc(a.band)}</strong>. <a href="#/assess/grief" style="text-decoration:underline;font-weight:700">Retake</a></div>`
          : `<a class="btn primary" href="#/assess/grief" style="margin-bottom:14px">Take the grief support check</a>`}
      ${sectionH('Your grief toolkit')}
      ${rows(TOOLKITS.grief)}
      ${crisisNote()}
      <div class="fab-space"></div>`,
  };
}

/* ---------- Understanding grief (supportive info) ---------- */
function griefUnderstanding() {
  return {
    html: html`
      ${appbar('Understanding grief', 'What to expect')}
      <div class="card"><h3>Grief comes in waves</h3>
        <p class="muted">Grief rarely moves in neat stages. It often comes in waves — calmer stretches, then a sudden surge triggered by a song, a date, or a familiar place. Over time the waves usually come less often and feel less overwhelming.</p>
      </div>
      <div class="card"><h3>Common experiences</h3>
        <ul class="bul">
          <li>Waves of sadness, tears, or a heavy chest</li>
          <li>Numbness, or feeling like it isn't real</li>
          <li>Trouble concentrating, sleeping, or eating</li>
          <li>Anger, guilt, or "what if" thoughts</li>
          <li>Moments of relief or even laughter — this is okay too</li>
        </ul>
      </div>
      <div class="card"><h3>Gentle ways to cope</h3>
        <ul class="bul">
          <li>Let yourself feel it — grief needs expression, not suppression</li>
          <li>Keep small routines: rest, water, a little movement, daylight</li>
          <li>Talk to someone you trust, or write it down</li>
          <li>Mark memories in your own way, when you're ready</li>
        </ul>
      </div>
      <div class="callout warn">Please reach out for support if grief feels unbearable, you can't function for a long period, or you have thoughts of harming yourself. <a href="#/crisis" style="text-decoration:underline;font-weight:700">Get urgent help ›</a></div>
      <div class="btnrow" style="margin-top:12px">
        <a class="btn primary" href="#/counselling?cat=Grief and loss">Talk to a counsellor</a>
        <a class="btn" href="#/journal/grief">Open grief journal</a>
      </div>
      <div class="fab-space"></div>`,
  };
}

/* ---------- A memory to hold (remembrance exercise) ---------- */
function griefRemember() {
  const entries = store.get().journals.grief || [];
  return {
    html: html`
      ${appbar('A memory to hold', 'A gentle remembrance')}
      <div class="card"><p class="muted">When you feel ready, spend a few quiet minutes with one of these prompts. There's no rush — return whenever you like.</p>
        <label class="field"><span>Choose a prompt</span>
          <select id="prompt">
            <option>A favourite memory I want to keep</option>
            <option>Something they taught me that I carry forward</option>
            <option>What I would say to them today</option>
            <option>A way I'd like to honour them</option>
            <option>Write freely</option>
          </select></label>
        <label class="field"><span>Your words</span><textarea id="text" placeholder="Take your time…"></textarea></label>
        <button class="btn primary" id="save">Keep this</button>
      </div>
      <div id="list">${entries.map(e => `<div class="card tight"><small>${fmtDateTime(e.ts)}</small><p style="margin:6px 0 0">${esc(e.text)}</p></div>`).join('')}</div>
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelector('#save').addEventListener('click', () => {
        const p = root.querySelector('#prompt').value;
        const t = root.querySelector('#text').value.trim();
        if (!t) return toast('Write something first');
        store.update(s => { (s.journals.grief = s.journals.grief || []).unshift({ ts: now(), text: `${p}: ${t}` }); });
        root.querySelector('#text').value = '';
        root.querySelector('#list').innerHTML = (store.get().journals.grief || []).map(e => `<div class="card tight"><small>${fmtDateTime(e.ts)}</small><p style="margin:6px 0 0">${esc(e.text)}</p></div>`).join('');
        toast('Kept privately 💗');
      });
    },
  };
}

/* ---------- Workplace conflict resolution ---------- */
function workplaceConflict() {
  return {
    html: html`
      ${appbar('Conflict resolution', 'Handle friction professionally')}
      <div class="card"><h3>Before you respond</h3>
        <div class="journey">
          <div class="jstep done"><div class="jw">Stop</div><div class="jd">Notice the reaction rising. Don't fire off that message yet.</div></div>
          <div class="jstep done"><div class="jw">Pause</div><div class="jd">One slow breath. Aim to understand, not to win.</div></div>
          <div class="jstep done"><div class="jw">Reflect</div><div class="jd">What outcome do I actually want here? What's the shared goal?</div></div>
          <div class="jstep done"><div class="jw">Respond</div><div class="jd">Address the issue, not the person. Facts and a request, calmly.</div></div>
        </div>
      </div>
      <div class="card"><h3>A script that de-escalates</h3>
        <div class="callout info">"I think we see this differently, and I'd like to sort it out. From my side, <em>[the facts]</em>. Can you help me understand your view, so we can find a way forward that works for both of us?"</div>
      </div>
      <div class="card"><h3>Keep it professional</h3>
        <ul class="bul">
          <li>Deal with it early and privately — not in front of the team</li>
          <li>Separate the problem from the person</li>
          <li>Listen to understand before you reply</li>
          <li>Agree a concrete next step, and follow up</li>
          <li>If it keeps escalating, involve your manager or HR</li>
        </ul>
      </div>
      <div class="btnrow">
        <a class="btn" href="#/anger/assertive">Assertive communication</a>
        <a class="btn primary" href="#/counselling?cat=Workplace conflict">Talk to a counsellor</a>
      </div>
      <div class="fab-space"></div>`,
  };
}

export const centreRoutes = {
  '/mental': mentalHub,
  '/grief': griefHub,
  '/grief/understanding': griefUnderstanding,
  '/grief/remember': griefRemember,
  '/workplace/conflict': workplaceConflict,
};
