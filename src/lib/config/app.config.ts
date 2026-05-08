export const appConfig = {
  // Server
  serverIp: process.env.SERVER_IP || '52.201.210.162',
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod',
    cookieName: 'fahadcloud-token',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'file:./db/fahadcloud.db',
  },

  // SMTP
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },

  // bKash
  bkash: {
    apiKey: process.env.BKASH_API_KEY || '',
    apiSecret: process.env.BKASH_API_SECRET || '',
    merchantNumber: process.env.BKASH_MERCHANT_NUMBER || '',
    apiUrl: process.env.BKASH_API_URL || 'https://checkout.pay.bka.sh/v1.2.0-beta',
  },

  // Currency
  currency: {
    usdToBdtRate: parseFloat(process.env.USD_TO_BDT || '110'),
  },

  // Storage
  storage: {
    defaultLimit: 5368709120, // 5GB in bytes
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },

  // Rate limits
  rateLimits: {
    login: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
    register: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
    domainSearch: { maxRequests: 30, windowMs: 60 * 1000 },
    paymentSubmit: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
    shellExecute: { maxRequests: 10, windowMs: 60 * 1000 },
  },

  // DNS
  dns: {
    zonesDir: '/home/fahad/dns/zones',
    configDir: '/home/fahad/dns/config',
    ns1: 'ns1.fahadcloud.com',
    ns2: 'ns2.fahadcloud.com',
  },

  // Hosting
  hosting: {
    baseDir: '/home/fahad/hosting',
    usersDir: '/home/fahad/hosting/users',
    sslDir: '/home/fahad/hosting/ssl',
  },

  // Free TLDs
  freeTlds: ['fahadcloud.com', 'tk', 'ml', 'ga', 'cf', 'eu.org', 'pp.ua'],
} as const;

export type AppConfig = typeof appConfig;
