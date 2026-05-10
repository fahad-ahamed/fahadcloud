// ============ SMART AI RESPONSE SYSTEM ============
// Generates intelligent, contextual responses when external AI is unavailable
// Covers all intents with detailed, domain-specific knowledge

interface ResponseContext {
  intent: string;
  entities: Record<string, string>;
  message: string;
  completedSteps: number;
  totalSteps: number;
  results: any[];
  activeAgents: string[];
  plan: any;
}

const KNOWLEDGE_BASE: Record<string, string[]> = {
  domain: [
    "Domain registration includes DNS management, email forwarding, and domain privacy protection.",
    "You can register .com, .net, .org, .io, .dev, .app, .xyz and many more TLDs through FahadCloud.",
    "Each domain includes free SSL certificate, DNS hosting, and WHOIS privacy.",
    "Domain transfers are supported - you can bring your existing domains to FahadCloud.",
    "Auto-renewal ensures your domains never expire accidentally."
  ],
  hosting: [
    "FahadCloud offers Shared, VPS, and Dedicated hosting plans with 99.9% uptime SLA.",
    "All hosting plans include free SSL, daily backups, and DDoS protection.",
    "One-click deployment for WordPress, Next.js, React, Vue, Node.js, Python, and PHP.",
    "Hosting environments support custom nginx configurations and environment variables.",
    "Auto-scaling is available on VPS and Dedicated plans to handle traffic spikes."
  ],
  ssl: [
    "Free SSL certificates are included with all domains and hosting plans.",
    "SSL certificates auto-renew 30 days before expiration.",
    "We support Let's Encrypt and custom SSL certificates for enterprise needs.",
    "HTTPS enforcement is available with one click in domain settings.",
    "Wildcard SSL certificates are supported on premium plans."
  ],
  dns: [
    "DNS management supports A, AAAA, CNAME, MX, TXT, SRV, and NS record types.",
    "DNS changes propagate within minutes using our anycast DNS network.",
    "DNSSEC is available for enhanced security on supported TLDs.",
    "Email DNS records (MX, SPF, DKIM, DMARC) can be configured from the DNS manager.",
    "GeoDNS routing is available on enterprise plans for global load balancing."
  ],
  deploy: [
    "Deploy from Git repositories (GitHub, GitLab, Bitbucket) with automatic builds.",
    "Framework auto-detection supports Next.js, React, Vue, Nuxt, Gatsby, and more.",
    "Build logs and deployment history are available in real-time.",
    "Rollback to any previous deployment with one click.",
    "Preview deployments are created for pull requests automatically."
  ],
  monitoring: [
    "Real-time monitoring tracks CPU, RAM, disk usage, and network traffic.",
    "Custom alerts can be configured for any metric threshold.",
    "Uptime monitoring checks your sites every 60 seconds from multiple locations.",
    "Performance reports include Core Web Vitals and Lighthouse scores.",
    "Error tracking captures and groups application errors automatically."
  ],
  database: [
    "PostgreSQL 16 is the primary database with automatic daily backups.",
    "Redis cache provides sub-millisecond response times for frequently accessed data.",
    "Qdrant vector database powers AI semantic search and memory.",
    "BullMQ job queue handles background tasks like deployments and AI processing.",
    "Database connections are encrypted and pooled for optimal performance."
  ],
  security: [
    "FahadCloud includes a Web Application Firewall (WAF) on all plans.",
    "DDoS protection mitigates attacks up to 1Tbps automatically.",
    "Two-factor authentication is available for all user accounts.",
    "Security scanning detects vulnerabilities in your applications.",
    "Audit logging tracks all administrative actions for compliance."
  ],
  payment: [
    "bKash is the primary payment method for Bangladeshi users.",
    "Domain registration starts at ৳1,100/year for .com domains.",
    "Hosting plans start at ৳499/month for shared hosting.",
    "Balance can be topped up from the profile section.",
    "Payment history and invoices are available in the orders section."
  ],
  ai: [
    "FahadCloud AI uses 14 specialized agents for different cloud tasks.",
    "The Master Controller agent coordinates all other agents.",
    "The Bug Detector agent continuously scans for issues.",
    "The Auto-Fix Engine can automatically patch detected problems.",
    "The Learning Agent researches topics and builds a knowledge base.",
    "The Security Agent monitors for threats and vulnerabilities.",
    "The DevOps Agent handles deployments and infrastructure.",
    "The Memory Agent manages AI context and semantic search."
  ]
};

