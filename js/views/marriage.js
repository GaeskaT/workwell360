/* ===========================================================
   views/marriage.js — Marriage & Partnership 💍
   Work stress lands hardest at home. This is the home front.
   =========================================================== */
import { store, now, fmtDate } from '../store.js';
import { html, esc, toast, appbar, sectionH, rows, scoreBar, crisisNote } from '../ui.js';
import { TOOLKITS } from '../data.js';

const AREAS = [
  { k: 'connection', l: 'Emotional connection', h: 'Do you still know how the other one feels?' },
  { k: 'repair', l: 'Repair after a fight', h: 'Do arguments end, or just stop?' },
  { k: 'intimacy', l: 'Affection & intimacy', h: 'Touch, warmth, and honesty about desire.' },
  { k: 'money', l: 'Money teamwork', h: 'One plan, no secrets, no scoreboard.' },
  { k: 'load', l: 'Home & parenting load', h: 'Does the fair-share feeling match?' },
  { k: 'time', l: 'Time you actually protect', h: 'A normal week, not a holiday.' },
];
const RITUALS = [
  '6-second hug before work', 'Daily 10-minute check-in, no phones', 'One weeknight without screens',
  'Weekly date, however small', 'Say one specific appreciation daily', 'Pray or reflect together',
  'Share the diary every Sunday', 'One "how are we?" conversation a month', 'Go to bed on the same time, twice a week',
  'Never end the day in silence (except when a pause is agreed)',
];
const PREMARRIAGE = [
  'Money: debts, obligations, who earns what, joint or separate accounts',
  'Children: how many, when, and what we do if it is difficult',
  'Parents & in-laws: how much involvement, whose home comes first',
  'Faith & values: how we practise, and how we disagree about it',
  'Work & relocation: whose career leads, and what we would move for',
  'Roles at home: who does what, and how we handle the mismatch',
  'Conflict: what our families taught us about arguing',
  'Intimacy & expectations: honest conversation, with no performance',
  'Substances & health: history, family patterns, and what we will not tolerate',
  'House, debt & budgets: what we own, owe, and expect',
  'Free time & friends: how much space each of us needs',
  'Having each other\'s back publicly: how we correct one another',
  'Sex, pornography and boundaries: what is off-limits for us',
  'If it ends: what we would do, and what we would never do',
];

function hub() {
  const a = store.get().assessments.marriage;
  const last = store.get().coupleCheckins[0];
  return {
    html: html`
      ${appbar('Marriage & Partnership', 'Protect the home front')}
      <div class="hero" style="background:linear-gradient(140deg,#831843,#f59e0b)">
        <h1 style="font-size:1.25rem">💍 The relationship is worth the work</h1>
        <p>Most partnerships do not fail from one big event. They drift through small unsaid things — usually while work is loud. Ten minutes a week changes the odds.</p>
      </div>
      ${a ? `<div class="callout ${a.score >= 61 ? 'warn' : 'info'}" style="margin-bottom:12px">Partnership check: <strong>${a.score}% · ${esc(a.band)}</strong>. <a href="#/assess/marriage" style="text-decoration:underline;font-weight:700">Retake</a></div>`
          : `<a class="btn primary" href="#/assess/marriage" style="margin-bottom:14px">Take the marriage &amp; partnership check</a>`}
      ${last ? `<div class="callout info" style="margin-bottom:12px">Last check-in (${esc(fmtDate(last.ts))}): lowest area was <strong>${esc(lowest(last).l)}</strong>. <a href="#/marriage/checkin" style="text-decoration:underline;font-weight:700">New check-in</a></div>` : ''}
      ${sectionH('Your partnership toolkit')}
      ${rows(TOOLKITS.marriage)}
      ${sectionH('The research-shaped version')}
      <div class="card">
        <p class="muted">What predicts a partnership lasting is not the absence of conflict — it is whether the couple keeps turning <em>toward</em> each other in small moments, and repairs after a rupture.</p>
        <ul class="bul">
          <li>Soft start-up beats a correct accusation</li>
          <li>One repair attempt ("I'm sorry, that came out harsh") lands even when the argument continues</li>
          <li>Contempt — eye-rolling, name-calling, "you always/never" — is the single most damaging thing in the room</li>
          <li>Loneliness is often a schedule problem before it is a love problem</li>
        </ul>
      </div>
      <div class="callout crisis" style="margin-bottom:14px"><strong>If home is not safe.</strong> Control, threats or violence are not a communication problem to solve with a better script.
        <a href="#/crisis" style="text-decoration:underline;font-weight:700">Get urgent help ›</a></div>
      ${crisisNote()}
      <div class="fab-space"></div>`,
  };
}
function lowest(c) {
  return AREAS.reduce((min, a) => (c[a.k] ?? 10) < (c[min.k] ?? 10) ? a : min, AREAS[0]);
}

