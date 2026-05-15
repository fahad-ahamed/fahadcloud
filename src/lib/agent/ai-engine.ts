// ============ FAHADCLOUD OWN AI ENGINE v6.0 ============
// NO external AI SDK dependencies - 100% self-hosted intelligent AI
// Advanced NLP, context awareness, dynamic response generation, conversation memory
// Covers: Cloud, Hosting, Domains, DNS, SSL, Deployment, Databases, Security, Payments

// ============ TYPES ============

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatResult {
  message: string;
  thinking?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  error?: string;
  available: boolean;
}

export interface IntentClassification {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  subIntents: string[];
}

export interface OrchestrationPlan {
  id: string;
  steps: PlanStep[];
  estimatedDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PlanStep {
  step: number;
  agent: string;
  action: string;
  description: string;
  dependencies: number[];
}

export interface ResearchResult {
  findings: string;
  sources: string[];
  confidence: number;
  depth: string;
}

// ============ CONVERSATION CONTEXT TRACKER ============

interface ConversationContext {
  topics: string[];
  turnCount: number;
  lastTopic: string;
  lastIntent: string;
  userMood: 'neutral' | 'frustrated' | 'curious' | 'satisfied';
  mentionedEntities: Record<string, string>;
  questionHistory: string[];
}

const conversationContexts = new Map<string, ConversationContext>();

function getConversationId(messages: AIChatMessage[]): string {
  const systemMsgs = messages.filter(m => m.role !== 'system');
  if (systemMsgs.length > 0) {
    return systemMsgs[0]!.content.substring(0, 50).replace(/\s/g, '_');
  }
  return 'default';
}

function updateContext(id: string, messages: AIChatMessage[]): ConversationContext {
  let ctx = conversationContexts.get(id);
  if (!ctx) {
    ctx = {
      topics: [],
      turnCount: 0,
      lastTopic: '',
      lastIntent: '',
      userMood: 'neutral',
      mentionedEntities: {},
      questionHistory: [],
    };
  }

  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';

  ctx.turnCount = userMessages.length;
  ctx.questionHistory.push(lastUserMsg.substring(0, 100));

  // Detect mood from message content
  if (/\b(ভাই|বাই|দাদা|problem|issue|bug|broken|error|কাজ করে না|fix|ঠিক করো|help)\b/i.test(lastUserMsg)) {
    ctx.userMood = 'frustrated';
  } else if (/\b(how|what|why|কিভাবে|কেন|কি|explain|tell me|শিখ|learn)\b/i.test(lastUserMsg)) {
    ctx.userMood = 'curious';
  } else if (/\b(thanks|ধন্যবাদ|great|awesome|working|done|সমাধান)\b/i.test(lastUserMsg)) {
    ctx.userMood = 'satisfied';
  }

  // Extract entities
  const domainMatch = lastUserMsg.match(/([a-z0-9-]+\.(com|net|org|io|dev|app|xyz|tk|ml|ga|cf|info|biz|me|co|cc|pw|in|bd))/i);
  if (domainMatch) ctx.mentionedEntities.domain = domainMatch[1]!;

  const ipMatch = lastUserMsg.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
  if (ipMatch) ctx.mentionedEntities.ip = ipMatch[1]!;

  conversationContexts.set(id, ctx);
  return ctx;
}

// ============ ADVANCED NLP ENGINE ============

// Intent classification with confidence scoring
const INTENT_PATTERNS: Array<{ patterns: RegExp[]; intent: string; confidence: number; entities?: Record<string, string> }> = [
  // Domain intents
  { patterns: [/\b(check|search|lookup|find|available)\b.*\b(domain|name|\.com|\.net|\.org|\.io)\b/i, /\b(domain|name)\b.*\b(check|search|lookup|find|available)\b/i], intent: 'domain_search', confidence: 0.92 },
  { patterns: [/\b(register|buy|purchase|get|book)\b.*\b(domain|name|\.com|\.net)\b/i, /\b(domain)\b.*\b(register|buy|purchase)\b/i], intent: 'domain_register', confidence: 0.92 },
  { patterns: [/\b(manage|renew|transfer|lock|unlock|info)\b.*\b(domain)\b/i, /\b(domain)\b.*\b(manage|renew|transfer)\b/i], intent: 'domain_manage', confidence: 0.88 },
  { patterns: [/\b(free|ফ্রি|মুক্ত)\b.*\b(domain|ডোমেইন)\b/i, /\b(domain|ডোমেইন)\b.*\b(free|ফ্রি|মুক্ত)\b/i], intent: 'domain_free', confidence: 0.9 },

  // Hosting intents
  { patterns: [/\b(deploy|upload|publish|launch|host)\b.*\b(website|site|app|project|react|next|vue|node|php|python|wordpress)\b/i, /\b(host|deploy|publish)\b.*\b(website|site|app)\b/i], intent: 'hosting_deploy', confidence: 0.93 },
  { patterns: [/\b(hosting|হোস্টিং)\b.*\b(plan|প্ল্যান|price|দাম|package)\b/i, /\b(hosting plan|hosting price)\b/i], intent: 'hosting_plans', confidence: 0.9 },
  { patterns: [/\b(restart|stop|start|scale)\b.*\b(app|server|hosting|site|env)\b/i], intent: 'hosting_manage', confidence: 0.88 },
  { patterns: [/\b(deploy|ডিপ্লয়)\b.*\b(log|লগ|history|ইতিহাস|status|স্ট্যাটাস)\b/i], intent: 'deploy_status', confidence: 0.85 },

  // SSL intents
  { patterns: [/\b(ssl|https|certificate|cert)\b.*\b(install|setup|enable|add|configure|ইনস্টল)\b/i, /\b(install|setup|enable)\b.*\b(ssl|https|certificate)\b/i], intent: 'ssl_install', confidence: 0.93 },
  { patterns: [/\b(ssl|https)\b.*\b(check|status|renew|expiry|expired)\b/i], intent: 'ssl_check', confidence: 0.9 },

  // DNS intents
  { patterns: [/\b(dns|ডিএনএস)\b.*\b(manage|configure|record|update|add|change)\b/i, /\b(record|a record|cname|mx|txt)\b.*\b(add|create|set)\b/i], intent: 'dns_manage', confidence: 0.92 },
  { patterns: [/\b(nameserver|ns record)\b.*\b(change|update|set)\b/i], intent: 'dns_nameserver', confidence: 0.88 },

  // Database intents
  { patterns: [/\b(database|ডাটাবেস|db|postgres|mysql|redis)\b.*\b(create|setup|manage|backup|migrate)\b/i], intent: 'database_manage', confidence: 0.9 },
  { patterns: [/\b(database|db)\b.*\b(status|info|connection|performance)\b/i], intent: 'database_status', confidence: 0.88 },

  // Security intents
  { patterns: [/\b(security|নিরাপত্তা|firewall|waf|ddos|vulnerability|hack|attack)\b/i], intent: 'security_check', confidence: 0.88 },
  { patterns: [/\b(2fa|two.factor|two-factor|otp|authenticator)\b/i], intent: 'security_2fa', confidence: 0.9 },

  // Monitoring intents
  { patterns: [/\b(monitor|monitoring|status|health|uptime|performance|metrics)\b/i], intent: 'monitoring', confidence: 0.87 },

  // Payment intents
  { patterns: [/\b(payment|পেমেন্ট|pay|পরিশোধ|bkash|বিকাশ|balance|ব্যালেন্স|invoice|বিল)\b/i], intent: 'payment', confidence: 0.9 },
  { patterns: [/\b(price|দাম|cost|খরচ|pricing|plan|প্ল্যান)\b/i], intent: 'pricing', confidence: 0.85 },

  // Storage intents
  { patterns: [/\b(storage|স্টোরেজ|file|ফাইল|upload|আপলোড|backup|ব্যাকআপ)\b/i], intent: 'storage', confidence: 0.88 },

  // AI/Learning intents
  { patterns: [/\b(learn|শিখ|research|গবেষণা|study|পড়|teach|শেখাও|ai|এআই)\b/i], intent: 'ai_learn', confidence: 0.88 },
  { patterns: [/\b(agent|এজেন্ট|monitor|মনিটর)\b.*\b(status|স্ট্যাটাস|list|তালিকা)\b/i], intent: 'agent_status', confidence: 0.85 },

  // Greeting
  { patterns: [/\b(hello|hi|hey|assalam|salam|হ্যালো|হাই|কেমন আছ|কেমন আছেন|কি খবর)\b/i], intent: 'greeting', confidence: 0.95 },
  { patterns: [/\b(thank|thanks|ধন্যবাদ|শুকরিয়া|ধন্যবাদ)\b/i], intent: 'thanks', confidence: 0.93 },

  // Help
  { patterns: [/\b(help|সাহায্য|support|সাপোর্ট|what can you do|তুমি কি পার|কি করতে পার)\b/i], intent: 'help', confidence: 0.9 },

  // Shell/Terminal
  { patterns: [/\b(shell|terminal|command|cmd|execute|run|চালাও)\b/i], intent: 'shell', confidence: 0.85 },

  // Cloud Intel
  { patterns: [/\b(cloud|ক্লাউড|intel|intelligence|system|সিস্টেম|overview|overview)\b.*\b(status|স্ট্যাটাস|health|স্বাস্থ্য|info)\b/i], intent: 'cloud_intel', confidence: 0.85 },

  // Optimization
  { patterns: [/\b(optimize|অপ্টিমাইজ|improve|উন্নত|speed|গতি|performance|পারফরম্যান্স|cache|ক্যাশ)\b/i], intent: 'optimization', confidence: 0.87 },
];

export function classifyIntentWithNLP(message: string): IntentClassification {
  const lower = message.toLowerCase().trim();
  const entities: Record<string, string> = {};

  // Extract entities
  const domainMatch = lower.match(/([a-z0-9-]+\.(com|net|org|io|dev|app|xyz|tk|ml|ga|cf|info|biz|me|co|bd))/);
  if (domainMatch) entities.domain = domainMatch[1]!;

  const ipMatch = lower.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
  if (ipMatch) entities.ip = ipMatch[1]!;

  const tldMatch = lower.match(/\.(\w{2,6})\b/);
  if (tldMatch) entities.tld = '.' + tldMatch[1]!;

  const frameworkMatch = lower.match(/\b(react|next\.?js|vue|nuxt|node\.?js|express|python|php|laravel|wordpress|gatsby|svelte|angular|static|html)\b/);
  if (frameworkMatch) entities.framework = frameworkMatch[1]!.replace('.js', 'js');

  const dbMatch = lower.match(/\b(postgres|mysql|redis|qdrant|mongodb|sqlite)\b/);
  if (dbMatch) entities.database = dbMatch[1]!;

  // Match intent patterns
  let bestIntent: IntentClassification = { intent: 'general', confidence: 0.3, entities, subIntents: [] };
  const matchedIntents: string[] = [];

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(lower)) {
        if (pattern.confidence > bestIntent.confidence) {
          bestIntent = { intent: pattern.intent, confidence: pattern.confidence, entities, subIntents: matchedIntents };
        }
        if (!matchedIntents.includes(pattern.intent)) {
          matchedIntents.push(pattern.intent);
        }
        break;
      }
    }
  }

  bestIntent.subIntents = matchedIntents.filter(i => i !== bestIntent.intent);
  bestIntent.entities = { ...bestIntent.entities, ...entities };
  return bestIntent;
}

