/* ===========================================================
   ui.js — DOM helpers + shared components
   =========================================================== */

/** Tagged-template-ish HTML builder. Returns a string. */
export const html = (strings, ...vals) =>
  strings.reduce((out, s, i) => out + s + (vals[i] ?? ''), '');

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Query helpers scoped to #app by default */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Navigate */
export const go = (route) => { location.hash = route.startsWith('#') ? route : '#' + route; };

/** Toast */
let toastTimer;
export function toast(msg, ms = 1900) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/** App bar with optional back button */
export function appbar(title, sub = '', back = true) {
  return html`
    <div class="appbar">
      ${back ? `<a class="back" href="#" data-back aria-label="Back">‹</a>` : ''}
      <div>
        <h1>${esc(title)}</h1>
        ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
      </div>
    </div>`;
}

/** Section header with optional link */
export function sectionH(title, linkText, linkHref) {
  return html`<div class="sec-h"><h2>${esc(title)}</h2>${linkText ? `<a href="${linkHref}">${esc(linkText)}</a>` : ''}</div>`;
}

/** Horizontal score bar */
export function scoreBar(label, pct, color) {
  const c = color || 'var(--brand)';
  return html`
    <div class="scorebar">
      <div class="top"><span>${esc(label)}</span><span>${Math.round(pct)}%</span></div>
      <div class="track"><div class="fill" style="width:${Math.max(2, pct)}%;background:${c}"></div></div>
    </div>`;
}

/** Big conic ring */
export function ring(pct, label) {
  return html`
    <div class="ring" style="--p:${pct}">
      <div class="inner"><div><div class="val">${Math.round(pct)}%</div><div class="lbl">${esc(label)}</div></div></div>
    </div>`;
}

/** Traffic-light pill from a 0-100 score (higher = better) */
export function trafficPill(score, invert = false) {
  const s = invert ? 100 - score : score;
  const cls = s >= 70 ? 'g' : s >= 50 ? 'y' : s >= 30 ? 'o' : 'r';
  const lbl = s >= 70 ? 'Good' : s >= 50 ? 'Watch' : s >= 30 ? 'Elevated' : 'High';
  return `<span class="stat-pill ${cls}">${lbl}</span>`;
}

/** Crisis banner (shown on sensitive pages) */
export function crisisNote() {
  return html`
    <div class="callout crisis" style="margin-bottom:14px">
      <strong>In crisis or unsafe?</strong> This app is self-help support, not emergency care.
      <a href="#/crisis" style="text-decoration:underline;font-weight:700">Get urgent help ›</a>
    </div>`;
}

/** Render a list of {ico,title,desc,href} rows */
export function rows(items) {
  return html`<div class="list">${items.map(i => html`
    <a class="row" href="${i.href || '#'}">
      <span class="ico">${i.ico || '•'}</span>
      <span class="rt"><span class="rtl">${esc(i.title)}</span>${i.desc ? `<span class="rd">${esc(i.desc)}</span>` : ''}</span>
      <span class="go">›</span>
    </a>`).join('')}</div>`;
}

/** Likert question component controller. Renders + wires. */
export function likertGroup(container, questions, onChange) {
  const answers = {};
  container.innerHTML = questions.map((q, qi) => html`
    <div class="q" data-q="${qi}">
      <div class="qt">${esc(q)}</div>
      <div class="likert">
        ${[0, 1, 2, 3, 4].map(v => `<button type="button" data-v="${v}">${v}</button>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:.68rem;color:var(--muted)">
        <span>Never</span><span>Always</span>
      </div>
    </div>`).join('');
  container.querySelectorAll('.q').forEach(qEl => {
    const qi = +qEl.dataset.q;
    qEl.querySelectorAll('.likert button').forEach(b => {
      b.addEventListener('click', () => {
        qEl.querySelectorAll('.likert button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        answers[qi] = +b.dataset.v;
        onChange && onChange(answers, Object.keys(answers).length === questions.length);
      });
    });
  });
  return answers;
}

/** Confirm dialog (simple) */
export function confirmAction(msg) { return Promise.resolve(window.confirm(msg)); }

/** Format currency (KES) */
export const kes = (n) => 'Ksh ' + Number(n).toLocaleString();
