/* ===========================================================
   views/family.js — Family & Relationship Support 👨‍👩‍👧
   =========================================================== */
import { store } from '../store.js';
import { html, esc, appbar, sectionH, rows, crisisNote } from '../ui.js';
import { FAMILY_TOPICS, TOOLKITS } from '../data.js';

function hub() {
  const a = store.get().assessments.family;
  return {
    html: html`
      ${appbar('Family & Relationships', 'Support beyond the workplace')}
      <div class="hero" style="background:linear-gradient(140deg,#831843,#f43f5e)">
        <h1 style="font-size:1.25rem">❤️ Home matters too</h1>
        <p>Work stress follows us home — and home stress follows us to work. Support for the relationships that hold you.</p>
      </div>
      ${a ? `<div class="callout ${a.score >= 61 ? 'warn' : 'info'}" style="margin-bottom:12px">Relationship & home check: <strong>${a.score}% · ${esc(a.band)}</strong>. <a href="#/assess/family" style="text-decoration:underline;font-weight:700">Retake</a></div>`
          : `<a class="btn primary" href="#/assess/family" style="margin-bottom:14px">Take the relationship & home check</a>`}
      ${sectionH('Your family & relationship toolkit')}
      ${rows(TOOLKITS.family)}
      ${sectionH('What do you need?')}
      ${rows(FAMILY_TOPICS)}
      ${crisisNote()}
      <div class="fab-space"></div>`,
  };
}

/* ---- Healthy communication guide ---- */
function communication() {
  return {
    html: html`
      ${appbar('Healthy communication', 'Listen · speak · repair')}
      <div class="card"><h3>Listen to understand</h3>
        <ul class="bul">
          <li>Give full attention — put the phone down, turn towards them.</li>
          <li>Reflect back what you heard before you reply ("So you felt…").</li>
          <li>Ask, don't assume: "Can you help me understand?"</li>
        </ul>
      </div>
      <div class="card"><h3>Speak so you're heard</h3>
        <p class="muted">Swap blame for ownership. Instead of "You never…", try:</p>
        <div class="callout info">"When <em>[what happened]</em>, I felt <em>[emotion]</em>, because <em>[why it matters]</em>. I'd really like <em>[a clear request]</em>."</div>
        <a class="btn" style="margin-top:10px" href="#/anger/assertive">Build an "I" statement ›</a>
      </div>
      <div class="card"><h3>Repair after conflict</h3>
        <ul class="bul">
          <li>Take a short break if things get heated — agree to come back to it.</li>
          <li>Own your part first; it lowers everyone's defences.</li>
          <li>Focus on the next step together, not on who "won".</li>
        </ul>
      </div>
      <div class="card"><h3>Stay connected</h3>
        <p class="muted">A short weekly check-in keeps small things from becoming big ones: "What went well for us this week? What do you need from me?"</p>
      </div>
      <div class="btnrow">
        <a class="btn" href="#/journal/reflection">Reflect in your journal</a>
        <a class="btn primary" href="#/counselling?cat=Couples counselling">Talk to a counsellor</a>
      </div>
      <div class="fab-space"></div>`,
  };
}

function parenting() {
  return {
    html: html`
      ${appbar('Parenting & work', 'Balancing both')}
      <div class="card"><h3>Small shifts that help</h3>
        <ul class="bul">
          <li>Protect one uninterrupted hour with your children — phone away.</li>
          <li>Name your feelings out loud so children learn to name theirs.</li>
          <li>Share the mental load at home — list it, then split it.</li>
          <li>Model recovery: they learn rest and boundaries by watching you.</li>
        </ul>
      </div>
      <a class="btn primary" href="#/counselling?cat=Family counselling">Family counselling ›</a>
      <a class="btn" style="margin-top:10px" href="#/stress/boundaries">Set work–home boundaries ›</a>`,
  };
}

function caregiving() {
  return {
    html: html`
      ${appbar('Caregiving & ageing parents', 'The sandwich generation')}
      <div class="card"><p class="muted">Caring for ageing parents while working and raising a family is a heavy, often invisible load. Looking after yourself is part of caring for them.</p>
        <ul class="bul">
          <li>Share the care — build a rota with siblings or relatives.</li>
          <li>Accept help; ask specifically rather than waiting to be offered.</li>
          <li>Watch for caregiver burnout — take the <a href="#/assess/burnout" style="text-decoration:underline">burnout self-check</a>.</li>
          <li>Protect small pockets of restorative time for yourself.</li>
        </ul>
      </div>
      <a class="btn primary" href="#/counselling?cat=Adjustment to major life changes">Talk to a counsellor ›</a>`,
  };
}

export const familyRoutes = {
  '/family': hub,
  '/family/communication': communication,
  '/family/parenting': parenting,
  '/family/caregiving': caregiving,
};
