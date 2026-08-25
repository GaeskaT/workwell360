/* ===========================================================
   reports.js — anonymous workplace intake (store + router)

   PRIVACY GUARANTEES (by construction):
   - No name / email / phone / device id is ever accepted or stored.
   - IP addresses are NEVER logged or persisted. They are used only
     transiently, hashed with a rotating in-memory salt, purely for
     rate-limiting, then discarded.
   - Timestamps are coarsened to the calendar day to reduce the chance
     of correlating a report with, e.g., a login time.
   - The reporter proves ownership with a server-issued access key
     (only its salted scrypt hash is stored) — there is no account.
   - Handlers (ombudsperson) authenticate with an admin token; even to
     them, a report carries no reporter identity, because none exists.
   Swap the JSON store for an encrypted DB before production (see REPORTS.md).
   =========================================================== */
import express from 'express';
import crypto from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const FILE = join(DIR, 'reports.json');

let db = { seq: 0, reports: {} };
function load() { try { if (existsSync(FILE)) db = JSON.parse(readFileSync(FILE, 'utf8')); } catch { /* fresh */ } }
function save() { if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true }); writeFileSync(FILE, JSON.stringify(db, null, 2)); }
load();

/* ---- codes & keys (unambiguous alphabet, no 0/O/1/I) ---- */
const B32 = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function chunk(n) { const b = crypto.randomBytes(n); let s = ''; for (const x of b) s += B32[x % B32.length]; return s; }
const makeRef = () => `WW-${chunk(4)}-${chunk(4)}`;
const makeKey = () => `${chunk(4)}-${chunk(4)}-${chunk(4)}`;
const hashKey = (key, salt) => crypto.scryptSync(key, salt, 32);
function verifyKey(key, saltHex, hashHex) {
  try { return crypto.timingSafeEqual(hashKey(key, Buffer.from(saltHex, 'hex')), Buffer.from(hashHex, 'hex')); }
  catch { return false; }
}
const clip = (s, n) => String(s ?? '').slice(0, n);
const today = () => new Date().toISOString().slice(0, 10); // date only — no time

/* ---- store ---- */
export const reports = {
  create(input) {
    const ref = makeRef();
    const accessKey = makeKey();
    const salt = crypto.randomBytes(16);
    const rec = {
      ref,
      keySalt: salt.toString('hex'),
      keyHash: hashKey(accessKey, salt).toString('hex'),
      category: clip(input.category, 80),
      detail: clip(input.detail, 5000),
      area: clip(input.area, 120),
      when: clip(input.when, 120),
      severity: clip(input.severity, 40),
      others: clip(input.others, 200),
      status: 'Submitted',
      updates: [],            // handler-visible status notes (shown to reporter)
      messages: [],           // two-way anonymous thread
      createdDate: today(),   // coarse
      seq: ++db.seq,
    };
    db.reports[ref] = rec; save();
    return { ref, accessKey };
  },
  reporterView(ref, key) {
    const r = db.reports[ref];
    if (!r || !verifyKey(key, r.keySalt, r.keyHash)) return null;
    return reporterShape(r);
  },
  reporterMessage(ref, key, text) {
    const r = db.reports[ref];
    if (!r || !verifyKey(key, r.keySalt, r.keyHash)) return null;
    r.messages.push({ from: 'reporter', text: clip(text, 5000), seq: ++db.seq });
    save(); return reporterShape(r);
  },
  adminList(status) {
    purge();
    return Object.values(db.reports)
      .filter(r => !status || r.status === status)
      .sort((a, b) => b.seq - a.seq)
      .map(adminShape);
  },
  adminGet(ref) { const r = db.reports[ref]; return r ? adminShape(r) : null; },
  adminUpdate(ref, { status, note }) {
    const r = db.reports[ref]; if (!r) return null;
    if (status) r.status = clip(status, 40);
    if (status || note) r.updates.push({ status: r.status, note: clip(note, 2000), date: today() });
    if (note) r.messages.push({ from: 'handler', text: clip(note, 2000), seq: ++db.seq });
    save(); return adminShape(r);
  },
};