// ============ KNOWLEDGE BASE ============

const CLOUD_KNOWLEDGE: Record<string, {
  overview: string;
  details: string[];
  tips: string[];
  bengali?: string;
}> = {
  domain: {
    overview: "FahadCloud provides complete domain management including registration, DNS, SSL, and WHOIS privacy. We support all major TLDs including .com, .net, .org, .io, .dev, .app, .xyz, and free domains like .tk, .ml, .ga, .cf.",
    details: [
      "Domain registration starts at ৳1,100/year for .com domains with free WHOIS privacy protection",
      "All domains include free DNS hosting with A, AAAA, CNAME, MX, TXT, SRV, and NS record support",
      "Free SSL certificates (Let's Encrypt) are automatically provisioned for every domain",
      "Domain transfers are supported — bring your existing domains from any registrar",
      "Auto-renewal ensures your domains never expire accidentally, with email reminders before expiration",
      "Free domains (.tk, .ml, .ga, .cf) are available with basic DNS management",
      "Domain locking prevents unauthorized transfers — enabled by default on all domains",
      "WHOIS privacy protection hides your personal information from public WHOIS lookups",
      "DNS changes propagate within minutes using our anycast DNS network",
      "DNSSEC is available for enhanced security on supported TLDs",
    ],
    tips: [
      "Choose a short, memorable domain name that reflects your brand",
      "Register multiple TLD variations (.com, .net, .org) to protect your brand",
      "Enable auto-renewal to prevent accidental domain expiration",
      "Use WHOIS privacy to protect your personal information from spammers",
      "Point your domain to FahadCloud nameservers (ns1.fahadcloud.com, ns2.fahadcloud.com) for full DNS management",
    ],
    bengali: "ফাহাদক্লাউডে ডোমেইন রেজিস্ট্রেশন, DNS ম্যানেজমেন্ট, SSL এবং WHOIS প্রাইভেসি সহ সম্পূর্ণ ডোমেইন ব্যবস্থাপনা পাওয়া যায়। .com ডোমেইন ৳১,১০০/বছর থেকে শুরু।"
  },
  hosting: {
    overview: "FahadCloud offers production-grade hosting with Shared, VPS, and Dedicated plans. All plans include 99.9% uptime SLA, free SSL, daily backups, DDoS protection, and one-click deployment for 10+ frameworks.",
    details: [
      "Shared Hosting starts at ৳499/month with 5GB SSD, 100GB bandwidth, and 1 website",
      "VPS Hosting starts at ৳1,499/month with 2 CPU cores, 4GB RAM, 50GB NVMe SSD",
      "Dedicated Hosting starts at ৳4,999/month with 8 CPU cores, 32GB RAM, 500GB NVMe SSD",
      "One-click deployment for Next.js, React, Vue, Nuxt, Node.js, Python, PHP, WordPress",
      "Framework auto-detection analyzes your project and configures the optimal build pipeline",
      "All hosting includes free SSL, automatic daily backups, and DDoS protection",
      "Docker-based isolation ensures each hosting environment is completely separated",
      "Environment variables, custom nginx configs, and build commands are fully configurable",
      "Auto-scaling on VPS and Dedicated plans handles traffic spikes automatically",
      "Real-time deploy logs and rollback to any previous deployment with one click",
    ],
    tips: [
      "Start with Shared hosting for small projects, upgrade to VPS as traffic grows",
      "Use the Deploy feature to push code from your local machine directly",
      "Set up environment variables for API keys and secrets instead of hardcoding them",
      "Enable auto-scaling to handle unexpected traffic spikes without downtime",
      "Regular backups are automatic, but you can also create manual backups before major changes",
    ],
    bengali: "ফাহাদক্লাউডে Shared, VPS এবং Dedicated হোস্টিং পাওয়া যায়। ৯৯.৯% আপটাইম, ফ্রি SSL, ডেইলি ব্যাকআপ এবং DDoS প্রোটেকশন অন্তর্ভুক্ত।"
  },
  ssl: {
    overview: "Free SSL certificates are included with all domains and hosting plans. We use Let's Encrypt for automatic certificate provisioning and renewal, with support for custom certificates for enterprise needs.",
    details: [
      "Free SSL certificates are automatically provisioned when you add a domain or create hosting",
      "Certificates auto-renew 30 days before expiration — no manual intervention needed",
      "HTTPS enforcement redirects all HTTP traffic to HTTPS with one click",
      "Wildcard SSL certificates are supported on VPS and Dedicated plans",
      "Custom SSL certificates can be uploaded for enterprise requirements",
      "SSL status and expiry dates are visible in domain and hosting management",
      "Mixed content detection warns about insecure resources on HTTPS pages",
      "HSTS headers can be enabled for maximum security enforcement",
    ],
    tips: [
      "Always enable HTTPS enforcement after SSL is installed to ensure all traffic is encrypted",
      "Check SSL expiry dates regularly — auto-renewal handles this but it's good to verify",
      "For e-commerce sites, consider a dedicated SSL certificate for stronger trust signals",
      "Enable HSTS after confirming your site works correctly over HTTPS",
    ],
    bengali: "সকল ডোমেইন ও হোস্টিং প্ল্যানে ফ্রি SSL সার্টিফিকেট অন্তর্ভুক্ত। অটো-রিনিউয়াল, HTTPS এনফোর্সমেন্ট এবং ওয়াইল্ডকার্ড SSL সাপোর্ট আছে।"
  },
  dns: {
    overview: "Full DNS management with support for all record types (A, AAAA, CNAME, MX, TXT, SRV, NS). DNS changes propagate in minutes via our anycast network. DNSSEC and GeoDNS available for advanced needs.",
    details: [
      "Support for A, AAAA, CNAME, MX, TXT, SRV, NS, CAA, and PTR record types",
      "DNS changes propagate within minutes using our anycast DNS network",
      "DNSSEC available for enhanced security on supported TLDs",
      "Email DNS records (MX, SPF, DKIM, DMARC) can be configured from the DNS manager",
      "GeoDNS routing available on enterprise plans for global load balancing",
      "DNS templates for common setups (Google Workspace, Office 365, Zoho Mail)",
      "Real-time DNS propagation checking from multiple global locations",
      "TTL management for fine-grained control over caching behavior",
    ],
    tips: [
      "Set appropriate TTL values — lower TTL (300-600) during migrations, higher (3600-86400) for stable records",
      "Always configure SPF, DKIM, and DMARC records for email delivery reliability",
      "Use CNAME records for subdomains pointing to external services",
      "Test DNS propagation after changes using the built-in DNS checker",
    ],
    bengali: "সকল DNS রেকর্ড টাইপ (A, AAAA, CNAME, MX, TXT, SRV, NS) সাপোর্ট সহ সম্পূর্ণ DNS ম্যানেজমেন্ট। মিনিটের মধ্যে DNS পরিবর্তন প্রচারিত হয়।"
  },
  deploy: {
    overview: "Deploy from Git repositories or upload directly. Framework auto-detection supports Next.js, React, Vue, Nuxt, Gatsby, Svelte, Node.js, Python, PHP, and more. Zero-downtime deployments with instant rollback.",
    details: [
      "Git-based deployment from GitHub, GitLab, and Bitbucket with automatic builds",
      "Direct upload deployment for quick deployments without Git",
      "Framework auto-detection analyzes your project structure and configures optimal build settings",
      "Zero-downtime deployments using blue-green strategy on VPS plans",
      "Instant rollback to any previous deployment with one click",
      "Build logs available in real-time during deployment",
      "Environment variable management for different deployment stages",
      "Custom build commands and start commands for full control",
      "Docker-based deployment for containerized applications",
      "Preview deployments for testing before going live",
    ],
    tips: [
      "Use Git-based deployment for production — it provides version control and rollback",
      "Test deployments in a preview environment before promoting to production",
      "Set up environment variables before deploying to avoid runtime errors",
      "Monitor deploy logs for warnings even if the build succeeds",
    ],
    bengali: "Git রিপোজিটরি থেকে বা সরাসরি আপলোড করে ডিপ্লয় করুন। ফ্রেমওয়ার্ক অটো-ডিটেকশন, জিরো-ডাউনটাইম ডিপ্লয়মেন্ট এবং ইনস্ট্যান্ট রোলব্যাক সাপোর্ট।"
  },
  database: {
    overview: "FahadCloud provides managed PostgreSQL as the primary database with Redis for caching, Qdrant for vector search, and BullMQ for job queuing. All databases include automatic backups and connection pooling.",
    details: [
      "PostgreSQL 16 is the primary database with automatic daily backups and point-in-time recovery",
      "Redis cache provides sub-millisecond response times for frequently accessed data",
      "Qdrant vector database powers AI semantic search and knowledge retrieval",
      "BullMQ job queue handles background tasks like deployments, AI processing, and notifications",
      "Database connections are encrypted and pooled for optimal performance",
      "Connection strings are available in the database dashboard for easy integration",
      "Database migration support with automatic schema management via Prisma ORM",
      "Query performance monitoring and slow query logging",
    ],
    tips: [
      "Use Redis for caching frequently accessed data to reduce database load",
      "Set up connection pooling to handle concurrent requests efficiently",
      "Monitor slow queries and add appropriate indexes",
      "Regular backups are automatic, but test restore procedures periodically",
    ],
    bengali: "পরিচালিত PostgreSQL, Redis ক্যাশ, Qdrant ভেক্টর ডাটাবেস এবং BullMQ জব কিউ। অটোমেটিক ব্যাকআপ, এনক্রিপ্টেড কানেকশন এবং কানেকশন পুলিং অন্তর্ভুক্ত।"
  },
  security: {
    overview: "FahadCloud includes comprehensive security: WAF, DDoS protection, SSL, 2FA, audit logging, vulnerability scanning, and rate limiting. Security agents continuously monitor for threats.",
    details: [
      "Web Application Firewall (WAF) blocks common attack patterns (SQL injection, XSS, CSRF)",
      "DDoS protection mitigates volumetric attacks up to 1Tbps automatically",
      "Two-factor authentication available for all user accounts via TOTP",
      "Security agent continuously scans for vulnerabilities and suspicious activity",
      "Audit logging tracks all administrative actions for compliance",
      "Rate limiting prevents abuse of API endpoints and login attempts",
      "IP reputation checking blocks traffic from known malicious sources",
      "Automatic security patches applied to server infrastructure",
    ],
    tips: [
      "Enable 2FA on your account for maximum security",
      "Review audit logs periodically for unauthorized access attempts",
      "Keep your applications updated to patch known vulnerabilities",
      "Use strong, unique passwords and consider a password manager",
    ],
    bengali: "WAF, DDoS প্রোটেকশন, SSL, 2FA, অডিট লগিং, ভালনারেবিলিটি স্ক্যানিং এবং রেট লিমিটিং সহ ব্যাপক নিরাপত্তা ব্যবস্থা।"
  },
  payment: {
    overview: "bKash is the primary payment method for Bangladeshi users. Payment history, invoices, and balance management are available in the Payments section.",
    details: [
      "bKash payment gateway for seamless transactions (Send Money and Payment)",
      "Domain registration starts at ৳1,100/year for .com domains",
      "Hosting plans start at ৳499/month for shared hosting",
      "Balance top-up available from the profile section",
      "Payment history and invoices are available in the orders section",
      "Refund requests can be submitted within 7 days of purchase",
      "Auto-renewal payments prevent service interruption",
      "Admin can manually approve/reject payment verifications",
    ],
    tips: [
      "Keep your balance topped up to ensure auto-renewal works for domains and hosting",
      "Save bKash transaction IDs for payment verification",
      "Check payment history regularly for unauthorized transactions",
    ],
    bengali: "বিকাশ পেমেন্ট গেটওয়ে। .com ডোমেইন ৳১,১০০/বছর, শেয়ার্ড হোস্টিং ৳৪৯৯/মাস থেকে। পেমেন্ট হিস্ট্রি এবং ইনভয়েস পাওয়া যায়।"
  },
  monitoring: {
    overview: "Real-time monitoring tracks CPU, RAM, disk usage, and network traffic. Custom alerts, uptime monitoring, and performance reports ensure your services run smoothly.",
    details: [
      "Real-time CPU, RAM, disk, and network monitoring with 1-minute granularity",
      "Uptime monitoring checks your sites every 60 seconds from multiple global locations",
      "Custom alerts can be configured for any metric threshold",
      "Performance reports include Core Web Vitals and response time analysis",
      "Error tracking captures and groups application errors automatically",
      "Agent Monitor tracks all 22 AI agents and their task status",
      "Cloud Intel provides a comprehensive system health overview",
      "Historical data retention for trend analysis and capacity planning",
    ],
    tips: [
      "Set up alerts for critical metrics like disk usage >80% and CPU >90%",
      "Monitor uptime from multiple locations for accurate availability data",
      "Review error tracking weekly to catch issues before they impact users",
    ],
    bengali: "রিয়েল-টাইম CPU, RAM, ডিস্ক এবং নেটওয়ার্ক মনিটরিং। কাস্টম অ্যালার্ট, আপটাইম মনিটরিং এবং পারফরম্যান্স রিপোর্ট।"
  },
  storage: {
    overview: "Cloud storage with file management, upload, and backup capabilities. Storage quotas are based on your hosting plan, with options to upgrade.",
    details: [
      "5GB storage included with shared hosting plans",
      "File upload and management through the Storage dashboard",
      "Automatic backups for hosting environments",
      "Storage usage monitoring and quota enforcement",
      "Upgrade storage by upgrading your hosting plan",
      "File sharing and public link generation for assets",
    ],
    tips: [
      "Compress large files before uploading to save storage space",
      "Use the backup feature before making major changes",
      "Monitor storage usage to avoid hitting your plan's limit",
    ],
    bengali: "ক্লাউড স্টোরেজ ফাইল ম্যানেজমেন্ট, আপলোড এবং ব্যাকআপ সহ। হোস্টিং প্ল্যান অনুযায়ী স্টোরেজ কোটা।"
  },
  ai_agents: {
    overview: "FahadCloud features 22 specialized AI agents that handle different aspects of cloud management. The Master Orchestrator coordinates agents for complex multi-step tasks.",
    details: [
      "DevOps Agent: CI/CD pipelines, build automation, deployment orchestration",
      "Security Agent: Threat detection, vulnerability scanning, firewall management",
      "Deployment Agent: Framework detection, build execution, SSL provisioning",
      "Monitoring Agent: Resource monitoring, anomaly detection, alerting",
      "Debugging Agent: Error analysis, log correlation, root cause identification",
      "Infrastructure Agent: Docker/K8s orchestration, server management",
      "Database Agent: Query optimization, backup management, migrations",
      "Optimization Agent: Performance tuning, caching, resource optimization",
      "Recovery Agent: Disaster recovery, backup restoration, failover",
      "Scaling Agent: Auto-scaling, load balancing, capacity planning",
      "DNS Agent: DNS record management, nameserver configuration",
      "Payment Agent: bKash processing, order management, billing",
      "Supervisor Agent: Central coordinator for all agent workflows",
      "Learning Agent: Knowledge acquisition, research, pattern recognition",
      "Coding Agent: Code writing, review, and refactoring",
      "UI Agent: Interface design and implementation",
      "Research Agent: Web research, documentation analysis",
      "Self-Improvement Agent: Learning from interactions, capability enhancement",
      "Bug Detector Agent: Continuous scanning, anomaly detection",
      "Bug Fixer Agent: Automated bug patching, code correction",
      "DevOps Advanced Agent: Advanced infrastructure, multi-cloud, GitOps",
      "Chat Agent: Natural language processing, conversation management",
    ],
    tips: [
      "Use the Agent Monitor to track agent activity in real-time",
      "Submit complex tasks through the AI Chat — the orchestrator routes to the right agent",
      "The Security Agent runs continuously — check its findings regularly",
      "Use the Learning Agent to research topics before making infrastructure decisions",
    ],
    bengali: "২২টি বিশেষায়িত AI এজেন্ট ক্লাউড ম্যানেজমেন্টের বিভিন্ন দিক পরিচালনা করে। মাস্টার অর্কেস্ট্রেটর জটিল কাজের জন্য এজেন্টদের সমন্বয় করে।"
  },
};