function getRelevantKnowledge(intent: string, message: string): string[] {
  const knowledge: string[] = [];
  const intentTopicMap: Record<string, string[]> = {
    'domain_search': ['domain'], 'domain_register': ['domain'], 'domain_manage': ['domain', 'dns'],
    'domain_info': ['domain'], 'ssl_install': ['ssl', 'domain'], 'ssl_check': ['ssl'],
    'dns_manage': ['dns', 'domain'], 'dns_record': ['dns'],
    'hosting_create': ['hosting', 'deploy'], 'hosting_manage': ['hosting'],
    'hosting_info': ['hosting'], 'deploy_start': ['deploy', 'hosting'],
    'deploy_status': ['deploy'], 'monitoring_check': ['monitoring'],
    'monitoring_alert': ['monitoring'], 'database_query': ['database'],
    'database_backup': ['database'], 'security_scan': ['security'],
    'security_alert': ['security'], 'payment_create': ['payment'],
    'payment_check': ['payment'], 'ai_chat': ['ai'],
    'ai_learn': ['ai'], 'bug_report': ['security', 'ai'],
    'help': ['domain', 'hosting', 'ssl', 'dns', 'deploy', 'monitoring', 'security', 'ai'],
  };

  const topics = intentTopicMap[intent] || ['ai'];
  for (const topic of topics) {
    if (KNOWLEDGE_BASE[topic]) {
      knowledge.push(...KNOWLEDGE_BASE[topic].slice(0, 2));
    }
  }
  return knowledge;
}