function reporterShape(r) {
  return {
    ref: r.ref, category: r.category, severity: r.severity, status: r.status,
    createdDate: r.createdDate, updates: r.updates,
    messages: r.messages.map(m => ({ from: m.from, text: m.text })),
  };
}
function adminShape(r) { const { keySalt, keyHash, ...rest } = r; return rest; } // no reporter identity exists to redact

function purge() {
  const days = Number(process.env.REPORT_RETENTION_DAYS || 0);
  if (!days) return;
  const cutoff = Date.now() - days * 864e5;
  let changed = false;
  for (const [ref, r] of Object.entries(db.reports)) {
    if (/resolved|closed/i.test(r.status) && Date.parse(r.createdDate + 'T00:00:00Z') < cutoff) {
      delete db.reports[ref]; changed = true;
    }
  }
  if (changed) save();
}

/* ---- memory-only, IP-hashed, rotating-salt limiter (never logs/persists IPs) ---- */
function makeLimiter({ windowMs, max }) {
  let salt = crypto.randomBytes(16), windowStart = Date.now();
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    if (now - windowStart > windowMs) { hits.clear(); salt = crypto.randomBytes(16); windowStart = now; }
    const ip = req.socket.remoteAddress || '';
    const key = crypto.createHash('sha256').update(salt).update(ip).digest('hex').slice(0, 16);
    const n = (hits.get(key) || 0) + 1; hits.set(key, n);
    if (n > max) return res.status(429).json({ error: 'Too many reports from this connection. Please try again later.' });
    next();
  };
}

/* ---- router ---- */
export function reportsRouter() {
  const r = express.Router();
  const limiter = makeLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

  // Submit — anonymous. Returns ref + one-time access key (never recoverable).
  r.post('/report', limiter, (req, res) => {
    const { category, detail, area, when, severity, others } = req.body || {};
    if (!detail || !String(detail).trim()) return res.status(400).json({ error: 'A description is required' });
    const { ref, accessKey } = reports.create({ category, detail, area, when, severity, others });
    res.json({
      ref, accessKey,
      notice: 'Save your reference and access key — they are the only way to follow up, anonymously. They cannot be recovered.',
    });
  });

  // Reporter checks status / thread (proves ownership with the access key header).
  r.get('/report/:ref', (req, res) => {
    const v = reports.reporterView(req.params.ref, req.get('x-report-key') || '');
    if (!v) return res.status(404).json({ error: 'Not found or wrong access key' });
    res.json(v);
  });

  // Reporter adds follow-up info — still anonymous.
  r.post('/report/:ref/message', limiter, (req, res) => {
    const v = reports.reporterMessage(req.params.ref, req.get('x-report-key') || '', (req.body || {}).text || '');
    if (!v) return res.status(404).json({ error: 'Not found or wrong access key' });
    res.json(v);
  });

  // ---- Handler (ombudsperson) API — MUST sit behind strong auth in production ----
  const admin = (req, res, next) => {
    const t = req.get('x-admin-token') || '';
    if (!config.reports.adminToken || t.length !== config.reports.adminToken.length ||
        !crypto.timingSafeEqual(Buffer.from(t), Buffer.from(config.reports.adminToken))) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };
  r.get('/admin/reports', admin, (req, res) => res.json(reports.adminList(req.query.status)));
  r.get('/admin/reports/:ref', admin, (req, res) => {
    const v = reports.adminGet(req.params.ref); if (!v) return res.status(404).json({ error: 'Not found' }); res.json(v);
  });
  r.post('/admin/reports/:ref/status', admin, (req, res) => {
    const v = reports.adminUpdate(req.params.ref, req.body || {}); if (!v) return res.status(404).json({ error: 'Not found' }); res.json(v);
  });

  return r;
}