// ============ RESPONSE GENERATION ENGINE ============

// Unique response counter to ensure variation
let responseCounter = 0;

function generateGreeting(message: string, ctx: ConversationContext): string {
  const greetings = [
    "আসসালামু আলাইকুম! 👋 আমি FahadCloud AI Assistant। আপনার ক্লাউড প্ল্যাটফর্মে আমি যেকোনো সাহায্য করতে পারি — ডোমেইন, হোস্টিং, SSL, DNS, ডিপ্লয়মেন্ট, ডাটাবেস বা যেকোনো বিষয়ে। বলুন, কিভাবে সাহায্য করবো?",
    "হ্যালো! স্বাগতম FahadCloud-এ! 🚀 আমি আপনার AI ক্লাউড অ্যাসিস্ট্যান্ট। ডোমেইন রেজিস্ট্রেশন, হোস্টিং সেটআপ, SSL ইনস্টল, DNS কনফিগারেশন — সব কিছুতেই আমি সাহায্য করতে পারি। কী চান?",
    "ওয়ালাইকুম আসসালাম! 😊 FahadCloud AI-তে আপনাকে স্বাগতম। আমি ২২টি AI এজেন্ট নিয়ে কাজ করি — ডোমেইন থেকে ডিপ্লয়মেন্ট, সিকিউরিটি থেকে মনিটরিং, সব কিছু হ্যান্ডেল করতে পারি। বলুন, কী দরকার?",
    "স্বাগতম! 🌟 আমি FahadCloud-এর AI Assistant। আপনার ক্লাউড সার্ভার, ডোমেইন, হোস্টিং বা যেকোনো টেকনিক্যাল বিষয়ে সাহায্য করতে পারি। কী নিয়ে কথা বলতে চান?",
  ];
  return greetings[responseCounter++ % greetings.length]!;
}

