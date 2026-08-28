/* ===========================================================
   app.js — bootstrap, router, navigation
   =========================================================== */
import { store } from './store.js';
import { $, $$, toast } from './ui.js';

import { coreRoutes } from './views/core.js';
import { angerRoutes } from './views/anger.js';
import { stressRoutes } from './views/stress.js';
import { burnoutRoutes } from './views/burnout.js';
import { counsellingRoutes } from './views/counselling.js';
import { familyRoutes } from './views/family.js';
import { storeRoutes } from './views/store.js';
import { counsellorRoutes } from './views/counsellor.js';
import { centreRoutes } from './views/centres.js';

const ROUTES = {
  ...coreRoutes, ...angerRoutes, ...stressRoutes, ...burnoutRoutes,
  ...counsellingRoutes, ...familyRoutes,
  ...storeRoutes, ...counsellorRoutes, ...centreRoutes,
};

/* map a route base to a bottom-tab id for active styling */
function tabFor(path) {
  if (path.startsWith('/need-today')) return 'need-today';
  if (path.startsWith('/store')) return 'store';
  if (['/dashboard', '/', ''].includes(path)) return 'dashboard';
  if (['/more', '/crisis', '/settings', '/about', '/packages', '/counsellor'].some(p => path.startsWith(p))) return 'more';
  return '';
}

function parseHash() {
  let raw = location.hash.replace(/^#/, '') || '/dashboard';
  const [path, qs] = raw.split('?');
  const params = {};
  if (qs) for (const [k, v] of new URLSearchParams(qs)) params[k] = v;
  return { path: path || '/dashboard', params, raw };
}

/* match /course/:id style routes */
function resolve(path) {
  if (ROUTES[path]) return { handler: ROUTES[path], seg: {} };
  for (const key of Object.keys(ROUTES)) {
    if (!key.includes(':')) continue;
    const kp = key.split('/'), pp = path.split('/');
    if (kp.length !== pp.length) continue;
    const seg = {}; let ok = true;
    for (let i = 0; i < kp.length; i++) {
      if (kp[i].startsWith(':')) seg[kp[i].slice(1)] = decodeURIComponent(pp[i]);
      else if (kp[i] !== pp[i]) { ok = false; break; }
    }
    if (ok) return { handler: ROUTES[key], seg };
  }
  return null;
}

function render() {
  const { path, params } = parseHash();
  const s = store.get();

  // force onboarding first
  if (!s.onboarded && path !== '/onboarding') { location.hash = '#/onboarding'; return; }

  const app = document.getElementById('app');
  const match = resolve(path);
  let out;
  try {
    if (!match) out = notFound(path);
    else out = match.handler({ ...params, ...match.seg });
  } catch (err) {
    console.error(err);
    out = { html: `<div class="card"><h2>Something went wrong</h2><p class="muted">${err.message}</p><a class="btn" href="#/dashboard">Go home</a></div>` };
  }
  const { html, onMount } = typeof out === 'string' ? { html: out } : out;
  app.innerHTML = html;
  window.scrollTo(0, 0);
  onMount && onMount(app, { ...params, ...(match ? match.seg : {}) });

  // active tab
  const t = tabFor(path);
  $$('#tabbar a').forEach(a => a.classList.toggle('active', a.dataset.tab === t));
  document.getElementById('tabbar').classList.toggle('hidden', path === '/onboarding');
}

function notFound(path) {
  return { html: `<div class="empty"><div class="e">🧭</div><h2>Page not found</h2><p class="muted">${path}</p><a class="btn primary" href="#/dashboard">Back to home</a></div>` };
}

/* global back button + theme + delegated actions */
document.addEventListener('click', (e) => {
  const back = e.target.closest('[data-back]');
  if (back) { e.preventDefault(); history.length > 1 ? history.back() : (location.hash = '#/dashboard'); }
});

function applyTheme() {
  const th = store.get().settings.theme;
  if (th === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', th);
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => { applyTheme(); render(); });
window.__ww = { store, applyTheme, render, toast }; // for settings view

// service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
