/* Tiny file-backed JSON store. Fine for a dev skeleton — swap for Firestore /
   Postgres / D1 in production (see docs/MPESA_INTEGRATION.md §8). */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const FILE = join(DIR, 'db.json');

let db = { transactions: {}, entitlements: [], ledger: [], payouts: [] };

function load() {
  try { if (existsSync(FILE)) db = { transactions: {}, entitlements: [], ledger: [], payouts: [], ...JSON.parse(readFileSync(FILE, 'utf8')) }; } catch { /* start fresh */ }
}
const rid = (p) => p + Math.random().toString(36).slice(2, 10).toUpperCase();
function save() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(db, null, 2));
}
load();

export const store = {
  // transactions keyed by CheckoutRequestID
  putTx(id, tx) { db.transactions[id] = { id, ...tx }; save(); return db.transactions[id]; },
  getTx(id) { return db.transactions[id] || null; },
  patchTx(id, patch) {
    if (!db.transactions[id]) return null;
    db.transactions[id] = { ...db.transactions[id], ...patch };
    save(); return db.transactions[id];
  },
  listTx() { return Object.values(db.transactions).sort((a, b) => b.createdAt - a.createdAt); },

  addEntitlement(e) { db.entitlements.unshift({ ...e, grantedAt: Date.now() }); save(); },
  entitlementsFor(owner) { return db.entitlements.filter(e => e.owner === owner); },
  hasEntitlement(owner, grant) { return db.entitlements.some(e => e.owner === owner && e.grant === grant); },

  // commission ledger (one entry per paid session), keyed by txId
  addLedger(l) { db.ledger.unshift({ ...l }); save(); return db.ledger[0]; },
  listLedger() { return db.ledger; },
  getLedger(txId) { return db.ledger.find(l => l.txId === txId) || null; },
  patchLedger(txId, patch) { const l = db.ledger.find(x => x.txId === txId); if (l) { Object.assign(l, patch); save(); } return l; },

  // B2C payouts
  addPayout(p) { const rec = { id: rid('PO-'), createdAt: Date.now(), ...p }; db.payouts.unshift(rec); save(); return rec; },
  getPayout(id) { return db.payouts.find(x => x.id === id) || null; },
  patchPayout(id, patch) { const p = db.payouts.find(x => x.id === id); if (p) { Object.assign(p, patch); save(); } return p; },
  listPayouts() { return db.payouts; },
  findPayoutByConversation(cid) { return db.payouts.find(x => x.conversationId === cid) || null; },
};
