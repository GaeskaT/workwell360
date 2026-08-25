import 'dotenv/config';

const env = (process.env.MPESA_ENV || '').toLowerCase();
const hasCreds = !!process.env.MPESA_CONSUMER_KEY;

// MOCK mode: no Safaricom calls. Auto-on when creds are missing, or MPESA_ENV=mock.
export const MOCK = env === 'mock' || !hasCreds;

const isProd = env === 'production';

export const config = {
  port: Number(process.env.PORT || 8790),
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map(s => s.trim()),
  mock: MOCK,
  env: MOCK ? 'mock' : (isProd ? 'production' : 'sandbox'),
  baseUrl: isProd ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke',
  devRoutes: (process.env.DEV_ROUTES || 'true').toLowerCase() === 'true',
  reports: { adminToken: process.env.REPORT_ADMIN_TOKEN || '' },
  payouts: {
    platformPct: Number(process.env.COMMISSION_PLATFORM_PCT || 0.2), // platform keeps 20%
    maxAuto: Number(process.env.PAYOUT_MAX_AUTO || 20000),           // above this needs approval
    adminToken: process.env.PAYOUT_ADMIN_TOKEN || process.env.REPORT_ADMIN_TOKEN || '',
    b2c: {
      shortcode: process.env.MPESA_B2C_SHORTCODE || '',
      initiator: process.env.MPESA_B2C_INITIATOR || '',
      securityCredential: process.env.MPESA_B2C_SECURITY_CREDENTIAL || '',
    },
  },

  mpesa: {
    key: process.env.MPESA_CONSUMER_KEY || '',
    secret: process.env.MPESA_CONSUMER_SECRET || '',
    passkey: process.env.MPESA_PASSKEY || '',
    shortcode: process.env.MPESA_SHORTCODE || '174379',
    callbackBase: process.env.MPESA_CALLBACK_BASE || '',
    callbackSecret: process.env.MPESA_CALLBACK_SECRET || 'dev-secret',
  },
};

export function banner() {
  return [
    `WorkWell 360 payments — mode: ${config.env.toUpperCase()}${config.mock ? ' (no Safaricom calls)' : ''}`,
    config.mock
      ? '  → MOCK: set MPESA_CONSUMER_KEY + MPESA_ENV=sandbox in .env to hit Daraja for real.'
      : `  → Callback: ${config.mpesa.callbackBase}/mpesa/callback/****`,
  ].join('\n');
}
