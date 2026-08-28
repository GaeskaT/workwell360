/* ===========================================================
   views/counsellor.js — Counsellor portal (for providers)
   =========================================================== */
import { html, esc, appbar, sectionH, rows } from '../ui.js';
import { COUNSELLOR_DEMO as C } from '../data.js';

function counsellor() {
  return {
    html: html`
      ${appbar('Counsellor Portal', C.name + (C.verified ? ' · ✔ Verified' : ''))}
      <div class="kpi card">
        <div class="k"><div class="n">${C.stats.activeClients}</div><div class="l">Active clients</div></div>
        <div class="k"><div class="n">${C.stats.sessionsThisMonth}</div><div class="l">Sessions / mo</div></div>
        <div class="k"><div class="n">⭐ ${C.stats.avgRating}</div><div class="l">Rating</div></div>
        <div class="k"><div class="n">${C.stats.followUpsDue}</div><div class="l">Follow-ups due</div></div>
      </div>

      ${sectionH("Today's schedule")}
      <div class="card"><div class="list">
        ${C.today.map(a => `<div class="row"><span class="ico">🕐</span>
          <span class="rt"><span class="rtl">${esc(a.time)} · ${esc(a.client)}</span><span class="rd">${esc(a.topic)}</span></span>
          <span class="chip">${esc(a.mode)}</span></div>`).join('')}
      </div></div>

      ${sectionH('Your practice')}
      ${rows([
        { ico: '👤', title: 'Professional profile', desc: 'Qualifications, specialities, availability' },
        { ico: '🗓️', title: 'Appointment management', desc: 'Accept, reschedule, follow-up reminders' },
        { ico: '🔐', title: 'Secure client messaging', desc: 'Encrypted, confidential' },
        { ico: '📝', title: 'Session notes & progress', desc: 'Private clinical records' },
        { ico: '📚', title: 'Resources to share', desc: 'Assign journals, exercises, courses' },
        { ico: '💳', title: 'Payments & payouts', desc: 'Session fees, platform service fee' },
      ])}
      <div class="callout info" style="margin-top:4px">Verified providers become part of the WorkWell 360 ecosystem — reaching employees across partner organisations.</div>
      <p class="muted center" style="font-size:.76rem">Demo portal. Clinical notes and client identities stay strictly confidential.</p>
      <div class="fab-space"></div>`,
  };
}

export const counsellorRoutes = {
  '/counsellor': counsellor,
};
