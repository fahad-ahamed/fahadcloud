export const appConfig = {
  // Server
  serverIp: process.env.SERVER_IP || 'localhost',
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  appUrl: process.env.APP_URL || `http://${process.env.SERVER_IP || 'localhost'}:${process.env.PORT || '3000'}`,

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod',
    cookieName: 'fahadcloud-token',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/fahadcloud',
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
    zonesDir: process.env.DNS_ZONES_DIR || '/home/fahad/dns/zones',
    configDir: process.env.DNS_CONFIG_DIR || '/home/fahad/dns/config',
    dnsmasqConf: process.env.DNS_DNSMASQ_CONF || '/home/fahad/dns/dnsmasq.conf',
    dnsmasqHosts: process.env.DNS_DNSMASQ_HOSTS || '/home/fahad/dns/hosts',
    ns1: 'ns1.fahadcloud.com',
    ns2: 'ns2.fahadcloud.com',
  },

  // Hosting
  hosting: {
    baseDir: process.env.HOSTING_BASE_DIR || '/home/fahad/hosting',
    usersDir: process.env.HOSTING_USERS_DIR || '/home/fahad/hosting/users',
    sslDir: process.env.HOSTING_SSL_DIR || '/home/fahad/hosting/ssl',
    nginxDir: process.env.HOSTING_NGINX_DIR || '/home/fahad/hosting/nginx',
  },

  // Project root (for admin file management, system commands, etc.)
  projectRoot: process.env.PROJECT_ROOT || process.cwd(),

  // Admin
  admin: {
    superAdminEmail: process.env.ADMIN_EMAIL || 'admin@fahadcloud.com',
    defaultBalance: parseInt(process.env.ADMIN_DEFAULT_BALANCE || '0'),
    defaultStorageLimit: parseInt(process.env.DEFAULT_STORAGE_LIMIT || '107374182400'), // 100GB
  },

  // Free TLDs
  freeTlds: ['fahadcloud.com', 'tk', 'ml', 'ga', 'cf', 'eu.org', 'pp.ua'],
} as const;

export type AppConfig = typeof appConfig;
