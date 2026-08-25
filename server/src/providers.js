/* Server-owned counselling provider rates (whole KES) + payout numbers.
   Mirrors the app's PROVIDERS list so a booking is priced server-side by
   provider id — the client never sends an amount. rate 0 = free.
   `payout` is the counsellor's B2C payout MSISDN, set during onboarding; it is
   NEVER sent to the client and never stored on a payout record (only masked).
   Keep in sync with js/data.js PROVIDERS.  (254708374149 = Safaricom sandbox test.) */

export const PROVIDER_RATES = {
  p1: { name: 'Priscilla Maina', rate: 2000, payout: '254708374149' },
  p2: { name: 'Dr. Amina Yusuf', rate: 3500, payout: '254708374149' },
  p3: { name: 'Samuel Otieno', rate: 2500, payout: '254708374149' },
  p4: { name: 'Grace Wambui', rate: 1800, payout: '254708374149' },
  p5: { name: 'Peter Njoroge', rate: 5000, payout: '254708374149' },
  g1: { name: 'Managing Stress Together', rate: 0, payout: '' },
};

export function getProviderRate(id) {
  return PROVIDER_RATES[id] || null;
}
