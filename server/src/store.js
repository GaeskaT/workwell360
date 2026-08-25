/* Tiny file-backed JSON store. Fine for a dev skeleton — swap for Firestore /
   Postgres / D1 in production (see docs/MPESA_INTEGRATION.md §8). */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const FILE = join(DIR, 'db.json');

let db = { transactions: {}, entitlements: [] };

function load() {
  try { if (existsSync(FILE)) db = JSON.parse(readFileSync(FILE, 'utf8')); } catch { /* start fresh */ }
}
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
};