/* ---------- Weekly check-in ---------- */
function checkin() {
  const list = store.get().coupleCheckins;
  const prev = list[0];
  return {
    html: html`
      ${appbar('Weekly check-in', 'Six numbers, five minutes')}
      <div class="card"><p class="muted">Rate your last week together. Do it honestly and separately, then compare — the gap between your two answers is the conversation.</p>
        ${AREAS.map(a => html`
          <label class="field"><span>${esc(a.l)}</span>
            <div class="range-wrap"><input type="range" min="0" max="10" value="${prev ? (prev[a.k] ?? 5) : 5}" data-k="${a.k}"/><output>${prev ? (prev[a.k] ?? 5) : 5}</output></div>
            <span class="muted" style="font-weight:400;font-size:.78rem">${esc(a.h)}</span></label>`).join('')}
        <label class="field"><span>One thing I appreciated about you this week</span><textarea id="thanks" placeholder="Be specific — it is the specificity that lands."></textarea></label>
        <label class="field"><span>One thing I need next week</span><textarea id="ask" placeholder="One concrete, doable thing…"></textarea></label>
        <button class="btn primary" id="save">Save this week</button>
      </div>
      <div id="trend">${trend(list)}</div>
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', () => r.nextElementSibling.textContent = r.value));
      root.querySelector('#save').addEventListener('click', () => {
        const entry = { ts: now(), thanks: root.querySelector('#thanks').value.trim(), ask: root.querySelector('#ask').value.trim() };
        root.querySelectorAll('input[type=range]').forEach(r => entry[r.dataset.k] = +r.value);
        store.push('coupleCheckins', entry);
        root.querySelectorAll('textarea').forEach(t => t.value = '');
        root.querySelector('#trend').innerHTML = trend(store.get().coupleCheckins);
        toast('Saved privately — now show your partner');
      });
    },
  };
}
function trend(list) {
  if (!list.length) return `<div class="empty"><div class="e">💍</div><p>No check-ins yet. Do the first one tonight.</p></div>`;
  const recent = list.slice(0, 8).reverse();
  const avg = Math.round(recent.reduce((s, c) => s + AREAS.reduce((x, a) => x + (c[a.k] ?? 0), 0) / AREAS.length, 0) / recent.length * 10);
  const last = list[0];
  const low = lowest(last);
  return html`
    <div class="card"><h3>Where you are</h3>
      ${scoreBar('Overall connection', avg)}
      ${AREAS.map(a => scoreBar(a.l, (last[a.k] ?? 0) * 10, (last[a.k] ?? 0) >= 7 ? 'var(--green-500)' : (last[a.k] ?? 0) >= 4 ? 'var(--orange-500)' : 'var(--rose-500)'))
        .join('')}
      <div class="divider"></div>
      <p style="margin:0"><span class="muted">Smallest number this week:</span> <strong>${esc(low.l)}</strong></p>
      <p class="muted" style="margin:6px 0 0">Start with: "What would make ${esc(low.l.toLowerCase())} a two-point better week for you?"</p>
      ${last.thanks ? `<p style="margin:8px 0 0"><span class="muted">Appreciation:</span> ${esc(last.thanks)}</p>` : ''}
      ${last.ask ? `<p style="margin:2px 0 0"><span class="muted">Request:</span> ${esc(last.ask)}</p>` : ''}
    </div>
    <div class="list">${list.slice(0, 8).map(c => `<a class="row" href="#/marriage/checkin"><span class="ico">📅</span><span class="rt"><span class="rtl">${esc(fmtDate(c.ts))} · ${Math.round(AREAS.reduce((s, a) => s + (c[a.k] ?? 0), 0) / AREAS.length * 10)}%</span>${c.ask ? `<span class="rd">${esc(c.ask)}</span>` : ''}</span><span class="go">›</span></a>`).join('')}</div>`;
}

/* ---------- Repair script ---------- */
function repair() {
  const saved = store.get().toolkit.marriageRepair;
  return {
    html: html`
      ${appbar('Repair script', 'How to come back after a fight')}
      <div class="callout info" style="margin-bottom:12px">A repair attempt is anything that lowers the temperature once you are already in it — a joke, an admission, a hand. It does not require you to lose the argument.</div>
      <div class="card">
        <label class="field"><span>What I actually did (facts, no "you made me")</span><input id="did" placeholder="e.g. I raised my voice and walked out mid-sentence"/></label>
        <label class="field"><span>What I felt underneath</span><input id="felt" placeholder="e.g. I felt dismissed in front of the family"/></label>
        <label class="field"><span>What it cost them</span><input id="cost" placeholder="e.g. You shut down and slept badly"/></label>
        <label class="field"><span>What I appreciate about you anyway</span><input id="app" placeholder="e.g. You carry this household every single day"/></label>
        <label class="field"><span>What I need, as one doable request</span><input id="need" placeholder="e.g. Let's pause and finish this after the kids are asleep"/></label>
        <button class="btn primary" id="build">Build it</button>
        <div id="out"></div>
      </div>
      <div class="card"><h3>Rules of the rebuild</h3>
        <ul class="bul">
          <li>Repair within 48 hours, or name it out loud: "I'm still upset, I need Thursday to talk"</li>
          <li>Apologise for your part first. It is not a concession, it is the door</li>
          <li>No third parties in the argument — not parents, not friends, not WhatsApp groups</li>
          <li>Do not negotiate while exhausted, hungry, or drunk</li>
          <li>If the same fight returns more than three times, that is a couples-counsellor problem, not a you problem</li>
        </ul>
        <a class="btn primary" style="margin-top:10px" href="#/counselling?cat=Couples%20counselling">Find couples counselling ›</a>
      </div>
      ${saved ? '<div class="card"><h3>Your saved script</h3><p style="white-space:pre-line;margin:0">' + esc(saved) + '</p></div>' : ''}
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelector('#build').addEventListener('click', () => {
        const get = id => root.querySelector('#' + id).value.trim();
        if (!get('did')) return toast('Start with what you did');
        const script = `I want to fix my part. ${get('did')} — that was mine, and I'm sorry. Underneath it I felt ${get('felt') || '…'}, and I know it cost you ${get('cost') || '…'}.\n\nI still see you clearly: ${get('app') || '…'}.\n\nWhat I need is ${get('need') || '…'}. Can we try again from here?`;
        root.querySelector('#out').innerHTML = html`<div class="callout info" style="margin-top:12px;white-space:pre-line">${esc(script)}</div>`;
        store.update(s => { s.toolkit.marriageRepair = script; });
        toast('Saved — say it in your own words');
      });
    },
  };
}

