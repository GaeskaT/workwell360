/* Server-owned price list. The client NEVER sends an amount — it sends an item id,
   and the server looks up the trusted price here. Prices in whole KES.
   Keys match the app's product ids (js/data.js PRODUCTS) so the store maps 1:1,
   plus a fixed counselling session and premium membership.
   `grant` is what gets unlocked on the client (course id / product id / flag). */

export const CATALOG = {
  // Courses (grant = COURSES id)
  'c-stress':  { name: 'Managing Workplace Stress', price: 1500, ref: 'WW-C-STR', kind: 'course', grant: 'stress' },
  'c-burnout': { name: 'Preventing Burnout',        price: 1800, ref: 'WW-C-BRN', kind: 'course', grant: 'burnout' },
  'c-anger':   { name: 'Managing Anger',            price: 1500, ref: 'WW-C-ANG', kind: 'course', grant: 'anger' },
  'c-eq':      { name: 'Emotional Intelligence',    price: 2000, ref: 'WW-C-EQ',  kind: 'course', grant: 'eq' },
  'c-balance': { name: 'Work–Life Balance',         price: 1500, ref: 'WW-C-BAL', kind: 'course', grant: 'balance' },
  'c-finance': { name: 'Financial Wellness',        price: 2500, ref: 'WW-C-FIN', kind: 'course', grant: 'finance' },
  'c-rel':     { name: 'Healthy Relationships',     price: 1800, ref: 'WW-C-REL', kind: 'course', grant: 'rel' },

  // Journals (grant = product id)
  'j-men':     { name: 'Self-Care Journal for Men',   price: 850,  ref: 'WW-J-MEN', kind: 'journal', grant: 'j-men' },
  'j-women':   { name: 'Self-Care Journal for Women', price: 850,  ref: 'WW-J-WMN', kind: 'journal', grant: 'j-women' },
  'j-stress':  { name: 'Stress Journal',              price: 700,  ref: 'WW-J-STR', kind: 'journal', grant: 'j-stress' },
  'j-burnout': { name: 'Burnout Recovery Journal',    price: 950,  ref: 'WW-J-BRN', kind: 'journal', grant: 'j-burnout' },
  'j-anger':   { name: 'Anger Management Journal',     price: 750,  ref: 'WW-J-ANG', kind: 'journal', grant: 'j-anger' },
  'j-grief':   { name: 'Grief Journal',               price: 750,  ref: 'WW-J-GRF', kind: 'journal', grant: 'j-grief' },

  // Real-world services / membership
  'session_counsel': { name: 'Counselling session', price: 2000, ref: 'WW-SESSION', kind: 'session', grant: 'session' },
  'membership_prem': { name: 'Premium membership (1 mo)', price: 500, ref: 'WW-PREMIUM', kind: 'membership', grant: 'premium' },
};

export function getItem(id) {
  return CATALOG[id] || null;
}
