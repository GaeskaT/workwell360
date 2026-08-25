/* ===========================================================
   store.js — local-first persistence + app state
   All employee data stays on the device (privacy by design).
   =========================================================== */
const KEY = 'ww360.v1';

const DEFAULTS = () => ({
  onboarded: false,
  profile: { name: '', org: 'Demo Organisation', role: 'employee', retireInMonths: 18 },
  settings: { theme: 'system', shareAnonAggregate: true, reminders: false },
  checkins: [],        // {ts, mood, note}
  angerDiary: [],      // {ts, trigger, body, intensity, response, note}
  stressDiary: [],     // {ts, domains:[], level, note}
  energy: [],          // {ts, energy, sleep, workload}
  journals: {},        // {journalId: [{ts, prompt, text}]}
  bookings: [],        // {ts, category, provider, mode, when, status}
  reports: [],         // anonymous workplace reports {ts, ref, category, area, detail, when, severity, others, status} — NO identifiers
  assessments: {},     // {assessId: {ts, score, band, answers}}
  retirement: { scores: null, plan: [], phase: null },
  courseProgress: {},  // {courseId: {lessons:[idx], done:bool}}
  cart: [],            // productIds
  favourites: [],
  toolkit: {},         // misc {key:value} for planners/checklists
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    return { ...DEFAULTS(), ...JSON.parse(raw) };
  } catch (e) { return DEFAULTS(); }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

export const store = {
  get: () => state,
  set(patch) { state = { ...state, ...patch }; persist(); },
  update(fn) { fn(state); persist(); },
  push(path, item) {
    const arr = get(state, path) || [];
    arr.unshift(item);
    setPath(state, path, arr);
    persist();
    return arr;
  },
  reset() { state = DEFAULTS(); persist(); },
  exportJSON() { return JSON.stringify(state, null, 2); },
  importJSON(txt) { state = { ...DEFAULTS(), ...JSON.parse(txt) }; persist(); },
};

function get(obj, path) { return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj); }
function setPath(obj, path, val) {
  const parts = path.split('.'); const last = parts.pop();
  const t = parts.reduce((o, k) => (o[k] = o[k] || {}), obj);
  t[last] = val;
}
export { get as getPath };

/* ---- tiny helpers ---- */
export const uid = () => Math.random().toString(36).slice(2, 9);
export const now = () => Date.now();
export const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const fmtDateTime = (ts) => new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
export const daysAgo = (ts) => Math.floor((now() - ts) / 86400000);