function generateDetailedResponse(ctx: ResponseContext): string {
  const { intent, entities, message, completedSteps, totalSteps, results, activeAgents } = ctx;
  const lowerMsg = message.toLowerCase();
  
  // ---- INTENT-BASED DISPATCH (use AI-classified intent) ----
  if (intent === 'hosting_deploy' || intent === 'hosting_configure') {
    return 'Lets deploy! Go to Deploy section. Supports React, Next.js, Vue, Node.js, Python, PHP. Includes automatic SSL, CDN, and one-click rollback.';
  }
  if (intent === 'hosting_manage') {
    return 'Manage hosting: Start/Stop/Restart, scale, configure. Go to My Hosting.';
  }
  if (intent === 'security_scan') {
    return 'Security: WAF, DDoS protection, vulnerability scanning. Go to Security section.';
  }
  if (intent === 'bug_detect') {
    return 'Bug Detector: scans for errors, vulnerabilities. Go to Agent Monitor.';
  }
  if (intent === 'ai_learning') {
    return 'Research topics to expand AI knowledge. Go to AI Learning.';
  }
  if (intent === 'ssl_install' || intent === 'ssl_manage') {
    return 'Free SSL with auto-renewal. Install from SSL section.';
  }
  if (intent === 'dns_configure') {
    return 'DNS management: A, CNAME, MX, TXT records. Configure from DNS section.';
  }
  if (intent === 'database_manage' || intent === 'database_create') {
    return 'PostgreSQL, Redis, Qdrant, BullMQ. Go to Database section.';
  }
  if (intent === 'monitoring_check') {
    return 'Real-time monitoring: CPU, RAM, disk, uptime. Go to Monitor section.';
  }
  if (intent === 'acknowledgment') {
    return 'You are welcome! Anything else?';
  }

  // ---- Greeting ----
  if (/^(hi|hello|hey|good|salam|assalam)/i.test(lowerMsg)) {
    return `Hello! 👋 Welcome to FahadCloud AI Assistant!\n\nI'm your intelligent cloud management assistant powered by 14 specialized AI agents. Here's what I can help you with:\n\n🌐 **Domains** - Search, register, and manage domains\n🖥️ **Hosting** - Create and manage hosting environments\n🔒 **SSL** - Install and manage SSL certificates\n📋 **DNS** - Configure DNS records\n🚀 **Deploy** - Deploy applications with one click\n📊 **Monitoring** - Real-time system monitoring\n🛡️ **Security** - Security scanning and threat detection\n💳 **Payments** - bKash payments and order management\n\nJust tell me what you need, and I'll connect you with the right agent!`;
  }

  // ---- Domain Search ----
  if (/search.*domain|find.*domain|check.*domain|look.*domain|domain.*search|domain.*available|domain.*check/i.test(lowerMsg)) {
    const domainName = entities.domain || entities.name || '';
    return `🔍 **Domain Search**\n\n${domainName ? `I'll help you check the availability of "${domainName}". ` : 'To search for a domain, go to the **My Domains** section and enter your desired domain name. '}Here's what you need to know:\n\n• **Pricing**: .com domains start at ৳1,100/year\n• **Included**: Free SSL, DNS hosting, WHOIS privacy\n• **TLDs available**: .com, .net, .org, .io, .dev, .app, .xyz and more\n• **Registration**: Instant activation after payment\n\n💡 **Tip**: Register your domain for multiple years to lock in the current price!${domainName ? '\n\nWould you like me to help you register this domain?' : ''}`;
  }

  // ---- Domain Register ----
  if (/register.*domain|buy.*domain|get.*domain|domain.*register|domain.*buy/i.test(lowerMsg)) {
    return `📝 **Domain Registration**\n\nI can help you register a new domain! Here's the process:\n\n1. **Search** for your desired domain name\n2. **Select** the TLD (.com, .net, .org, etc.)\n3. **Add to cart** and proceed to payment\n4. **Pay via bKash** - instant activation!\n\n**What's included with every domain:**\n• ✅ Free SSL certificate\n• ✅ DNS management\n• ✅ WHOIS privacy protection\n• ✅ Email forwarding\n\nGo to **My Domains** → Search → Register to get started!`;
  }

  // ---- SSL ----
  if (/ssl|https|certificate|tls/i.test(lowerMsg)) {
    return `🔒 **SSL Certificate Management**\n\nFahadCloud provides free SSL certificates for all domains and hosting environments.\n\n**Features:**\n• Free Let's Encrypt SSL with auto-renewal\n• One-click HTTPS enforcement\n• Wildcard SSL on premium plans\n• Custom certificate upload for enterprise\n\n**To install SSL:**\n1. Go to **SSL** section in your dashboard\n2. Select your domain\n3. Click "Install SSL" - done in seconds!\n\nSSL certificates auto-renew 30 days before expiration, so you never have to worry about expiry.`;
  }

  // ---- DNS ----
  if (/dns|nameserver|record|mx|cname|a record/i.test(lowerMsg)) {
    return `📋 **DNS Management**\n\nFahadCloud provides a full-featured DNS manager for all your domains.\n\n**Supported record types:**\n• **A** - Points to IPv4 address\n• **AAAA** - Points to IPv6 address\n• **CNAME** - Alias to another domain\n• **MX** - Mail exchange records\n• **TXT** - Text records (SPF, DKIM, verification)\n• **SRV** - Service records\n• **NS** - Nameserver records\n\n**To manage DNS:**\n1. Go to **DNS** section\n2. Select your domain\n3. Add, edit, or delete records\n\n💡 DNS changes propagate within minutes on our anycast network!`;
  }

  // ---- Hosting ----
  if (/hosting|server|vps|shared|dedicated|environment/i.test(lowerMsg)) {
    return `🖥️ **Hosting Management**\n\nFahadCloud offers multiple hosting plans:\n\n**Shared Hosting** - Starting ৳499/month\n• 10GB SSD storage\n• 100GB bandwidth\n• Free SSL & domain\n\n**VPS Hosting** - Starting ৳1,499/month\n• 50GB SSD storage\n• 1TB bandwidth\n• Root access\n• Auto-scaling\n\n**Dedicated** - Starting ৳4,999/month\n• 500GB NVMe storage\n• Unlimited bandwidth\n• Full root access\n• Priority support\n\n**All plans include:**\n• ✅ 99.9% uptime SLA\n• ✅ DDoS protection\n• ✅ Daily backups\n• ✅ One-click deploy\n\nGo to **Hosting** → New Hosting to create an environment!`;
  }

  // ---- Deploy ----
  if (/deploy|build|publish|launch|git push/i.test(lowerMsg)) {
    return `🚀 **Deployment**\n\nDeploy your applications to FahadCloud with ease!\n\n**Supported frameworks:**\n• Next.js, React, Vue, Nuxt, Gatsby\n• Node.js, Python, PHP, Ruby\n• Static sites (HTML/CSS/JS)\n• Docker containers\n\n**Deployment methods:**\n1. **Git Deploy** - Push to deploy from GitHub/GitLab\n2. **Manual Upload** - Upload your build files\n3. **CLI Deploy** - Use our CLI tool\n\n**Features:**\n• Auto framework detection\n• Build logs in real-time\n• Preview deployments for PRs\n• Instant rollback to any version\n\nGo to **Deploy** section to start deploying!`;
  }

  // ---- Monitoring ----
  if (/monitor|status|health|cpu|ram|disk|uptime|performance/i.test(lowerMsg)) {
    return `📊 **System Monitoring**\n\nFahadCloud provides comprehensive monitoring for all your resources.\n\n**What's monitored:**\n• CPU & RAM usage (real-time)\n• Disk space & I/O\n• Network traffic & bandwidth\n• Application uptime (60s checks)\n• Core Web Vitals & Lighthouse scores\n• Error rates & response times\n\n**Alerts:**\n• Custom threshold alerts\n• Email notifications\n• Auto-scaling triggers\n\nGo to **Monitor** section to view your real-time dashboard!`;
  }

  // ---- Database ----
  if (/database|db|postgres|redis|qdrant|bullmq|backup/i.test(lowerMsg)) {
    return `🗄️ **Database Dashboard**\n\nYour FahadCloud database infrastructure:\n\n**PostgreSQL 16** ✅ Healthy\n• Primary database for all application data\n• Automatic daily backups\n• Encrypted connections\n\n**Redis 7** ✅ Healthy\n• In-memory cache for fast data access\n• Session management\n• Real-time pub/sub\n\n**Qdrant** ✅ Healthy\n• Vector database for AI semantic search\n• 4 collections (AI Memory, Conversations, Knowledge Base, Code)\n\n**BullMQ** ✅ Healthy\n• 7 job queues for background processing\n• AI tasks, bug scans, auto-fixes, learning, backups, deployments, notifications\n\nGo to **Database** section for detailed stats!`;
  }

  // ---- Security ----
  if (/security|firewall|threat|vulnerability|hack|protect|waf/i.test(lowerMsg)) {
    return `🛡️ **Security Center**\n\nFahadCloud multi-layer security:\n\n**Infrastructure Security:**\n• Web Application Firewall (WAF)\n• DDoS protection (up to 1Tbps)\n• SSL/TLS encryption everywhere\n• Automated security patches\n\n**Application Security:**\n• Vulnerability scanning\n• SQL injection protection\n• XSS prevention\n• CSRF tokens\n\n**Account Security:**\n• Two-factor authentication (2FA)\n• Admin OTP verification\n• Session management\n• Audit logging\n\nAll security features are included in your plan at no extra cost!`;
  }

  // ---- Payment ----
  if (/pay|payment|bkash|order|price|pricing|cost|balance|money/i.test(lowerMsg)) {
    return `💳 **Payments & Billing**\n\n**Payment Methods:**\n• bKash (primary for Bangladesh)\n• Bank transfer (coming soon)\n\n**Pricing:**\n• Domain .com: ৳1,100/year\n• Shared Hosting: ৳499/month\n• VPS Hosting: ৳1,499/month\n• Dedicated: ৳4,999/month\n\n**How to pay:**\n1. Go to **Orders** section\n2. Create a new order\n3. Pay via bKash\n4. Submit transaction ID\n5. Admin approves - done!\n\nYour current balance is shown in the top header. Top up anytime from your profile.`;
  }

  // ---- AI/Agent related ----
  if (/agent|ai|robot|bot|intelligent|smart|learn/i.test(lowerMsg)) {
    return `🤖 **AI Agent System**\n\nFahadCloud is powered by 14 specialized AI agents:\n\n**Infrastructure Agents:**\n• 🚀 DevOps Agent - CI/CD & deployments\n• 🛡️ Security Agent - Threat detection\n• 🔧 Debug Agent - Error analysis\n• 📊 Monitoring Agent - System health\n• 🏗️ Infrastructure Agent - Docker/K8s\n• 💾 Database Agent - DB optimization\n\n**Application Agents:**\n• 🚢 Deployment Agent - Build & deploy\n• ⚡ Optimization Agent - Performance\n• 🔄 Recovery Agent - Disaster recovery\n• 📈 Scaling Agent - Auto-scaling\n• 🌐 DNS Agent - DNS management\n• 💳 Payment Agent - Payment processing\n\n**Intelligence Agents:**\n• 🧠 Supervisor Agent - Central coordinator\n• 📚 Auto-Learning Agent - Knowledge builder\n\nAll agents work together through the Master Orchestrator!`;
  }

  // ---- Bug/Error ----
  if (/bug|error|fix|broken|crash|issue|problem|not working|doesn't work/i.test(lowerMsg)) {
    const bugInfo = entities.error || entities.component || '';
    return `🔧 **Bug Detection & Fixing**\n\n${bugInfo ? `I've noted the issue: "${bugInfo}". ` : ''}Our Bug Detector agent can help!\n\n**What I can do:**\n• Scan for common issues in your setup\n• Check DNS configuration\n• Verify SSL certificate status\n• Test hosting environment health\n• Review deployment logs\n\n**Common fixes:**\n1. **Domain not loading** → Check DNS records and SSL\n2. **SSL error** → Reinstall SSL certificate\n3. **Deployment failed** → Check build logs and framework\n4. **Slow performance** → Monitor resource usage\n\nTell me more about the issue and I'll investigate!`;
  }

  // ---- Help ----
  if (/help|how|what can|guide|tutorial|support/i.test(lowerMsg)) {
    return `❓ **FahadCloud Help Center**\n\nI can help you with:\n\n🌐 **Domains** - Search, register, manage, DNS\n🖥️ **Hosting** - Create, manage, scale environments\n🔒 **SSL** - Install, manage, auto-renew certificates\n🚀 **Deploy** - Deploy apps from Git or upload\n📊 **Monitoring** - Real-time metrics and alerts\n🛡️ **Security** - WAF, DDoS protection, scanning\n💳 **Payments** - bKash payments, order tracking\n🤖 **AI Agents** - 14 agents for cloud management\n\nJust describe what you need in natural language, and I'll connect you with the right agent!\n\n**Quick actions:** Try "search domain", "create hosting", "install SSL", or "check monitoring"`;
  }

  // ---- Thank you ----
  if (/thank|thanks|thx|ধন্যবাদ|শুকরিয়া/i.test(lowerMsg)) {
    return `You're welcome! 😊 I'm always here to help. Is there anything else you need assistance with?`;
  }

  // ---- Who are you ----
  if (/who are you|what are you|your name|about you/i.test(lowerMsg)) {
    return `🤖 I'm **FahadCloud AI Assistant**, an intelligent cloud management assistant powered by 14 specialized AI agents.\n\nI can help you manage domains, hosting, SSL, DNS, deployments, monitoring, security, payments, and more - all through natural conversation!\n\nI was built specifically for the FahadCloud platform and I understand the Bangladesh cloud market, including bKash payments and local pricing in BDT.`;
  }

  // ---- Default contextual response ----
  const knowledge = getRelevantKnowledge(intent, message);
  const stepsInfo = completedSteps > 0 ? `\n\n**Actions taken:** ${completedSteps} of ${totalSteps} steps completed.` : '';
  const agentInfo = activeAgents.length > 0 ? `\n\n**Active agents:** ${activeAgents.join(', ')}` : '';
  
  let response = `I understand you're asking about "${message}". Let me help you with that!${stepsInfo}${agentInfo}`;
  
  if (knowledge.length > 0) {
    response += '\n\n**Here\'s what you should know:**\n' + knowledge.map(k => `• ${k}`).join('\n');
  }
  
  response += '\n\nWould you like me to help you with something specific? Try:\n• "Search for a domain"\n• "Create hosting"\n• "Check monitoring"\n• "Help" for all options';

  return response;
}