/* ---------- Connection rituals ---------- */
function rituals() {
  const saved = store.get().toolkit.marriageRituals || [];
  return {
    html: html`
      ${appbar('Connection habits', 'Pick four. Not ten.')}
      <div class="card"><p class="muted">Tap the habits you will actually keep in a normal working week. Over-plan and the plan becomes another thing you failed at.</p>
        <div class="chips" id="chips">${RITUALS.map(r => `<button class="chip ${saved.includes(r) ? 'on' : ''}" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>
      </div>
      <div class="card"><h3>Our plan</h3><div id="mine" class="tag-row"></div>
        <div class="btnrow" style="margin-top:14px">
          <a class="btn" href="#/stress/boundaries">Protect the time</a>
          <a class="btn primary" href="#/marriage/checkin">Check in weekly</a>
        </div></div>
      <div class="card"><h3>Money, without a row</h3>
        <p class="muted">Finances are one of the top three reasons couples stop talking. The fix is cadence, not agreement.</p>
        <ul class="bul">
          <li>One 20-minute money meeting a month, same time, phone away</li>
          <li>Agree a "no-ask threshold" — any spend above it gets a conversation first</li>
          <li>Name each person's family obligations out loud; unspoken support is where trust leaks</li>
          <li>Separate the goal from the blame: "we are Ksh X behind" not "you spent…"</li>
          <li>Build one small thing together — an item, a fund, a trip — so the plan feels like yours</li>
        </ul>
        <a class="btn" style="margin-top:6px" href="#/course/finance">Financial wellness course ›</a>
      </div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const paint = () => {
        const cur = store.get().toolkit.marriageRituals || [];
        root.querySelector('#mine').innerHTML = cur.length ? cur.map(r => `<span class="chip on">${esc(r)}</span>`).join('') : '<span class="muted">Nothing chosen yet</span>';
      };
      paint();
      root.querySelectorAll('#chips .chip').forEach(c => c.addEventListener('click', () => {
        const r = c.dataset.r;
        store.update(s => { const arr = s.toolkit.marriageRituals = s.toolkit.marriageRituals || []; const i = arr.indexOf(r); i >= 0 ? arr.splice(i, 1) : arr.push(r); });
        c.classList.toggle('on'); paint();
      }));
    },
  };
}

