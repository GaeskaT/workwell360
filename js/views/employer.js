/* ===========================================================
   views/employer.js — Employer/HR analytics + Counsellor portal
   Aggregated & anonymised only — never individual data.
   =========================================================== */
import { html, esc, appbar, sectionH, scoreBar, ring, trafficPill, rows } from '../ui.js';
import { EMPLOYER_DEMO as E, COUNSELLOR_DEMO as C } from '../data.js';

function trend(t) {
  if (t > 0) return `<span class="stat-pill ${t > 0 ? 'r' : 'g'}">▲ ${t}</span>`;
  if (t < 0) return `<span class="stat-pill g">▼ ${Math.abs(t)}</span>`;
  return `<span class="stat-pill y">— 0</span>`;
}

function employer() {
  return {
    html: html`
      ${appbar('Employer / HR Dashboard', E.org)}
      <div class="callout info" style="margin-bottom:14px">🔒 Everything here is <strong>aggregated and anonymised</strong>. Individual check-ins, journals and counselling are never visible to employers.</div>

      <div class="card center">
        ${ring(E.orgScore, 'Wellness')}
        <p style="font-weight:800;margin:4px 0 0">Organisation Wellness Score</p>
        <p class="muted" style="font-size:.82rem">${E.active} of ${E.employees} employees active this month</p>
      </div>

      ${sectionH('Wellness trends')}
      <div class="card">
        ${E.metrics.map(m => html`
          <div class="scorebar">
            <div class="top"><span>${esc(m.label)} ${trafficPill(m.id === 'burnout' || m.id === 'stress' ? 100 - m.score : m.score)}</span>
              <span>${m.score}% ${trend(m.trend)}</span></div>
            <div class="track"><div class="fill" style="width:${m.score}%;background:${m.score >= 70 ? 'var(--green-500)' : m.score >= 50 ? 'var(--amber-500)' : 'var(--rose-500)'}"></div></div>
          </div>`).join('')}
      </div>

      ${sectionH('Department signals')}
      <div class="card"><div class="list">
        ${E.depts.map(d => `<div class="row"><span class="ico">🏢</span>
          <span class="rt"><span class="rtl">${esc(d.name)}</span><span class="rd">${esc(d.note)}</span></span>
          <span class="stat-pill ${d.burnoutRisk === 'High' ? 'r' : d.burnoutRisk === 'Elevated' ? 'o' : 'y'}">${esc(d.burnoutRisk)}</span></div>`).join('')}
      </div>
      <div class="callout warn" style="margin-top:10px">⚠️ Burnout risk has increased in <strong>Operations</strong> this quarter — consider a targeted workshop.</div></div>

      ${sectionH('Programme utilisation')}
      <div class="card">
        ${scoreBar('Counselling / EAP', E.utilisation.counselling)}
        ${scoreBar('Workshops attended', E.utilisation.workshops)}
        ${scoreBar('Courses completed', E.utilisation.courses)}
      </div>

      ${sectionH('Act on the data')}
      ${rows([
        { ico: '🧑‍🏫', title: 'Book a stress / burnout workshop', desc: 'Targeted intervention for Operations', href: '#/packages' },
        { ico: '📈', title: 'Upgrade to Enterprise', desc: 'Org-wide assessment & quarterly reports', href: '#/packages' },
        { ico: '🧠', title: 'Roll out a mental-health training', desc: 'Build wellbeing skills org-wide', href: '#/packages' },
      ])}
      <p class="muted center" style="font-size:.76rem">Demo data shown. Live dashboards populate from employees who consent to anonymous aggregation.</p>
      <div class="fab-space"></div>`,
  };
}

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
      <p class="muted center" style="font-size:.76rem">Demo portal. Clinical notes and client identities stay strictly confidential and separate from employer dashboards.</p>
      <div class="fab-space"></div>`,
  };
}

export const employerRoutes = {
  '/employer': employer,
  '/counsellor': counsellor,
};