function generateSmartSuggestions(intent: string, message: string): string[] {
  const lowerMsg = message.toLowerCase();
  
  if (/domain/i.test(lowerMsg)) return ['Register a domain', 'Check DNS settings', 'Install SSL certificate', 'View my domains'];
  if (/hosting|server/i.test(lowerMsg)) return ['Create new hosting', 'View hosting plans', 'Restart environment', 'Check monitoring'];
  if (/ssl|https/i.test(lowerMsg)) return ['Install SSL', 'Check SSL status', 'Force HTTPS', 'View domains'];
  if (/dns/i.test(lowerMsg)) return ['Add DNS record', 'Configure email DNS', 'Check DNS propagation', 'Manage nameservers'];
  if (/deploy/i.test(lowerMsg)) return ['Deploy from Git', 'View deployment logs', 'Rollback deployment', 'Create hosting first'];
  if (/monitor/i.test(lowerMsg)) return ['View system metrics', 'Set up alerts', 'Check uptime', 'View error logs'];
  if (/database|db/i.test(lowerMsg)) return ['View database dashboard', 'Create backup', 'Check Redis status', 'View Qdrant collections'];
  if (/security/i.test(lowerMsg)) return ['Run security scan', 'Enable 2FA', 'View audit logs', 'Check firewall'];
  if (/pay|bkash|order/i.test(lowerMsg)) return ['Create order', 'View payment history', 'Check balance', 'View pricing'];
  if (/learn|research/i.test(lowerMsg)) return ['Start new research', 'View learning sessions', 'Explore knowledge base', 'Ask about a topic'];
  
  return ['Search for a domain', 'Create hosting environment', 'Check system monitoring', 'View database dashboard'];
}

export { generateDetailedResponse, generateSmartSuggestions, getRelevantKnowledge, KNOWLEDGE_BASE };