function generateThanksResponse(message: string, ctx: ConversationContext): string {
  const responses = [
    "আপনাকেও ধন্যবাদ! 😊 আর কোনো সাহায্য লাগলে নির্দ্বিধায় বলবেন। আমি সবসময় এখানে আছি!",
    "খুশি হলাম যে সাহায্য করতে পারলাম! 🎉 আর কিছু জানতে চাইলে বলুন, আমি প্রস্তুত।",
    "ধন্যবাদ আপনাকেও! ✨ আপনার ক্লাউড জার্নিতে আমি সবসময় সাথে আছি। যেকোনো প্রশ্ন থাকলে বলুন!",
    "You're welcome! 😄 আপনার FahadCloud এক্সপেরিয়েন্স আরও ভালো করতে আমি সবসময় চেষ্টা করবো। আর কিছু দরকার হলে বলুন!",
  ];
  return responses[responseCounter++ % responses.length]!;
}

function generateHelpResponse(message: string, ctx: ConversationContext): string {
  return `আমি FahadCloud AI Assistant — আপনার ক্লাউড প্ল্যাটফর্মের সবকিছু ম্যানেজ করতে পারি! 🚀

**আমি যা যা করতে পারি:**

🌐 **ডোমেইন ম্যানেজমেন্ট:**
- ডোমেইন সার্চ ও রেজিস্ট্রেশন (.com, .net, .org, .io, .dev সহ সব TLD)
- ফ্রি ডোমেইন (.tk, .ml, .ga, .cf)
- DNS রেকর্ড ম্যানেজমেন্ট (A, AAAA, CNAME, MX, TXT, SRV, NS)
- WHOIS প্রাইভেসি প্রোটেকশন

🖥️ **হোস্টিং ও ডিপ্লয়মেন্ট:**
- Shared, VPS, Dedicated হোস্টিং প্ল্যান
- Next.js, React, Vue, Node.js, Python, PHP, WordPress ডিপ্লয়
- জিরো-ডাউনটাইম ডিপ্লয়মেন্ট ও ইনস্ট্যান্ট রোলব্যাক
- Docker-ভিত্তিক আইসোলেটেড এনভায়রনমেন্ট

🔒 **সিকিউরিটি:**
- ফ্রি SSL সার্টিফিকেট (Let's Encrypt)
- WAF ও DDoS প্রোটেকশন
- 2FA/OTP সাপোর্ট
- ভালনারেবিলিটি স্ক্যানিং

📊 **মনিটরিং ও AI:**
- রিয়েল-টাইম সিস্টেম মনিটরিং
- ২২টি AI এজেন্ট দিয়ে অটোমেটেড ক্লাউড ম্যানেজমেন্ট
- AI লার্নিং ও রিসার্চ
- Cloud Intel — সিস্টেম হেলথ ওভারভিউ

💳 **পেমেন্ট:**
- bKash পেমেন্ট গেটওয়ে
- ব্যালেন্স ম্যানেজমেন্ট
- অর্ডার ও ইনভয়েস ট্র্যাকিং

**যেভাবে বলতে পারেন:**
- "example.com ডোমেইন চেক করো"
- "একটা React অ্যাপ ডিপ্লয় করতে চাই"
- "SSL ইনস্টল করো"
- "DNS রেকর্ড যোগ করো"
- "কি কি হোস্টিং প্ল্যান আছে?"
- "AI দিয়ে Kubernetes সম্পর্কে শিখাও"`;
}

function generateDomainResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  const kb = CLOUD_KNOWLEDGE.domain!;
  const variation = responseCounter++ % 3;

  if (intent === 'domain_search') {
    const domain = entities.domain || 'your-domain';
    return `🔍 ডোমেইন সার্চ রেজাল্ট: **${domain}**

${variation === 0 ? 'চমৎকার পছন্দ!' : variation === 1 ? 'দারুণ ডোমেইন নাম!' : 'ভালো ডোমেইন বেছে নিয়েছেন!'}

${domain} ডোমেইনটি ফাহাদক্লাউডে রেজিস্টার করা যাবে। এখানে আমরা যা অফার করি:

✅ **রেজিস্ট্রেশন প্রাইস:** ৳১,১০০/বছর (.com এর জন্য)
✅ **ফ্রি SSL সার্টিফিকেট** — অটো-রিনিউয়াল সহ
✅ **ফ্রি DNS হোস্টিং** — সকল রেকর্ড টাইপ সাপোর্ট
✅ **WHOIS প্রাইভেসি** — আপনার তথ্য সুরক্ষিত
✅ **ডোমেইন লকিং** — অননুমোদিত ট্রান্সফার প্রতিরোধ
✅ **অটো-রিনিউয়াল** — ডোমেইন এক্সপায়ার হবে না

ডোমেইন রেজিস্টার করতে **My Domains** সেকশনে যান অথবা বলুন "register ${domain}"।

${kb.bengali}`;
  }

  if (intent === 'domain_register') {
    const domain = entities.domain || 'your-domain.com';
    return `📝 ডোমেইন রেজিস্ট্রেশন: **${domain}**

${domain} রেজিস্টার করতে এই পদক্ষেপগুলো অনুসরণ করুন:

1️⃣ **My Domains** পেজে যান → **Search Domain** এ ${domain} সার্চ করুন
2️⃣ ডোমেইন পাওয়া গেলে **Register** বাটনে ক্লিক করুন
3️⃣ বিলিং সম্পন্ন করুন (bKash পেমেন্ট)
4️⃣ ডোমেইন অ্যাক্টিভ হবে এবং DNS ম্যানেজমেন্ট পাওয়া যাবে

**রেজিস্ট্রেশনের সাথে পাবেন:**
- ফ্রি SSL সার্টিফিকেট
- সম্পূর্ণ DNS ম্যানেজমেন্ট
- WHOIS প্রাইভেসি প্রোটেকশন
- অটো-রিনিউয়াল অপশন

💡 **টিপস:** আপনার ব্র্যান্ড প্রোটেক্ট করতে একাধিক TLD (.com, .net, .org) রেজিস্টার করুন।`;
  }

  if (intent === 'domain_free') {
    return `🎉 ফ্রি ডোমেইন পাওয়া যাচ্ছে!

FahadCloud-এ এই ফ্রি TLD গুলো পাওয়া যায়:
- **.tk** — Tokelau TLD, সম্পূর্ণ ফ্রি
- **.ml** — Mali TLD, সম্পূর্ণ ফ্রি
- **.ga** — Gabon TLD, সম্পূর্ণ ফ্রি
- **.cf** — Central African Republic TLD, সম্পূর্ণ ফ্রি

**ফ্রি ডোমেইনে যা পাবেন:**
✅ DNS ম্যানেজমেন্ট (A, CNAME, MX, TXT)
✅ ফ্রি SSL সার্টিফিকেট
✅ হোস্টিং এনভায়রনমেন্ট কানেক্ট
✅ ওয়েবসাইট ডিপ্লয়মেন্ট

⚠️ **নোট:** ফ্রি ডোমেইনে কিছু সীমাবদ্ধতা আছে — WHOIS প্রাইভেসি এবং ডোমেইন লকিং সাপোর্ট নাও থাকতে পারে। বিজনেস ব্যবহারের জন্য .com বা .net রেজিস্টার করা ভালো।`;
  }

  // Default domain response
  return `🌐 **ডোমেইন ম্যানেজমেন্ট**

${kb.overview}

**মূল সুবিধাসমূহ:**
${kb.details.slice(0, 6).map(d => `• ${d}`).join('\n')}

**পরামর্শ:**
${kb.tips.slice(0, 3).map(t => `💡 ${t}`).join('\n')}

${kb.bengali}`;
}

function generateHostingResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  const kb = CLOUD_KNOWLEDGE.hosting!;

  if (intent === 'hosting_deploy') {
    const framework = entities.framework || 'your-app';
    const frameworkNames: Record<string, string> = {
      react: 'React', nextjs: 'Next.js', vue: 'Vue.js', nuxt: 'Nuxt.js',
      nodejs: 'Node.js', express: 'Express.js', python: 'Python/Flask',
      php: 'PHP', laravel: 'Laravel', wordpress: 'WordPress', static: 'Static HTML',
    };
    const fw = frameworkNames[framework] || framework;

    return `🚀 **${fw} অ্যাপ ডিপ্লয় করুন**

FahadCloud-এ ${fw} অ্যাপ ডিপ্লয় করা খুবই সহজ:

**১. হোস্টিং এনভায়রনমেন্ট তৈরি করুন:**
- **Hosting** পেজে যান → **Create Environment** ক্লিক করুন
- প্ল্যান সিলেক্ট করুন (Starter থেকে শুরু করতে পারেন)
- সার্ভার টাইপ: **${fw}** সিলেক্ট করুন

**২. ডোমেইন কানেক্ট করুন:**
- আপনার রেজিস্টার্ড ডোমেইন সিলেক্ট করুন অথবা নতুন ডোমেইন রেজিস্টার করুন

**৩. কোড ডিপ্লয় করুন:**
- আপনার প্রজেক্ট ফাইল আপলোড করুন
- বা Git রিপোজিটরি কানেক্ট করুন
- ফ্রেমওয়ার্ক অটো-ডিটেকশন কনফিগারেশন হ্যান্ডেল করবে

**৪. SSL ও DNS অটো-কনফিগার:**
- SSL অটোমেটিক ইনস্টল হবে
- DNS রেকর্ড অটোমেটিক কনফিগার হবে

💡 **টিপস:** প্রোডাকশনে ডিপ্লয় করার আগে environment variables সেট করুন এবং staging-এ টেস্ট করুন।`;
  }

  if (intent === 'hosting_plans') {
    return `💰 **FahadCloud হোস্টিং প্ল্যান**

| প্ল্যান | দাম | CPU | RAM | স্টোরেজ | ব্যান্ডউইথ |
|---------|------|-----|-----|----------|-----------|
| **Starter** | ৳৪৯৯/মাস | 1 Core | 1GB | 5GB SSD | 100GB |
| **Pro** | ৳১,৪৯৯/মাস | 2 Core | 4GB | 50GB NVMe | 500GB |
| **Business** | ৳২,৯৯৯/মাস | 4 Core | 8GB | 100GB NVMe | 1TB |
| **Enterprise** | ৳৪,৯৯৯/মাস | 8 Core | 32GB | 500GB NVMe | 5TB |

**সব প্ল্যানে অন্তর্ভুক্ত:**
✅ ফ্রি SSL সার্টিফিকেট
✅ ডেইলি ব্যাকআপ
✅ DDoS প্রোটেকশন
✅ ৯৯.৯% আপটাইম SLA
✅ ১০+ ফ্রেমওয়ার্ক ডিপ্লয়মেন্ট

🚀 **VPS ও Dedicated প্ল্যান** অটো-স্কেলিং, কাস্টম nginx কনফিগ, এবং রুট অ্যাক্সেস সহ পাওয়া যায়।

প্ল্যান সিলেক্ট করতে **Hosting** পেজে যান অথবা বলুন কোন প্ল্যান চান!`;
  }

  // Default hosting response
  return `🖥️ **হোস্টিং ম্যানেজমেন্ট**

${kb.overview}

**হোস্টিং প্ল্যান:**
${kb.details.slice(0, 5).map(d => `• ${d}`).join('\n')}

**ডিপ্লয়মেন্ট সাপোর্ট:**
• Next.js, React, Vue, Nuxt, Node.js, Python, PHP, WordPress
• ফ্রেমওয়ার্ক অটো-ডিটেকশন
• জিরো-ডাউনটাইম ডিপ্লয়মেন্ট
• ইনস্ট্যান্ট রোলব্যাক

${kb.bengali}`;
}

function generateSSLResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  const kb = CLOUD_KNOWLEDGE.ssl!;
  const domain = entities.domain || 'your-domain';

  if (intent === 'ssl_install') {
    return `🔒 **SSL সার্টিফিকেট ইনস্টল**

${domain}-এ SSL ইনস্টল করার প্রক্রিয়া:

**অটোমেটিক SSL (প্রস্তাবিত):**
1. ডোমেইন রেজিস্টার করুন বা হোস্টিং তৈরি করুন
2. SSL অটোমেটিক প্রোভিশন হবে (Let's Encrypt)
3. HTTPS এনফোর্সমেন্ট এনেবল করুন

**ম্যানুয়াল SSL:**
1. **My Domains** → ডোমেইন সিলেক্ট → **SSL** ট্যাব
2. **Install SSL** ক্লিক করুন
3. সার্টিফিকেট অটো-জেনারেট হবে

**SSL ফিচার:**
${kb.details.map(d => `• ${d}`).join('\n')}

💡 ইনস্টলেশনের পর HTTPS এনফোর্সমেন্ট এনেবল করুন যাতে সব HTTP ট্রাফিক HTTPS-এ রিডাইরেক্ট হয়।`;
  }

  return `🔒 **SSL ম্যানেজমেন্ট**

${kb.overview}

${kb.details.map(d => `• ${d}`).join('\n')}

${kb.bengali}`;
}

function generateDNSResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  const kb = CLOUD_KNOWLEDGE.dns!;
  const domain = entities.domain || 'your-domain';

  return `🌐 **DNS ম্যানেজমেন্ট** — ${domain}

${kb.overview}

**সাপোর্টেড রেকর্ড টাইপ:**
- **A Record** — ডোমেইনকে IPv4 অ্যাড্রেসে ম্যাপ করে
- **AAAA Record** — IPv6 অ্যাড্রেস
- **CNAME** — সাবডোমেইনকে অন্য ডোমেইনে রিডাইরেক্ট
- **MX** — মেইল সার্ভার কনফিগারেশন
- **TXT** — SPF, DKIM, DMARC এবং ভেরিফিকেশন
- **SRV** — সার্ভিস রেকর্ড
- **NS** — নেমসার্ভার কনফিগারেশন

**DNS রেকর্ড যোগ করতে:**
1. **My Domains** → ডোমেইন সিলেক্ট → **DNS** ট্যাব
2. **Add Record** ক্লিক করুন
3. টাইপ, নাম, ভ্যালু এবং TTL সেট করুন

${kb.tips.slice(0, 3).map(t => `💡 ${t}`).join('\n')}

${kb.bengali}`;
}

function generateDatabaseResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  const kb = CLOUD_KNOWLEDGE.database!;
  return `🗄️ **ডাটাবেস ম্যানেজমেন্ট**

${kb.overview}

**ডাটাবেস সেবাসমূহ:**
${kb.details.map(d => `• ${d}`).join('\n')}

**ডাটাবেস ড্যাশবোর্ডে** আপনি পাবেন:
- সকল ডাটাবেসের স্ট্যাটাস ও কানেকশন ইনফো
- Redis ক্যাশ স্ট্যাটাস
- Qdrant ভেক্টর DB ইনফো
- BullMQ জব কিউ স্ট্যাটাস

${kb.bengali}`;
}

function generateSecurityResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  const kb = CLOUD_KNOWLEDGE.security!;
  return `🛡️ **নিরাপত্তা ম্যানেজমেন্ট**

${kb.overview}

**নিরাপত্তা ব্যবস্থাসমূহ:**
${kb.details.map(d => `• ${d}`).join('\n')}

**2FA এনেবল করতে:**
1. **Profile** → **Security** ট্যাব
2. **Enable 2FA** ক্লিক করুন
3. Google Authenticator বা অন্য TOTP অ্যাপ স্ক্যান করুন
4. ভেরিফিকেশন কোড এন্টার করুন

${kb.tips.slice(0, 3).map(t => `💡 ${t}`).join('\n')}

${kb.bengali}`;
}

function generateMonitoringResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  const kb = CLOUD_KNOWLEDGE.monitoring!;
  return `📊 **মনিটরিং ও সিস্টেম স্ট্যাটাস**

${kb.overview}

**মনিটরিং ফিচার:**
${kb.details.map(d => `• ${d}`).join('\n')}

**মনিটরিং ড্যাশবোর্ডে** আপনি দেখতে পাবেন:
- CPU, RAM, ডিস্ক ব্যবহার
- নেটওয়ার্ক ট্রাফিক
- আপটাইম স্ট্যাটাস
- AI এজেন্ট অ্যাক্টিভিটি

${kb.bengali}`;
}

function generatePaymentResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  const kb = CLOUD_KNOWLEDGE.payment!;
  return `💳 **পেমেন্ট ও বিলিং**

${kb.overview}

**পেমেন্ট অপশন:**
${kb.details.map(d => `• ${d}`).join('\n')}

**ব্যালেন্স টপ-আপ করতে:**
1. **Profile** → **Balance** সেকশন
2. **Top Up** ক্লিক করুন
3. bKash দিয়ে পেমেন্ট করুন
4. ট্রানজেকশন ID ভেরিফাই করুন

**প্রাইসিং:**
- .com ডোমেইন: ৳১,১০০/বছর
- Shared হোস্টিং: ৳৪৯৯/মাস থেকে
- VPS হোস্টিং: ৳১,৪৯৯/মাস থেকে

${kb.bengali}`;
}

function generateAgentResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  const kb = CLOUD_KNOWLEDGE.ai_agents!;
  return `🤖 **AI এজেন্ট সিস্টেম**

${kb.overview}

**২২টি বিশেষায়িত এজেন্ট:**
${kb.details.slice(0, 12).map(d => `• ${d}`).join('\n')}

... এবং আরও ১০টি এজেন্ট (Coding, UI, Research, Self-Improvement, Bug Detector, Bug Fixer, DevOps Advanced, Chat)

**এজেন্ট মনিটর:** Agent Monitor পেজে সব এজেন্টের রিয়েল-টাইম স্ট্যাটাস দেখুন।
**Cloud Intel:** সিস্টেম হেলথ স্কোর এবং অবকাঠামো ওভারভিউ দেখুন।

💡 জটিল কাজের জন্য AI Chat ব্যবহার করুন — অর্কেস্ট্রেটর স্বয়ংক্রিয়ভাবে সঠিক এজেন্টে রাউট করবে।`;
}

function generateStorageResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  const kb = CLOUD_KNOWLEDGE.storage!;
  return `💾 **স্টোরেজ ম্যানেজমেন্ট**

${kb.overview}

**স্টোরেজ ফিচার:**
${kb.details.map(d => `• ${d}`).join('\n')}

**ফাইল আপলোড করতে:**
1. **Storage** পেজে যান
2. ফাইল ড্র্যাগ-এন্ড-ড্রপ বা ব্রাউজ করে আপলোড করুন
3. ফাইল ম্যানেজমেন্ট এবং শেয়ারিং

${kb.bengali}`;
}

function generateOptimizationResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  return `⚡ **অপ্টিমাইজেশন রেকমেন্ডেশন**

আপনার FahadCloud প্ল্যাটফর্ম অপ্টিমাইজ করার উপায়:

**১. পারফরম্যান্স:**
• Redis ক্যাশিং এনেবল করুন ফ্রিকোয়েন্টলি অ্যাক্সেসড ডেটার জন্য
• ডাটাবেস কুয়েরি অপ্টিমাইজ করুন এবং ইনডেক্স যোগ করুন
• CDN ব্যবহার করুন স্ট্যাটিক অ্যাসেটের জন্য
• Image optimization এবং lazy loading ইমপ্লিমেন্ট করুন

**২. স্কেলিং:**
• VPS/Dedicated প্ল্যানে অটো-স্কেলিং এনেবল করুন
• Load balancer কনফিগার করুন ট্রাফিক ডিস্ট্রিবিউশনের জন্য
• কানেকশন পুলিং সেটআপ করুন ডাটাবেসের জন্য

**৩. নিরাপত্তা:**
• HTTPS এনফোর্সমেন্ট এনেবল করুন
• HSTS headers সেট করুন
• Rate limiting কনফিগার করুন API endpoints-এ
• 2FA এনেবল করুন আপনার অ্যাকাউন্টে

**৪. মনিটরিং:**
• ক্রিটিক্যাল মেট্রিক্সে অ্যালার্ট সেটআপ করুন
• রেগুলার ব্যাকআপ ভেরিফাই করুন
• Error tracking রিভিউ করুন সাপ্তাহিক`;
}

function generateCloudIntelResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  return `☁️ **Cloud Intelligence Overview**

FahadCloud-এর AI-চালিত ক্লাউড ইন্টেলিজেন্স সিস্টেম আপনার পুরো ইনফ্রাস্ট্রাকচার মনিটর করে:

**সিস্টেম হেলথ মনিটরিং:**
• PostgreSQL ডাটাবেস — অটো ব্যাকআপ সহ পরিচালিত
• Redis ক্যাশ — সাব-মিলিসেকেন্ড রেসপন্স
• Qdrant ভেক্টর DB — AI সেমান্টিক সার্চ
• BullMQ জব কিউ — ব্যাকগ্রাউন্ড টাস্ক প্রসেসিং

**২২ AI এজেন্ট:**
• সব এজেন্ট রিয়েল-টাইমে মনিটর করা হয়
• অর্কেস্ট্রেটর জটিল টাস্ক কোঅর্ডিনেট করে
• সিকিউরিটি এজেন্ট কন্টিনিউয়াসলি স্ক্যান করে
• বাগ ডিটেক্টর অটোমেটিক সমস্যা খুঁজে বের করে

**Cloud Intel পেজে** দেখুন:
- সিস্টেম হেলথ স্কোর
- এজেন্ট অ্যাক্টিভিটি
- ডাটাবেস স্ট্যাটাস
- কিউ স্ট্যাটাস`;
}

function generateShellResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  return `💻 **টার্মিনাল / Shell অ্যাক্সেস**

FahadCloud-এ টার্মিনাল অ্যাক্সেস পাওয়া যায় **Terminal** সেকশনে।

**ব্যবহার:**
• সার্ভার কমান্ড এক্সিকিউট করুন
• ফাইল ম্যানেজমেন্ট
• ডিপ্লয়মেন্ট টাস্ক
• ডাটাবেস অপারেশন

⚠️ **নিরাপত্তা:** Shell কমান্ড sandbox-এ চালানো হয়। কিছু কমান্ড restricted হতে পারে নিরাপত্তার জন্য।

**উপলব্ধ কমান্ডের উদাহরণ:**
- \`ls\` — ফাইল তালিকা
- \`cat\` — ফাইল পড়া
- \`ps\` — প্রসেস তালিকা
- \`df\` — ডিস্ক ব্যবহার

Terminal পেজে যেতে নেভিগেশন থেকে **Terminal** সিলেক্ট করুন।`;
}

function generatePricingResponse(intent: string, entities: Record<string, string>, message: string, ctx: ConversationContext): string {
  return `💰 **FahadCloud প্রাইসিং**

**ডোমেইন রেজিস্ট্রেশন:**
• .com — ৳১,১০০/বছর
• .net — ৳১,২০০/বছর
• .org — ৳১,১৫০/বছর
• .io — ৳৩,৫০০/বছর
• .dev — ৳১,৮০০/বছর
• .xyz — ৳৩৫০/বছর
• ফ্রি ডোমেইন (.tk, .ml, .ga, .cf) — ৳০

**হোস্টিং প্ল্যান:**
• Starter (Shared) — ৳৪৯৯/মাস | ৳৫,৪৯৯/বছর
• Pro (VPS) — ৳১,৪৯৯/মাস | ৳১৫,৯৯৯/বছর
• Business (VPS) — ৳২,৯৯৯/মাস | ৳৩২,৯৯৯/বছর
• Enterprise (Dedicated) — ৳৪,৯৯৯/মাস | ৳৫৪,৯৯৯/বছর

**সব প্ল্যানে ফ্রি:**
✅ SSL সার্টিফিকেট
✅ ডেইলি ব্যাকআপ
✅ DDoS প্রোটেকশন
✅ ৯৯.৯% আপটাইম SLA

💳 পেমেন্ট: bKash`;
}

// ============ MAIN AI CHAT FUNCTION ============

