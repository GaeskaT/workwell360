/* ===========================================================
   views/family.js — Family & Relationship Support 👨‍👩‍👧
   =========================================================== */
import { html, esc, appbar, sectionH, rows, crisisNote } from '../ui.js';
import { FAMILY_TOPICS } from '../data.js';

function hub() {
  return {
    html: html`
      ${appbar('Family & Relationships', 'Support beyond the workplace')}
      <div class="hero" style="background:linear-gradient(140deg,#831843,#f43f5e)">
        <h1 style="font-size:1.25rem">❤️ Home matters too</h1>
        <p>Work stress follows us home — and home stress follows us to work. Support for the relationships that hold you.</p>
      </div>
      ${sectionH('What do you need?')}
      ${rows(FAMILY_TOPICS)}
      ${sectionH('Learn together')}
      ${rows([
        { ico: '🎓', title: 'Healthy Relationships course', desc: '5 lessons · certificate', href: '#/course/rel' },
        { ico: '🧠', title: 'Emotional Intelligence course', desc: 'Understand & manage emotions', href: '#/course/eq' },
      ])}
      ${crisisNote()}
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
  '/family/parenting': parenting,
  '/family/caregiving': caregiving,
};
