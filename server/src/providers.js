/* Server-owned counselling provider rates (whole KES). Mirrors the app's
   PROVIDERS list so a booking is priced server-side by provider id — the client
   never sends an amount. Keep in sync with js/data.js PROVIDERS. rate 0 = free. */

export const PROVIDER_RATES = {
  p1: { name: 'Priscilla Maina', rate: 2000 },
  p2: { name: 'Dr. Amina Yusuf', rate: 3500 },
  p3: { name: 'Samuel Otieno', rate: 2500 },
  p4: { name: 'Grace Wambui', rate: 1800 },
  p5: { name: 'Peter Njoroge', rate: 5000 },
  g1: { name: 'Managing Stress Together', rate: 0 },
};

export function getProviderRate(id) {
  return PROVIDER_RATES[id] || null;
}