/* ---------- Pre-marital checklist ---------- */
function premarital() {
  const done = store.get().toolkit.premaritalDone || [];
  return {
    html: html`
      ${appbar('Before we marry', 'The 14 conversations')}
      <div class="card"><p class="muted">Not a test — a schedule. Couples who have talked about these argue better, because they know what the other one is actually afraid of.</p>
        <div id="pct"></div>
        <div class="list" id="topics">${PREMARRIAGE.map((t, i) => html`
          <label class="row" style="cursor:pointer">
            <span class="ico">${done.includes(t) ? '✅' : '⭕'}</span>
            <span class="rt"><span class="rtl">Conversation ${i + 1}</span><span class="rd">${esc(t)}</span></span>
            <input type="checkbox" data-t="${esc(t)}" ${done.includes(t) ? 'checked' : ''} style="width:22px;height:22px"/>
          </label>`).join('')}</div>
      </div>
      <div class="btnrow">
        <a class="btn" href="#/marriage/checkin">Keep checking in after</a>
        <a class="btn primary" href="#/counselling?cat=Couples%20counselling">Premarital counselling</a>
      </div>
      <div class="fab-space"></div>`,
    onMount(root) {
      const pct = () => {
        const cur = store.get().toolkit.premaritalDone || [];
        root.querySelector('#pct').innerHTML = scoreBar('Talked about', (cur.length / PREMARRIAGE.length) * 100);
      };
      pct();
      root.querySelectorAll('#topics input').forEach(cb => cb.addEventListener('change', () => {
        const t = cb.dataset.t;
        store.update(s => { const arr = s.toolkit.premaritalDone = s.toolkit.premaritalDone || []; const i = arr.indexOf(t); i >= 0 ? arr.splice(i, 1) : arr.push(t); });
        cb.closest('.row').querySelector('.ico').textContent = cb.checked ? '✅' : '⭕';
        pct();
      }));
    },
  };
}

export const marriageRoutes = {
  '/marriage': hub,
  '/marriage/checkin': checkin,
  '/marriage/repair': repair,
  '/marriage/rituals': rituals,
  '/marriage/premarital': premarital,
};
