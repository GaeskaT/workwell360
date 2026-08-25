/* Server-owned price list. The client NEVER sends an amount — it sends an item id,
   and the server looks up the trusted price here. Prices in whole KES. */

export const CATALOG = {
  // Digital courses (see Play-billing caveat in docs/MPESA_INTEGRATION.md §9)
  course_stress:   { name: 'Managing Stress', price: 1500, ref: 'WW-CRS-STR', kind: 'course',  grant: 'stress'  },
  course_burnout:  { name: 'Preventing Burnout', price: 1800, ref: 'WW-CRS-BRN', kind: 'course', grant: 'burnout' },
  course_retire:   { name: 'Preparing for Retirement', price: 3500, ref: 'WW-CRS-RET', kind: 'course', grant: 'retire' },

  // Journals (digital goods)
  journal_burnout: { name: 'Burnout Recovery Journal', price: 950, ref: 'WW-JRN-BRN', kind: 'journal', grant: 'j-burnout' },
  journal_retire:  { name: 'Retirement Transition Journal', price: 1200, ref: 'WW-JRN-RET', kind: 'journal', grant: 'j-retire' },

  // Real-world services (Play-billing exempt — fine to sell via M-Pesa in-app)
  session_counsel: { name: 'Counselling session', price: 2000, ref: 'WW-SESSION', kind: 'session', grant: 'session' },
  workshop_stress: { name: 'Stress workshop seat', price: 2500, ref: 'WW-WKSHOP', kind: 'workshop', grant: 'workshop' },

  // Membership (recurring in a later phase; one-off here for testing)
  membership_prem: { name: 'Premium membership (1 mo)', price: 500, ref: 'WW-PREMIUM', kind: 'membership', grant: 'premium' },
};

export function getItem(id) {
  return CATALOG[id] || null;
}
