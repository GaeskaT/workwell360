/* Grant access after a confirmed payment. In a real system this is where you'd
   flip a course to "owned", confirm a booking, or start a membership period. */
import { store } from './store.js';
import { getItem } from './catalog.js';

export function grantEntitlement(tx) {
  const item = getItem(tx.item);
  if (!item) return null;
  const owner = tx.owner || 'anon';
  if (store.hasEntitlement(owner, item.grant)) return null; // idempotent
  const ent = {
    owner, kind: item.kind, grant: item.grant, item: tx.item,
    source: tx.id, receipt: tx.receipt || null,
    expiresAt: item.kind === 'membership' ? Date.now() + 30 * 864e5 : null,
  };
  store.addEntitlement(ent);
  return ent;
}