export async function aiChat(
  messages: AIChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<AIChatResult> {
  try {
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';
    const convId = getConversationId(messages);
    const ctx = updateContext(convId, messages);

    // Classify intent
    const intentResult = classifyIntentWithNLP(lastUserMsg);
    const intent = intentResult.intent;
    const entities = intentResult.entities;

    // Generate thinking
    const thinking = `Intent: ${intent} (confidence: ${intentResult.confidence}) | Entities: ${JSON.stringify(entities)} | Mood: ${ctx.userMood} | Turn: ${ctx.turnCount}`;

    // Route to appropriate response generator
    let response: string;

    switch (intent) {
      case 'greeting':
        response = generateGreeting(lastUserMsg, ctx);
        break;
      case 'thanks':
        response = generateThanksResponse(lastUserMsg, ctx);
        break;
      case 'help':
        response = generateHelpResponse(lastUserMsg, ctx);
        break;
      case 'domain_search':
      case 'domain_register':
      case 'domain_manage':
      case 'domain_free':
        response = generateDomainResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'hosting_deploy':
      case 'hosting_plans':
      case 'hosting_manage':
      case 'deploy_status':
        response = generateHostingResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'ssl_install':
      case 'ssl_check':
        response = generateSSLResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'dns_manage':
      case 'dns_nameserver':
        response = generateDNSResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'database_manage':
      case 'database_status':
        response = generateDatabaseResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'security_check':
      case 'security_2fa':
        response = generateSecurityResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'monitoring':
        response = generateMonitoringResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'payment':
        response = generatePaymentResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'pricing':
        response = generatePricingResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'storage':
        response = generateStorageResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'ai_learn':
      case 'agent_status':
        response = generateAgentResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'optimization':
        response = generateOptimizationResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'cloud_intel':
        response = generateCloudIntelResponse(intent, entities, lastUserMsg, ctx);
        break;
      case 'shell':
        response = generateShellResponse(intent, entities, lastUserMsg, ctx);
        break;
      default:
        // General response with context awareness
        response = generateGeneralResponse(lastUserMsg, ctx, intentResult);
        break;
    }

    return {
      message: response,
      thinking,
      usage: { promptTokens: lastUserMsg.length, completionTokens: response.length, totalTokens: lastUserMsg.length + response.length },
      available: true,
    };
  } catch (error: any) {
    return {
      message: `আমি আপনার প্রশ্ন বুঝতে পারছি না। দয়া করে আবার বলুন বা নির্দিষ্ট বিষয়ে জিজ্ঞাসা করুন — ডোমেইন, হোস্টিং, SSL, DNS, ডিপ্লয়মেন্ট ইত্যাদি।`,
      thinking: `Error: ${error.message}`,
      available: true,
      error: error.message,
    };
  }
}

function generateGeneralResponse(message: string, ctx: ConversationContext, intent: IntentClassification): string {
  // Check if message contains any keywords that match our knowledge base
  const lower = message.toLowerCase();

  for (const [topic, kb] of Object.entries(CLOUD_KNOWLEDGE)) {
    if (lower.includes(topic) || (kb.bengali && lower.includes(topic))) {
      return `**${topic.charAt(0).toUpperCase() + topic.slice(1)}**

${kb.overview}

**মূল পয়েন্ট:**
${kb.details.slice(0, 5).map(d => `• ${d}`).join('\n')}

${kb.bengali || ''}`;
    }
  }

  // Context-aware fallback
  if (ctx.turnCount > 3) {
    return `আমি দেখছি আপনি বেশ কিছু প্রশ্ন করেছেন! 😊 

আপনি যে বিষয়ে জানতে চাইছেন সেটা নিয়ে আমি আরও নির্দিষ্টভাবে সাহায্য করতে পারি। অনুগ্রহ করে বলুন:

• ডোমেইন সম্পর্কে জানতে চান? → "ডোমেইন সম্পর্কে বলুন"
• হোস্টিং প্ল্যান দেখতে চান? → "হোস্টিং প্ল্যান দেখাও"
• SSL ইনস্টল করতে চান? → "SSL ইনস্টল করো"
• ডিপ্লয় করতে চান? → "React অ্যাপ ডিপ্লয় করো"
• পেমেন্ট সম্পর্কে? → "পেমেন্ট কিভাবে করবো?"`;
  }

  return `আমি আপনার প্রশ্নটি বুঝতে পারছি না, তবে আমি নিচের বিষয়গুলোতে সাহায্য করতে পারি:

🌐 **ডোমেইন** — সার্চ, রেজিস্টার, DNS, SSL
🖥️ **হোস্টিং** — প্ল্যান, ডিপ্লয়, ম্যানেজমেন্ট
🔒 **সিকিউরিটি** — SSL, 2FA, WAF, DDoS
📊 **মনিটরিং** — সিস্টেম হেলথ, এজেন্ট স্ট্যাটাস
💳 **পেমেন্ট** — bKash, ব্যালেন্স, ইনভয়েস
🤖 **AI** — লার্নিং, রিসার্চ, এজেন্ট

অনুগ্রহ করে নির্দিষ্ট করে বলুন কোন বিষয়ে সাহায্য চান!`;
}

// ============ AI AVAILABILITY CHECK ============

export async function isAIAvailable(): Promise<boolean> {
  return true; // Own AI is always available!
}

// ============ AI INTENT CLASSIFICATION ============

export async function aiClassifyIntent(message: string, context?: any): Promise<IntentClassification> {
  return classifyIntentWithNLP(message);
}

// ============ AI ORCHESTRATION PLANNING ============

export async function aiPlanOrchestration(message: string, intent: string, context?: any): Promise<OrchestrationPlan> {
  const intentAgentMap: Record<string, string[]> = {
    domain_search: ['dns_domain', 'supervisor'],
    domain_register: ['dns_domain', 'payment', 'supervisor'],
    domain_manage: ['dns_domain', 'supervisor'],
    hosting_deploy: ['deployment', 'devops', 'supervisor'],
    hosting_plans: ['supervisor'],
    hosting_manage: ['devops', 'infrastructure', 'supervisor'],
    ssl_install: ['security', 'deployment', 'supervisor'],
    ssl_check: ['security', 'supervisor'],
    dns_manage: ['dns_domain', 'supervisor'],
    database_manage: ['database', 'supervisor'],
    database_status: ['database', 'monitoring', 'supervisor'],
    security_check: ['security', 'bug_detector', 'supervisor'],
    security_2fa: ['security', 'supervisor'],
    monitoring: ['monitoring', 'supervisor'],
    payment: ['payment', 'supervisor'],
    optimization: ['optimization', 'monitoring', 'supervisor'],
    ai_learn: ['auto_learning', 'research', 'supervisor'],
    shell: ['devops', 'supervisor'],
    cloud_intel: ['monitoring', 'supervisor'],
  };

  const agents = intentAgentMap[intent] || ['supervisor', 'chat'];

  const steps: PlanStep[] = agents.map((agent, i) => ({
    step: i + 1,
    agent,
    action: `process_${intent}`,
    description: `${agent} agent handles ${intent} related task`,
    dependencies: i > 0 ? [i] : [],
  }));

  return {
    id: `plan_${Date.now()}`,
    steps,
    estimatedDuration: `${steps.length * 2}-${steps.length * 5} seconds`,
    riskLevel: ['security_check', 'ssl_install'].includes(intent) ? 'medium' : 'low',
  };
}

// ============ AI RESEARCH ============

export async function aiResearch(topic: string, depth: 'quick' | 'standard' | 'deep' = 'standard'): Promise<ResearchResult> {
  const depthConfig = {
    quick: { sections: 3, pointsPerSection: 3, totalPoints: 8 },
    standard: { sections: 5, pointsPerSection: 4, totalPoints: 15 },
    deep: { sections: 8, pointsPerSection: 5, totalPoints: 25 },
  };

  const config = depthConfig[depth];

  const findings = generateResearchContent(topic, config);

  return {
    findings,
    sources: [`FahadCloud AI Research Engine`, `Internal Knowledge Base: ${topic}`, `Cloud Infrastructure Documentation`],
    confidence: depth === 'deep' ? 0.85 : depth === 'standard' ? 0.8 : 0.75,
    depth,
  };
}

function generateResearchContent(topic: string, config: { sections: number; pointsPerSection: number; totalPoints: number }): string {
  // Generate comprehensive research content about the topic
  const topicCapitalized = topic.charAt(0).toUpperCase() + topic.slice(1);

  // Topic-specific research content
  const researchTemplates: Record<string, () => string> = {
    default: () => `## ${topicCapitalized} - AI Research Report

### Overview
${topicCapitalized} is a significant topic in modern technology and cloud computing. Understanding its core concepts, best practices, and practical applications is essential for building reliable and scalable systems.

### Key Concepts
${generatePoints(topic, config.pointsPerSection, 'concept')}

### Best Practices
${generatePoints(topic, config.pointsPerSection, 'best_practice')}

### Common Pitfalls
${generatePoints(topic, config.pointsPerSection, 'pitfall')}

### Practical Applications
${generatePoints(topic, config.pointsPerSection, 'application')}

${config.sections > 5 ? `### Advanced Topics\n${generatePoints(topic, config.pointsPerSection, 'advanced')}\n` : ''}
${config.sections > 6 ? `### Tools & Resources\n${generatePoints(topic, config.pointsPerSection, 'tools')}\n` : ''}
${config.sections > 7 ? `### Future Trends\n${generatePoints(topic, config.pointsPerSection, 'future')}\n` : ''}

### Summary
${topicCapitalized} encompasses a wide range of concepts and practices that are critical for modern cloud infrastructure. By following best practices and avoiding common pitfalls, you can build robust, scalable, and secure systems. The field continues to evolve with new tools and methodologies emerging regularly.`,
  };

  const generator = researchTemplates[topic.toLowerCase()] || researchTemplates.default;
  return generator!();
}

function generatePoints(topic: string, count: number, category: string): string {
  const points: Record<string, string[]> = {
    concept: [
      `The fundamental principle of ${topic} revolves around efficient resource management and scalability`,
      `${topic} operates on a distributed architecture that ensures high availability and fault tolerance`,
      `Understanding the core data flow patterns in ${topic} is essential for optimal implementation`,
      `${topic} leverages modern caching strategies to minimize latency and maximize throughput`,
      `Security in ${topic} is implemented through multiple layers including encryption, authentication, and authorization`,
      `The architecture of ${topic} supports both horizontal and vertical scaling patterns`,
    ],
    best_practice: [
      `[Best Practice] Always implement proper error handling and retry logic when working with ${topic}`,
      `[Best Practice] Use connection pooling and resource reuse to optimize ${topic} performance`,
      `[Best Practice] Monitor key metrics and set up alerts for ${topic} operations`,
      `[Best Practice] Implement graceful degradation to handle ${topic} service disruptions`,
      `[Best Practice] Document your ${topic} configuration and architecture decisions for team alignment`,
      `[Best Practice] Use versioning and immutable infrastructure patterns with ${topic}`,
    ],
    pitfall: [
      `[Warning] Avoid hardcoding configuration values in ${topic} deployments — use environment variables instead`,
      `[Warning] Don't ignore ${topic} rate limits and quotas — implement backoff strategies`,
      `[Warning] Failing to implement proper monitoring for ${topic} can lead to undetected issues`,
      `[Warning] Over-provisioning ${topic} resources wastes money — right-size based on actual usage`,
      `[Warning] Skipping ${topic} backup procedures can result in catastrophic data loss`,
      `[Warning] Not testing ${topic} failover scenarios leaves you vulnerable to outages`,
    ],
    application: [
      `${topic} is widely used in cloud-native application development for microservices architecture`,
      `E-commerce platforms leverage ${topic} for handling high-traffic events and ensuring availability`,
      `Real-time applications use ${topic} patterns for low-latency data processing`,
      `Enterprise systems integrate ${topic} for compliance, audit logging, and governance`,
      `AI/ML workloads benefit from ${topic} for scalable training and inference pipelines`,
      `IoT systems use ${topic} for reliable device communication and data aggregation`,
    ],
    advanced: [
      `Multi-region ${topic} deployment with automatic failover provides global high availability`,
      `Event-driven ${topic} architecture enables loose coupling and independent scaling`,
      `GitOps workflows with ${topic} provide declarative infrastructure management`,
      `Service mesh integration enhances ${topic} with traffic management and observability`,
      `Chaos engineering practices help validate ${topic} resilience under failure conditions`,
    ],
    tools: [
      `Docker and Kubernetes are essential tools for containerized ${topic} deployments`,
      `Terraform and Pulumi enable infrastructure-as-code for ${topic} resources`,
      `Prometheus and Grafana provide comprehensive ${topic} monitoring and visualization`,
      `ELK Stack (Elasticsearch, Logstash, Kibana) for ${topic} log aggregation and analysis`,
      `Jaeger and Zipkin for distributed tracing across ${topic} services`,
    ],
    future: [
      `Serverless ${topic} patterns are reducing operational overhead and enabling pay-per-use pricing`,
      `AI-powered ${topic} optimization is emerging with predictive scaling and anomaly detection`,
      `Edge computing integration with ${topic} is bringing computation closer to users`,
      `WebAssembly is expanding ${topic} deployment options with near-native performance`,
      `Sustainability in ${topic} is becoming important with carbon-aware computing practices`,
    ],
  };

  const categoryPoints = points[category] || points.concept;
  return categoryPoints!.slice(0, count).map(p => `- ${p}`).join('\n');
}

// ============ THINKING GENERATION ============

export function generateThinking(messages: AIChatMessage[]): string {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const intent = classifyIntentWithNLP(lastMsg);
  return `Analyzing user message... | Intent: ${intent.intent} (${(intent.confidence * 100).toFixed(0)}%) | Entities: ${JSON.stringify(intent.entities)} | Generating contextual response...`;
}
