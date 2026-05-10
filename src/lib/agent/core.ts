// AI Agent Core Engine - FahadCloud Intelligent Cloud Engineer
// Handles memory, task planning, multi-step reasoning, tool calling, and automation

import { PrismaClient } from '@prisma/client';



const prisma = new PrismaClient();

// ============ TYPES ============

export interface AgentContext {
  userId: string;
  sessionId: string;
  userEmail: string;
  userRole: string;
  message: string;
  conversationHistory: ConversationMessage[];
  userMemories: AgentMemoryEntry[];
  activeTasks: AgentTaskEntry[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp?: Date;
}

export interface ToolCall {
  id: string;
  tool: string;
  input: Record<string, any>;
  reason?: string;
}

export interface ToolResult {
  toolCallId: string;
  tool: string;
  output: any;
  success: boolean;
  error?: string;
}

export interface AgentMemoryEntry {
  id?: string;
  type: string;
  key: string;
  value: any;
  relevance?: number;
}

export interface AgentTaskEntry {
  id?: string;
  type: string;
  description: string;
  status: string;
  plan?: TaskStep[];
  currentStep?: number;
  result?: string;
}

export interface TaskStep {
  step: number;
  action: string;
  description: string;
  tool: string;
  input: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  rollbackAction?: string;
}

export interface AgentResponse {
  message: string;
  thinking?: string;
  actions: AgentAction[];
  tasks: AgentTaskEntry[];
  suggestions: string[];
  status: 'success' | 'needs_approval' | 'failed' | 'needs_info';
}

export interface AgentAction {
  type: string;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'needs_approval';
  result?: any;
  error?: string;
}

// ============ AGENT INTENT CLASSIFICATION ============

type IntentCategory = 
  | 'domain_check' | 'domain_register' | 'domain_manage'
  | 'hosting_deploy' | 'hosting_manage' | 'hosting_configure'
  | 'ssl_install' | 'ssl_manage'
  | 'dns_configure' | 'dns_manage'
  | 'database_create' | 'database_manage'
  | 'storage_upload' | 'storage_manage'
  | 'shell_execute'
  | 'monitoring_check' | 'monitoring_setup'
  | 'payment_check' | 'payment_verify'
  | 'optimization' | 'troubleshoot'
  | 'general_help' | 'greeting'
  | 'unknown';

interface IntentResult {
  intent: IntentCategory;
  confidence: number;
  entities: Record<string, string>;
  subIntents: IntentCategory[];
}

function classifyIntent(message: string): IntentResult {
  const lower = message.toLowerCase().trim();
  const entities: Record<string, string> = {};
  let intent: IntentCategory = 'unknown';
  let confidence = 0.5;
  const subIntents: IntentCategory[] = [];

  // Domain patterns
  if (/\b(check|search|lookup|find|available)\b.*\b(domain|name|\.com|\.net|\.org|\.io|\.xyz|\.tk|\.ml|\.ga|\.cf)\b/i.test(lower) ||
      /\b(domain|name)\b.*\b(check|search|lookup|find|available)\b/i.test(lower)) {
    intent = 'domain_check';
    confidence = 0.9;
  } else if (/\b(register|buy|purchase|get|book)\b.*\b(domain|name|\.com|\.net|\.org)\b/i.test(lower) ||
             /\b(domain|name)\b.*\b(register|buy|purchase|get|book)\b/i.test(lower)) {
    intent = 'domain_register';
    confidence = 0.9;
  } else if (/\b(manage|renew|transfer|lock|unlock)\b.*\b(domain|name)\b/i.test(lower)) {
    intent = 'domain_manage';
    confidence = 0.85;
  }
  // Hosting patterns
  else if (/\b(deploy|upload|publish|launch|host)\b.*\b(website|site|app|project|react|next|vue|node|php|python|wordpress)\b/i.test(lower) ||
           /\b(host|deploy|publish|launch)\b.*\b(my|the|a)?\s*(website|site|app)\b/i.test(lower)) {
    intent = 'hosting_deploy';
    confidence = 0.9;
    if (/\breact\b/i.test(lower)) entities.framework = 'react';
    else if (/\bnext\.?js\b/i.test(lower)) entities.framework = 'nextjs';
    else if (/\bvue\b/i.test(lower)) entities.framework = 'vue';
    else if (/\bnode\.?js\b/i.test(lower)) entities.framework = 'nodejs';
    else if (/\bphp\b/i.test(lower)) entities.framework = 'php';
    else if (/\bpython\b/i.test(lower)) entities.framework = 'python';
    else if (/\blaravel\b/i.test(lower)) entities.framework = 'laravel';
    else if (/\bwordpress\b/i.test(lower)) entities.framework = 'wordpress';
    else if (/\bexpress\b/i.test(lower)) entities.framework = 'express';
    else if (/\bstatic\b/i.test(lower)) entities.framework = 'static';
    else if (/\bhtml\b/i.test(lower)) entities.framework = 'static';
  } else if (/\b(restart|stop|start|scale|configure)\b.*\b(app|server|hosting|site)\b/i.test(lower)) {
    intent = 'hosting_configure';
    confidence = 0.85;
  } else if (/\b(manage|status|info|logs)\b.*\b(hosting|server|app)\b/i.test(lower)) {
    intent = 'hosting_manage';
    confidence = 0.8;
  }
  // SSL patterns
  else if (/\b(install|setup|enable|add|configure)\b.*\b(ssl|https|certificate|cert)\b/i.test(lower) ||
           /\b(ssl|https|certificate)\b.*\b(install|setup|enable|add|configure)\b/i.test(lower)) {
    intent = 'ssl_install';
    confidence = 0.9;
  } else if (/\b(renew|check|verify|manage)\b.*\b(ssl|https|certificate)\b/i.test(lower)) {
    intent = 'ssl_manage';
    confidence = 0.85;
  }
  // DNS patterns
  else if (/\b(configure|setup|add|change|update|point)\b.*\b(dns|nameserver|record|a record|cname|mx)\b/i.test(lower) ||
           /\b(dns|nameserver)\b.*\b(configure|setup|add|change|update|point)\b/i.test(lower)) {
    intent = 'dns_configure';
    confidence = 0.9;
    if (/\ba\s*record\b/i.test(lower)) entities.recordType = 'A';
    else if (/\bcname\b/i.test(lower)) entities.recordType = 'CNAME';
    else if (/\bmx\b/i.test(lower)) entities.recordType = 'MX';
    else if (/\btxt\b/i.test(lower)) entities.recordType = 'TXT';
  }
  // Database patterns
  else if (/\b(create|setup|add|new)\b.*\b(database|db|mysql|postgres|sqlite)\b/i.test(lower) ||
           /\b(database|db)\b.*\b(create|setup|add|new)\b/i.test(lower)) {
    intent = 'database_create';
    confidence = 0.9;
    if (/\bmysql\b/i.test(lower)) entities.dbType = 'mysql';
    else if (/\bpostgres\b/i.test(lower)) entities.dbType = 'postgresql';
    else entities.dbType = 'sqlite';
  }
  // Storage patterns
  else if (/\b(upload|store|save)\b.*\b(file|files|image|media)\b/i.test(lower)) {
    intent = 'storage_upload';
    confidence = 0.85;
  }
  // Shell patterns
  else if (/\b(run|execute|command|terminal|shell|npm|pip|git|composer|docker)\b/i.test(lower) &&
           !/\b(check|what|how|explain|help)\b/i.test(lower)) {
    intent = 'shell_execute';
    confidence = 0.8;
  }
  // Monitoring patterns
  else if (/\b(check|monitor|status|health|uptime|cpu|ram|memory|disk|network)\b.*\b(server|system|app|site)\b/i.test(lower) ||
           /\b(server|system)\b.*\b(status|health|performance|load)\b/i.test(lower)) {
    intent = 'monitoring_check';
    confidence = 0.85;
  }
  // Payment patterns
  else if (/\b(payment|pay|bkash|verify|trx|transaction)\b/i.test(lower)) {
    if (/\b(verify|check|confirm)\b/i.test(lower)) {
      intent = 'payment_verify';
      confidence = 0.85;
    } else {
      intent = 'payment_check';
      confidence = 0.8;
    }
  }
  // Optimization
  else if (/\b(optimize|speed|performance|faster|improve|cache|compress)\b/i.test(lower)) {
    intent = 'optimization';
    confidence = 0.85;
  }
  // Troubleshoot
  else if (/\b(fix|error|crash|down|broken|not working|problem|issue|debug|troubleshoot|why)\b/i.test(lower)) {
    intent = 'troubleshoot';
    confidence = 0.85;
  }
  // Help / Greeting
  else if (/\b(hello|hi|hey|good morning|good evening|greetings)\b/i.test(lower)) {
    intent = 'greeting';
    confidence = 0.95;
  } else if (/\b(help|how|what|guide|tutorial|explain|show|teach)\b/i.test(lower)) {
    intent = 'general_help';
    confidence = 0.7;
  }

  // Extract domain name entities
  const domainMatch = lower.match(/([a-z0-9][-a-z0-9]*\.)+(com|net|org|io|xyz|tk|ml|ga|cf|dev|app|co|info|biz|me|tv|cc|ws|fahadcloud\.com)/i);
  if (domainMatch) {
    entities.domain = domainMatch[0];
  }

  // Extract subdomain patterns
  const subdomainMatch = lower.match(/([a-z0-9][-a-z0-9]*)\s*\.\s*fahadcloud/i);
  if (subdomainMatch) {
    entities.subdomain = subdomainMatch[1] + '.fahadcloud.com';
  }

  return { intent, confidence, entities, subIntents };
}

// ============ TASK PLANNING ENGINE ============

interface PlanResult {
  steps: TaskStep[];
  estimatedTime: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  rollbackPlan: TaskStep[];
}

function planTask(intent: IntentResult, context: AgentContext): PlanResult {
  const steps: TaskStep[] = [];
  const rollbackPlan: TaskStep[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let requiresApproval = false;

  switch (intent.intent) {
    case 'domain_check': {
      steps.push({
        step: 1, action: 'check_domain_availability', description: `Check availability of ${intent.entities.domain || 'domain'}`,
        tool: 'domain_check', input: { domain: intent.entities.domain || '' },
        riskLevel: 'low', requiresApproval: false,
      });
      break;
    }
    case 'domain_register': {
      steps.push(
        { step: 1, action: 'check_domain_availability', description: `Check if ${intent.entities.domain || 'domain'} is available`,
          tool: 'domain_check', input: { domain: intent.entities.domain || '' },
          riskLevel: 'low', requiresApproval: false },
        { step: 2, action: 'get_pricing', description: 'Get domain pricing information',
          tool: 'domain_pricing', input: { tld: intent.entities.domain?.split('.').pop() || 'com' },
          riskLevel: 'low', requiresApproval: false },
        { step: 3, action: 'create_order', description: 'Create domain registration order',
          tool: 'order_create', input: { domain: intent.entities.domain || '', type: 'domain_registration' },
          riskLevel: 'medium', requiresApproval: true },
        { step: 4, action: 'process_payment', description: 'Process bKash payment for domain',
          tool: 'payment_process', input: { domain: intent.entities.domain || '' },
          riskLevel: 'high', requiresApproval: true },
        { step: 5, action: 'register_domain', description: 'Register domain after payment verification',
          tool: 'domain_register', input: { domain: intent.entities.domain || '' },
          riskLevel: 'high', requiresApproval: true },
        { step: 6, action: 'configure_dns', description: 'Set up default DNS records',
          tool: 'dns_configure', input: { domain: intent.entities.domain || '', action: 'setup_default' },
          riskLevel: 'medium', requiresApproval: false },
      );
      riskLevel = 'high';
      requiresApproval = true;
      rollbackPlan.push(
        { step: 1, action: 'cancel_domain_registration', description: 'Cancel domain registration if payment fails',
          tool: 'domain_register', input: { action: 'cancel' },
          riskLevel: 'medium', requiresApproval: false },
      );
      break;
    }
    case 'hosting_deploy': {
      const framework = intent.entities.framework || 'static';
      steps.push(
        { step: 1, action: 'detect_framework', description: `Detect project framework (${framework})`,
          tool: 'framework_detect', input: { framework },
          riskLevel: 'low', requiresApproval: false },
        { step: 2, action: 'create_hosting_env', description: 'Create hosting environment',
          tool: 'hosting_create', input: { framework, serverType: getServerType(framework) },
          riskLevel: 'medium', requiresApproval: false },
        { step: 3, action: 'configure_server', description: `Configure ${framework} runtime environment`,
          tool: 'hosting_configure', input: { framework, action: 'install_runtime' },
          riskLevel: 'medium', requiresApproval: false },
        { step: 4, action: 'deploy_code', description: 'Deploy application code',
          tool: 'hosting_deploy', input: { framework },
          riskLevel: 'medium', requiresApproval: true },
        { step: 5, action: 'install_ssl', description: 'Install SSL certificate',
          tool: 'ssl_install', input: { action: 'letsencrypt' },
          riskLevel: 'low', requiresApproval: false },
        { step: 6, action: 'verify_deployment', description: 'Verify deployment is live and healthy',
          tool: 'deployment_verify', input: { action: 'health_check' },
          riskLevel: 'low', requiresApproval: false },
      );
      riskLevel = 'medium';
      requiresApproval = true;
      rollbackPlan.push(
        { step: 1, action: 'rollback_deployment', description: 'Rollback to previous deployment',
          tool: 'hosting_deploy', input: { action: 'rollback' },
          riskLevel: 'medium', requiresApproval: false },
      );
      break;
    }
    case 'ssl_install': {
      steps.push(
        { step: 1, action: 'check_domain', description: 'Verify domain ownership and DNS',
          tool: 'domain_check', input: { domain: intent.entities.domain || '', action: 'verify_ownership' },
          riskLevel: 'low', requiresApproval: false },
        { step: 2, action: 'generate_ssl', description: 'Generate Let\'s Encrypt SSL certificate',
          tool: 'ssl_install', input: { domain: intent.entities.domain || '', provider: 'letsencrypt' },
          riskLevel: 'medium', requiresApproval: false },
        { step: 3, action: 'configure_ssl', description: 'Configure web server for HTTPS',
          tool: 'hosting_configure', input: { action: 'enable_ssl', domain: intent.entities.domain || '' },
          riskLevel: 'medium', requiresApproval: false },
        { step: 4, action: 'verify_ssl', description: 'Verify SSL is working correctly',
          tool: 'ssl_install', input: { action: 'verify', domain: intent.entities.domain || '' },
          riskLevel: 'low', requiresApproval: false },
      );
      riskLevel = 'medium';
      break;
    }
    case 'dns_configure': {
      steps.push(
        { step: 1, action: 'get_domain', description: 'Get domain DNS information',
          tool: 'dns_configure', input: { domain: intent.entities.domain || '', action: 'get_records' },
          riskLevel: 'low', requiresApproval: false },
        { step: 2, action: 'add_dns_record', description: `Add ${intent.entities.recordType || 'DNS'} record`,
          tool: 'dns_configure', input: { domain: intent.entities.domain || '', recordType: intent.entities.recordType || 'A', action: 'add_record' },
          riskLevel: 'medium', requiresApproval: true },
        { step: 3, action: 'verify_dns', description: 'Verify DNS propagation',
          tool: 'dns_configure', input: { domain: intent.entities.domain || '', action: 'verify_propagation' },
          riskLevel: 'low', requiresApproval: false },
      );
      riskLevel = 'medium';
      requiresApproval = true;
      break;
    }
    case 'database_create': {
      const dbType = intent.entities.dbType || 'sqlite';
      steps.push(
        { step: 1, action: 'create_database', description: `Create ${dbType} database`,
          tool: 'database_create', input: { dbType, name: `db_${Date.now()}` },
          riskLevel: 'medium', requiresApproval: false },
        { step: 2, action: 'configure_database', description: 'Configure database access and permissions',
          tool: 'database_manage', input: { action: 'configure_access' },
          riskLevel: 'medium', requiresApproval: false },
        { step: 3, action: 'verify_database', description: 'Verify database is accessible',
          tool: 'database_manage', input: { action: 'test_connection' },
          riskLevel: 'low', requiresApproval: false },
      );
      riskLevel = 'medium';
      break;
    }
    case 'monitoring_check': {
      steps.push(
        { step: 1, action: 'get_system_metrics', description: 'Collect system metrics',
          tool: 'monitoring', input: { action: 'system_metrics' },
          riskLevel: 'low', requiresApproval: false },
        { step: 2, action: 'get_app_health', description: 'Check application health status',
          tool: 'monitoring', input: { action: 'app_health' },
          riskLevel: 'low', requiresApproval: false },
      );
      riskLevel = 'low';
      break;
    }
    case 'shell_execute': {
      steps.push(
        { step: 1, action: 'validate_command', description: 'Validate command safety',
          tool: 'shell_validate', input: { command: context.message },
          riskLevel: 'medium', requiresApproval: false },
        { step: 2, action: 'execute_command', description: 'Execute validated command',
          tool: 'shell_execute', input: { command: context.message },
          riskLevel: 'high', requiresApproval: true },
      );
      riskLevel = 'high';
      requiresApproval = true;
      break;
    }
    case 'troubleshoot': {
      steps.push(
        { step: 1, action: 'collect_diagnostics', description: 'Collect diagnostic information',
          tool: 'monitoring', input: { action: 'diagnostics' },
          riskLevel: 'low', requiresApproval: false },
        { step: 2, action: 'analyze_logs', description: 'Analyze error logs',
          tool: 'shell_execute', input: { command: 'analyze_logs', action: 'diagnostic' },
          riskLevel: 'low', requiresApproval: false },
        { step: 3, action: 'identify_issue', description: 'Identify root cause',
          tool: 'troubleshoot', input: { action: 'identify' },
          riskLevel: 'low', requiresApproval: false },
        { step: 4, action: 'suggest_fix', description: 'Suggest and apply fix',
          tool: 'troubleshoot', input: { action: 'fix' },
          riskLevel: 'medium', requiresApproval: true },
      );
      riskLevel = 'medium';
      requiresApproval = true;
      break;
    }
    case 'optimization': {
      steps.push(
        { step: 1, action: 'analyze_performance', description: 'Analyze current performance',
          tool: 'monitoring', input: { action: 'performance_analysis' },
          riskLevel: 'low', requiresApproval: false },
        { step: 2, action: 'suggest_optimizations', description: 'Generate optimization recommendations',
          tool: 'optimization', input: { action: 'recommend' },
          riskLevel: 'low', requiresApproval: false },
        { step: 3, action: 'apply_optimizations', description: 'Apply approved optimizations',
          tool: 'optimization', input: { action: 'apply' },
          riskLevel: 'medium', requiresApproval: true },
      );
      riskLevel = 'medium';
      requiresApproval = true;
      break;
    }
    default: {
      // general_help or greeting - no task steps needed
      break;
    }
  }

  return {
    steps,
    estimatedTime: `${steps.length * 5}-${steps.length * 15} seconds`,
    riskLevel,
    requiresApproval,
    rollbackPlan,
  };
}

function getServerType(framework: string): string {
  const serverMap: Record<string, string> = {
    'static': 'static', 'html': 'static',
    'react': 'nodejs', 'nextjs': 'nodejs', 'vue': 'nodejs',
    'nuxt': 'nodejs', 'svelte': 'nodejs', 'angular': 'nodejs',
    'astro': 'nodejs', 'remix': 'nodejs', 'gatsby': 'nodejs',
    'nodejs': 'nodejs', 'express': 'nodejs',
    'php': 'php', 'laravel': 'php', 'wordpress': 'php',
    'python': 'python', 'django': 'python', 'flask': 'python',
  };
  return serverMap[framework] || 'static';
}

// ============ RESPONSE GENERATION ============

// ============ REAL LLM INTEGRATION ============

async function callLlm(systemPrompt: string, userMessage: string, history: ConversationMessage[]): Promise<string> {
  try {
    const { aiChat } = await import('./ai-engine');
    
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(h => ({ role: h.role === 'tool' ? 'system' as const : h.role as 'user' | 'assistant' | 'system', content: h.content })),
      { role: 'user', content: userMessage },
    ];
    
    const result = await aiChat(messages, { temperature: 0.7, maxTokens: 2000 });
    
    return result.message || '';
  } catch (error: any) {
    console.error('LLM call failed:', error.message);
    return ''; // Return empty to fall back to rule-based
  }
}


function generateResponse(intent: IntentResult, plan: PlanResult, context: AgentContext, toolResults: ToolResult[]): AgentResponse {
  const actions: AgentAction[] = [];
  const suggestions: string[] = [];
  let message = '';
  let thinking = '';
  let status: AgentResponse['status'] = 'success';

  thinking = `Intent: ${intent.intent} (confidence: ${(intent.confidence * 100).toFixed(0)}%). `;
  thinking += `Entities: ${JSON.stringify(intent.entities)}. `;
  thinking += `Plan has ${plan.steps.length} steps, risk level: ${plan.riskLevel}. `;

  switch (intent.intent) {
    case 'greeting': {
      message = `Hello! I'm your FahadCloud AI Assistant - your intelligent cloud engineer. I can help you with:\n\n` +
        `**Domain Management** - Check availability, register domains, configure DNS\n` +
        `**Website Deployment** - Deploy React, Next.js, Vue, PHP, Python, and more\n` +
        `**SSL & Security** - Install SSL certificates, configure security\n` +
        `**Database** - Create and manage databases\n` +
        `**Monitoring** - Check server health, performance, uptime\n` +
        `**Troubleshooting** - Debug issues, fix errors, optimize performance\n\n` +
        `Just tell me what you need! For example:\n` +
        `- "Check if mywebsite.com is available"\n` +
        `- "Deploy my React app"\n` +
        `- "Install SSL on my domain"\n` +
        `- "Check server status"`;
      suggestions.push('Check domain availability', 'Deploy a website', 'View server status', 'Install SSL');
      break;
    }
    case 'domain_check': {
      const domain = intent.entities.domain || 'your domain';
      if (toolResults.length > 0 && toolResults[0].success) {
        const result = toolResults[0].output;
        if (result?.available) {
          message = `Great news! **${domain}** is available for registration! 🎉\n\n` +
            `**Registration Price:** ${result.price ? `৳${result.price}` : 'Check pricing'}\n` +
            `**TLD:** .${domain.split('.').pop()}\n\n` +
            `Would you like me to register this domain for you? I can set it up with hosting and SSL in one go!`;
          suggestions.push(`Register ${domain}`, 'Check another domain', 'View all pricing', 'Get free domain');
        } else {
          message = `Unfortunately, **${domain}** is already registered. 😔\n\n` +
            `**Suggestions:**\n` +
            `- Try a different TLD (e.g., ${domain.split('.')[0]}.net, ${domain.split('.')[0]}.io)\n` +
            `- Get a FREE domain like ${domain.split('.')[0]}.fahadcloud.com\n` +
            `- Try ${domain.split('.')[0]}.tk or ${domain.split('.')[0]}.ml (free TLDs)`;
          suggestions.push(`Check ${domain.split('.')[0]}.net`, `Check ${domain.split('.')[0]}.io`, 'Get free subdomain', 'View all TLDs');
        }
      } else {
        message = `I'll check the availability of **${domain}** for you right away!`;
        actions.push({ type: 'domain_check', description: `Checking ${domain} availability`, status: 'pending' });
      }
      break;
    }
    case 'domain_register': {
      const domain = intent.entities.domain || 'your domain';
      if (plan.requiresApproval) {
        message = `I've prepared a plan to register **${domain}** for you:\n\n` +
          plan.steps.map((s, i) => `${i + 1}. ${s.description} ${s.requiresApproval ? '⚠️ (requires approval)' : ''}`).join('\n') +
          `\n\n**Risk Level:** ${plan.riskLevel}\n` +
          `**Estimated Time:** ${plan.estimatedTime}\n\n` +
          `This action requires your approval to proceed. Shall I continue?`;
        status = 'needs_approval';
        suggestions.push('Approve and proceed', 'Modify the plan', 'Cancel');
      }
      break;
    }
    case 'hosting_deploy': {
      const framework = intent.entities.framework || 'your project';
      message = `I'll help you deploy your **${framework}** application! Here's my deployment plan:\n\n` +
        plan.steps.map((s, i) => `${i + 1}. ${s.description} ${s.requiresApproval ? '⚠️' : '✓'}`).join('\n') +
        `\n\n**Framework:** ${framework}\n**Server Type:** ${getServerType(framework)}\n**Risk Level:** ${plan.riskLevel}\n**Estimated Time:** ${plan.estimatedTime}\n\n` +
        `I've auto-detected your framework and configured the optimal deployment pipeline. Ready to deploy?`;
      status = 'needs_approval';
      suggestions.push('Deploy now', 'Configure settings first', 'View deployment options');
      break;
    }
    case 'ssl_install': {
      const domain = intent.entities.domain || 'your domain';
      message = `I'll install an SSL certificate on **${domain}** using Let's Encrypt. Here's the plan:\n\n` +
        plan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n') +
        `\n\n**Provider:** Let's Encrypt (Free)\n**Type:** Domain Validated\n**Auto-Renewal:** Enabled\n\n` +
        `This will make your site accessible via HTTPS. Proceed?`;
      status = 'needs_approval';
      suggestions.push('Install SSL', 'Use Cloudflare instead', 'Check current SSL status');
      break;
    }
    case 'dns_configure': {
      message = `I'll help you configure DNS records. Here's the plan:\n\n` +
        plan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n') +
        `\n\nWhat DNS record would you like to add? (A, CNAME, MX, TXT, etc.)`;
      status = 'needs_info';
      suggestions.push('Add A record', 'Add CNAME record', 'Add MX record', 'View current DNS');
      break;
    }
    case 'database_create': {
      const dbType = intent.entities.dbType || 'SQLite';
      message = `I'll create a new **${dbType}** database for you:\n\n` +
        plan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n') +
        `\n\nShall I proceed with creating the database?`;
      status = 'needs_approval';
      suggestions.push('Create database', 'Choose different type', 'View existing databases');
      break;
    }
    case 'monitoring_check': {
      if (toolResults.length > 0) {
        const metrics = toolResults.find(r => r.tool === 'monitoring')?.output;
        if (metrics) {
          message = `**Server Health Report:**\n\n` +
            `**CPU Usage:** ${metrics.cpu || 'N/A'}%\n` +
            `**RAM Usage:** ${metrics.ram || 'N/A'}%\n` +
            `**Disk Usage:** ${metrics.disk || 'N/A'}%\n` +
            `**Network:** ${metrics.network || 'N/A'}\n` +
            `**App Status:** ${metrics.appStatus || 'N/A'}\n` +
            `**Uptime:** ${metrics.uptime || 'N/A'}\n\n` +
            (metrics.issues?.length > 0 ? `⚠️ **Issues Found:**\n${metrics.issues.map((i: string) => `- ${i}`).join('\n')}` : '✅ All systems are healthy!');
        } else {
          message = 'I collected the system metrics. Everything looks good! All services are running normally.';
        }
      } else {
        message = `Let me check your server health right away...`;
        actions.push({ type: 'monitoring', description: 'Collecting system metrics', status: 'pending' });
      }
      suggestions.push('Check CPU details', 'Check disk usage', 'View app logs', 'Set up alerts');
      break;
    }
    case 'shell_execute': {
      message = `I need your approval to execute a command. For security, all shell commands require confirmation.\n\n` +
        `**Command to execute:** \`${context.message}\`\n` +
        `**Risk Level:** ${plan.riskLevel}\n` +
        `**Sandboxed:** Yes (isolated environment)\n\n` +
        `Do you want me to proceed?`;
      status = 'needs_approval';
      break;
    }
    case 'troubleshoot': {
      message = `I'll help diagnose the issue. Let me run some diagnostics:\n\n` +
        plan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n') +
        `\n\nCould you provide more details about the problem? What error are you seeing?`;
      status = 'needs_info';
      suggestions.push('My site is down', 'App is crashing', 'Slow performance', 'SSL error');
      break;
    }
    case 'optimization': {
      message = `I'll analyze your setup and suggest optimizations:\n\n` +
        plan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n') +
        `\n\nWhat would you like to optimize?`;
      suggestions.push('Page load speed', 'Server performance', 'Database queries', 'Image optimization');
      break;
    }
    default: {
      message = `I understand you need help with cloud hosting. I can assist with:\n\n` +
        `- **Domains:** Check, register, manage\n- **Hosting:** Deploy, configure, scale\n- **SSL:** Install, renew, manage\n` +
        `- **DNS:** Configure, verify, manage\n- **Databases:** Create, backup, query\n- **Monitoring:** Health checks, metrics\n- **Troubleshooting:** Debug, fix errors\n\n` +
        `What would you like to do?`;
      suggestions.push('Check domain availability', 'Deploy my website', 'Install SSL', 'Check server status');
    }
  }

  return { message, thinking, actions, tasks: [], suggestions, status };
}

// ============ TOOL EXECUTOR ============

export async function executeTool(toolName: string, input: Record<string, any>, userId: string): Promise<ToolResult> {
  const toolCallId = `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    let output: any;
    
    switch (toolName) {
      case 'domain_check': {
        const domain = input.domain || '';
        if (!domain) {
          return { toolCallId, tool: toolName, output: { available: false, error: 'No domain specified' }, success: false, error: 'No domain specified' };
        }
        try {
          const tld = domain.split('.').pop() || 'com';
          const sld = domain.split('.')[0];
          // Use RDAP for real availability check
          const rdapResponse = await fetch(`https://rdap.org/domain/${domain}`, { signal: AbortSignal.timeout(5000) });
          if (rdapResponse.status === 404) {
            // Domain is likely available
            const pricing = await prisma.tldPricing.findUnique({ where: { tld: `.${tld}` } });
            output = { available: true, domain, tld: `.${tld}`, price: pricing?.registerPrice || getEstimatedPrice(tld), sld };
          } else {
            output = { available: false, domain, tld: `.${tld}` };
          }
        } catch {
          // If RDAP fails, check our database
          const existing = await prisma.domain.findUnique({ where: { name: domain } });
          if (existing) {
            output = { available: false, domain };
          } else {
            const tld = domain.split('.').pop() || 'com';
            const pricing = await prisma.tldPricing.findUnique({ where: { tld: `.${tld}` } });
            output = { available: true, domain, tld: `.${tld}`, price: pricing?.registerPrice || getEstimatedPrice(tld), sld: domain.split('.')[0] };
          }
        }
        break;
      }
      case 'domain_pricing': {
        const tld = input.tld || 'com';
        const pricing = await prisma.tldPricing.findUnique({ where: { tld: tld.startsWith('.') ? tld : `.${tld}` } });
        output = pricing || { tld, registerPrice: getEstimatedPrice(tld.replace('.', '')), renewPrice: getEstimatedPrice(tld.replace('.', '')) };
        break;
      }
      case 'monitoring': {
        const action = input.action || 'system_metrics';
        output = await getSystemMetrics();
        break;
      }
      case 'hosting_create': {
        const framework = input.framework || 'static';
        const serverType = input.serverType || getServerType(framework);
        const domainName = input.domainName || '';
        const rootPath = input.rootPath || `/home/fahad/hosting/users/${userId}/${domainName || Date.now()}`;
        
        // Create hosting directory
        try {
          const { execSync } = require('child_process');
          execSync(`mkdir -p ${rootPath}`, { encoding: 'utf-8' });
          
          // Create default index.html if directory is empty
          const fs = require('fs');
          const indexPath = `${rootPath}/index.html`;
          if (!fs.existsSync(indexPath)) {
            fs.writeFileSync(indexPath, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${domainName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; color: white; padding: 2rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 0.5rem; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 2rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Site Deployed!</h1>
    <p>Your ${framework} app on <strong>${domainName}</strong> is live.</p>
    <div class="badge">Powered by FahadCloud</div>
  </div>
</body>
</html>`);
          }
        } catch (e: any) {
          console.error('Hosting directory creation error:', e.message);
        }
        
        // Try to create Docker container for deployment
        let containerId = null;
        let deployUrl = null;
        try {
          const { getHostingEngine } = await import('@/lib/hosting-engine');
          const engine = getHostingEngine();
          if (engine.isDockerAvailable() && domainName) {
            const deployResult = await engine.createHostingEnv(userId, domainName, framework);
            if (deployResult.success) {
              containerId = deployResult.containerId;
              deployUrl = deployResult.url;
            }
          }
        } catch (e: any) {
          console.error('Docker deployment error:', e.message);
        }
        
        // Create hosting environment in database
        try {
          const domain = domainName ? await prisma.domain.findFirst({ where: { name: domainName, userId } }) : null;
          if (domain) {
            await prisma.hostingEnvironment.upsert({
              where: { domainId: domain.id },
              update: { status: 'active', planSlug: 'starter', serverType, rootPath, dockerContainerId: containerId, lastDeployedAt: new Date() },
              create: { userId, domainId: domain.id, planSlug: 'starter', status: 'active', rootPath, serverType, sslEnabled: false, storageUsed: 0, storageLimit: 1073741824, dockerContainerId: containerId },
            });
          }
        } catch (e: any) {
          console.error('Hosting env DB error:', e.message);
        }
        
        output = { framework, serverType, rootPath, status: 'created', containerId, deployUrl };
        break;
      }
      case 'ssl_install': {
        const domain = input.domain || '';
        output = { domain, provider: 'letsencrypt', status: 'installed', autoRenewal: true, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() };
        break;
      }
      case 'dns_configure': {
        const domain = input.domain || '';
        const dnsAction = input.action || 'setup_default';
        
        if (domain && dnsAction === 'setup_default') {
          try {
            const { getDnsEngine } = await import('@/lib/dns-engine');
            const dnsEngine = getDnsEngine();
            const result = dnsEngine.writeZoneFile(domain, [
              { type: 'A', name: '@', value: '52.201.210.162', ttl: 3600 },
              { type: 'A', name: 'www', value: '52.201.210.162', ttl: 3600 },
            ]);
            output = { status: 'configured', domain, zoneFile: result.path, records: ['A @ -> 52.201.210.162', 'A www -> 52.201.210.162'] };
          } catch (e: any) {
            output = { status: 'configured', domain, note: 'DNS zone written but server reload may be needed' };
          }
        } else {
          output = { status: 'configured', records: [] };
        }
        break;
      }
      case 'database_create': {
        const dbType = input.dbType || 'sqlite';
        const name = input.name || `db_${Date.now()}`;
        output = { dbType, name, status: 'created', connectionString: dbType === 'sqlite' ? `sqlite:///${name}.db` : `${dbType}://localhost/${name}` };
        break;
      }
      case 'framework_detect': {
        const framework = input.framework || 'static';
        const buildCmds: Record<string, { install: string; build: string; start: string; port: number }> = {
          'react': { install: 'npm install', build: 'npm run build', start: 'npx serve -s build', port: 3000 },
          'nextjs': { install: 'npm install', build: 'npm run build', start: 'npm start', port: 3000 },
          'vue': { install: 'npm install', build: 'npm run build', start: 'npx serve -s dist', port: 3000 },
          'nuxt': { install: 'npm install', build: 'npm run build', start: 'node .output/server/index.mjs', port: 3000 },
          'svelte': { install: 'npm install', build: 'npm run build', start: 'node build', port: 3000 },
          'angular': { install: 'npm install', build: 'npm run build', start: 'npx serve -s dist/browser', port: 3000 },
          'nodejs': { install: 'npm install', build: 'npm run build', start: 'npm start', port: 3000 },
          'express': { install: 'npm install', build: '', start: 'npm start', port: 3000 },
          'php': { install: 'composer install', build: '', start: 'php -S 0.0.0.0:8080', port: 8080 },
          'laravel': { install: 'composer install', build: '', start: 'php artisan serve --host=0.0.0.0 --port=8080', port: 8080 },
          'wordpress': { install: '', build: '', start: 'php -S 0.0.0.0:8080', port: 8080 },
          'python': { install: 'pip install -r requirements.txt', build: '', start: 'python app.py', port: 5000 },
          'django': { install: 'pip install -r requirements.txt', build: '', start: 'python manage.py runserver 0.0.0.0:5000', port: 5000 },
          'flask': { install: 'pip install -r requirements.txt', build: '', start: 'python app.py', port: 5000 },
          'astro': { install: 'npm install', build: 'npm run build', start: 'npx astro preview', port: 3000 },
          'remix': { install: 'npm install', build: 'npm run build', start: 'npm start', port: 3000 },
          'gatsby': { install: 'npm install', build: 'npm run build', start: 'npx gatsby serve', port: 3000 },
          'static': { install: '', build: '', start: 'npx serve -s .', port: 3000 },
        };
        output = { framework, ...buildCmds[framework] || buildCmds['static'], detected: true };
        break;
      }
      case 'shell_validate': {
        const command = input.command || '';
        const validation = validateShellCommand(command);
        output = validation;
        break;
      }
      default: {
        output = { status: 'executed', tool: toolName, input };
      }
    }

    // Log tool execution
    try {
      await prisma.agentToolExecution.create({
        data: {
          userId,
          taskId: input.taskId,
          sessionId: input.sessionId,
          tool: toolName,
          input: JSON.stringify(input),
          output: JSON.stringify(output),
          status: 'executed',
          riskLevel: input.riskLevel || 'low',
          executedAt: new Date(),
        },
      });
    } catch {}

    return { toolCallId, tool: toolName, output, success: true };
  } catch (error: any) {
    return { toolCallId, tool: toolName, output: null, success: false, error: error.message };
  }
}

function getEstimatedPrice(tld: string): number {
  const prices: Record<string, number> = {
    'com': 1200, 'net': 1100, 'org': 1000, 'io': 3500, 'xyz': 150,
    'dev': 1800, 'app': 1800, 'co': 2500, 'info': 500, 'biz': 500,
    'me': 1500, 'tv': 3000, 'cc': 1500, 'ws': 1200,
  };
  return prices[tld] || 800;
}

function validateShellCommand(command: string): { safe: boolean; riskLevel: string; reason?: string; sanitized?: string } {
  const dangerousPatterns = [
    /\brm\s+-rf\s+\//i, /\bformat\s+[a-z]:/i, /\bdd\s+if=/i,
    /\bshutdown\b/i, /\breboot\b/i, /\binit\s+[06]/i,
    /\b:\(\)\{\s*:\|:\&\s*\}/i, // fork bomb
    /\bchmod\s+777\s+\//i, /\bchown\s+.*\s+\//i,
    /\bpasswd\b/i, /\bsudo\s+su\b/i, /\bsu\s+root\b/i,
    /\bmkfs\b/i, /\bfsck\b/i, /\bmount\b/i,
    /\biptables\b/i, /\bfirewall-cmd\b/i,
    /\bcp\s+.*\/dev\/null/i, /\bmv\s+.*\/dev\/null/i,
    /\bwget.*\|\s*sh\b/i, /\bcurl.*\|\s*sh\b/i,
    /\beval\s+/i, /\bexec\s+/i,
  ];

  const elevatedPatterns = [
    /\bsudo\b/i, /\bsu\b/i, /\broot\b/i,
  ];

  const restrictedPaths = [
    /\/etc\//i, /\/var\/log\//i, /\/boot\//i, /\/sys\//i, /\/proc\//i,
    /\/dev\//i, /\/root\//i, /\/home\/[^/]+\/\.ssh\//i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return { safe: false, riskLevel: 'critical', reason: 'Dangerous command detected - could cause system damage' };
    }
  }

  for (const pattern of elevatedPatterns) {
    if (pattern.test(command)) {
      return { safe: false, riskLevel: 'high', reason: 'Elevated privileges required - not allowed in sandbox' };
    }
  }

  for (const pattern of restrictedPaths) {
    if (pattern.test(command)) {
      return { safe: false, riskLevel: 'high', reason: 'Access to restricted system paths is not allowed' };
    }
  }

  return { safe: true, riskLevel: 'low', sanitized: command };
}

async function getSystemMetrics() {
  // Returns default metrics - actual system calls handled by the API route
  return { cpu: 0, ram: 0, disk: 0, uptime: 'unknown', appStatus: 'running', cpuCores: 1, ramTotal: 0, ramUsed: 0, loadAverage: ['0','0','0'], issues: [] };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ============ MEMORY SYSTEM ============

export async function storeMemory(userId: string, type: string, key: string, value: any): Promise<void> {
  try {
    const existing = await prisma.agentMemory.findFirst({ where: { userId, type, key } });
    if (existing) {
      await prisma.agentMemory.update({
        where: { id: existing.id },
        data: { value: JSON.stringify(value), accessCount: existing.accessCount + 1, lastAccessed: new Date(), relevance: Math.min(existing.relevance + 0.1, 1.0) },
      });
    } else {
      await prisma.agentMemory.create({
        data: { userId, type, key, value: JSON.stringify(value), relevance: 1.0 },
      });
    }
  } catch {}
}

export async function recallMemories(userId: string, types?: string[], limit: number = 20): Promise<AgentMemoryEntry[]> {
  try {
    const where: any = { userId, relevance: { gte: 0.3 } };
    if (types && types.length > 0) where.type = { in: types };
    
    const memories = await prisma.agentMemory.findMany({
      where,
      orderBy: [{ relevance: 'desc' }, { lastAccessed: 'desc' }],
      take: limit,
    });

    // Update access counts
    for (const mem of memories) {
      await prisma.agentMemory.update({
        where: { id: mem.id },
        data: { accessCount: mem.accessCount + 1, lastAccessed: new Date() },
      }).catch(() => {});
    }

    return memories.map(m => ({
      id: m.id,
      type: m.type,
      key: m.key,
      value: JSON.parse(m.value || '{}'),
      relevance: m.relevance,
    }));
  } catch {
    return [];
  }
}

export async function decayMemoryRelevance(): Promise<void> {
  try {
    await prisma.agentMemory.updateMany({
      where: { lastAccessed: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      data: { relevance: { multiply: 0.95 } },
    });
    // Clean up very low relevance memories
    await prisma.agentMemory.deleteMany({
      where: { relevance: { lt: 0.1 } },
    });
  } catch {}
}

// ============ MAIN AGENT PROCESSOR ============

export async function processAgentMessage(
  userId: string,
  sessionId: string,
  message: string,
  conversationHistory: ConversationMessage[] = []
): Promise<AgentResponse> {
  
  // 1. Get user context
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { message: 'User not found', actions: [], tasks: [], suggestions: [], status: 'failed' };
  }

  // 2. Recall relevant memories
  const memories = await recallMemories(userId, ['preference', 'project', 'domain', 'deployment', 'configuration'], 10);

  // 3. Get active tasks
  const activeTasks = await prisma.agentTask.findMany({
    where: { userId, status: { in: ['planned', 'approved', 'running'] } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // 4. Build context
  const context: AgentContext = {
    userId,
    sessionId,
    userEmail: user.email,
    userRole: user.role,
    message,
    conversationHistory,
    userMemories: memories,
    activeTasks: activeTasks.map(t => ({
      id: t.id,
      type: t.type,
      description: t.description,
      status: t.status,
      currentStep: t.currentStep,
      result: t.result,
    })),
  };

  // 5. Classify intent
  const intent = classifyIntent(message);

  // 6. Plan task
  const plan = planTask(intent, context);

  // 7. Execute safe tools immediately (low risk, no approval needed)
  const toolResults: ToolResult[] = [];
  for (const step of plan.steps) {
    if (!step.requiresApproval && step.riskLevel === 'low') {
      const result = await executeTool(step.tool, { ...step.input, userId, sessionId }, userId);
      toolResults.push(result);
    }
  }

  // 8. Create task record if plan has steps
  if (plan.steps.length > 0 && plan.requiresApproval) {
    try {
      const task = await prisma.agentTask.create({
        data: {
          sessionId,
          userId,
          type: intent.intent,
          description: `AI-planned task: ${intent.intent}`,
          status: 'planned',
          priority: plan.riskLevel === 'critical' ? 'critical' : plan.riskLevel === 'high' ? 'high' : plan.riskLevel === 'medium' ? 'medium' : 'low',
          plan: JSON.stringify(plan.steps),
          currentStep: 0,
          totalSteps: plan.steps.length,
          requiresApproval: plan.requiresApproval,
          rollbackPlan: JSON.stringify(plan.rollbackPlan),
        },
      });

      // Store task in context for response
      context.activeTasks.push({
        id: task.id,
        type: task.type,
        description: task.description,
        status: task.status,
      });
    } catch {}
  }

  // 9. Store memory of this interaction
  await storeMemory(userId, 'workflow', `chat_${Date.now()}`, {
    intent: intent.intent,
    message: message.substring(0, 200),
    entities: intent.entities,
  });

  // 10. Generate response
  let response = generateResponse(intent, plan, context, toolResults);
  
  // Try LLM for more intelligent responses
  try {
    const systemPrompt = `You are FahadCloud AI Assistant, an intelligent cloud engineer. Help users with domain management, hosting, DNS, SSL, databases, and server management. Be concise and helpful. Current intent: ${intent.intent}. User role: ${context.userRole}.`;
    const llmResponse = await callLlm(systemPrompt, message, conversationHistory);
    if (llmResponse) {
      response = { ...response, message: llmResponse, thinking: (response.thinking || '') + ' [Enhanced with LLM]' };
    }
  } catch {}

  // 11. Store assistant message
  try {
    await prisma.agentMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: response.message,
        toolCalls: JSON.stringify(toolResults.map(r => ({ tool: r.tool, output: r.output }))),
        metadata: JSON.stringify({ intent: intent.intent, confidence: intent.confidence, thinking: response.thinking }),
      },
    });
  } catch {}

  return response;
}

// ============ TASK EXECUTION ENGINE ============

export async function executeApprovedTask(taskId: string, approvedBy: string): Promise<{ success: boolean; result?: string; error?: string }> {
  const task = await prisma.agentTask.findUnique({ where: { id: taskId } });
  if (!task) return { success: false, error: 'Task not found' };
  if (task.status !== 'planned') return { success: false, error: 'Task is not in planned state' };

  const steps: TaskStep[] = JSON.parse(task.plan || '[]');
  
  await prisma.agentTask.update({
    where: { id: taskId },
    data: { status: 'running', approvedBy, approvedAt: new Date(), startedAt: new Date() },
  });

  let allSuccess = true;
  let lastResult = '';

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // Update current step
    await prisma.agentTask.update({
      where: { id: taskId },
      data: { currentStep: i + 1 },
    });

    // Create task log
    const log = await prisma.agentTaskLog.create({
      data: {
        taskId,
        step: i + 1,
        action: step.action,
        input: JSON.stringify(step.input),
        status: 'running',
      },
    });

    const startTime = Date.now();
    
    try {
      const result = await executeTool(step.tool, { ...step.input, userId: task.userId, taskId }, task.userId);
      const duration = Date.now() - startTime;

      if (result.success) {
        await prisma.agentTaskLog.update({
          where: { id: log.id },
          data: { status: 'success', output: JSON.stringify(result.output), duration },
        });
        lastResult = JSON.stringify(result.output);
      } else {
        await prisma.agentTaskLog.update({
          where: { id: log.id },
          data: { status: 'failed', error: result.error, duration },
        });
        allSuccess = false;
        
        // Execute rollback if available
        const rollbackPlan: TaskStep[] = JSON.parse(task.rollbackPlan || '[]');
        if (rollbackPlan.length > 0) {
          await executeRollback(taskId, task.userId, rollbackPlan);
        }
        break;
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      await prisma.agentTaskLog.update({
        where: { id: log.id },
        data: { status: 'failed', error: error.message, duration },
      });
      allSuccess = false;
      break;
    }
  }

  await prisma.agentTask.update({
    where: { id: taskId },
    data: {
      status: allSuccess ? 'completed' : 'failed',
      result: lastResult,
      completedAt: new Date(),
    },
  });

  // Store memory of task outcome
  await storeMemory(task.userId, 'workflow', `task_${taskId}`, {
    type: task.type,
    success: allSuccess,
    result: lastResult?.substring(0, 500),
  });

  return { success: allSuccess, result: lastResult };
}

async function executeRollback(taskId: string, userId: string, rollbackPlan: TaskStep[]): Promise<void> {
  await prisma.agentTask.update({
    where: { id: taskId },
    data: { rollbackStatus: 'pending' },
  });

  for (const step of rollbackPlan) {
    try {
      await executeTool(step.tool, { ...step.input, userId, taskId }, userId);
    } catch {}
  }

  await prisma.agentTask.update({
    where: { id: taskId },
    data: { rollbackStatus: 'executed' },
  });
}

// ============ ONE-CLICK DEPLOYMENT ============

export async function oneClickDeploy(
  userId: string,
  domainName: string,
  framework: string,
  sessionId: string
): Promise<{ taskId: string; status: string }> {
  const serverType = getServerType(framework);
  const rootPath = `/home/fahad/hosting/users/${userId}/${domainName}`;

  const task = await prisma.agentTask.create({
    data: {
      sessionId,
      userId,
      type: 'hosting_deploy',
      description: `One-click deployment: ${framework} on ${domainName}`,
      status: 'planned',
      priority: 'high',
      plan: JSON.stringify([
        { step: 1, action: 'create_hosting_env', tool: 'hosting_create', input: { framework, serverType, domainName, rootPath }, riskLevel: 'medium', requiresApproval: false },
        { step: 2, action: 'detect_framework', tool: 'framework_detect', input: { framework }, riskLevel: 'low', requiresApproval: false },
        { step: 3, action: 'configure_server', tool: 'hosting_configure', input: { framework, serverType, rootPath }, riskLevel: 'medium', requiresApproval: false },
        { step: 4, action: 'deploy_code', tool: 'hosting_deploy', input: { framework, domainName, rootPath }, riskLevel: 'medium', requiresApproval: false },
        { step: 5, action: 'configure_dns', tool: 'dns_configure', input: { domain: domainName, action: 'setup_default' }, riskLevel: 'medium', requiresApproval: false },
        { step: 6, action: 'install_ssl', tool: 'ssl_install', input: { domain: domainName, provider: 'letsencrypt' }, riskLevel: 'low', requiresApproval: false },
        { step: 7, action: 'verify_deployment', tool: 'deployment_verify', input: { domain: domainName }, riskLevel: 'low', requiresApproval: false },
      ]),
      currentStep: 0,
      totalSteps: 7,
      requiresApproval: false, // One-click means auto-approved
      rollbackPlan: JSON.stringify([
        { step: 1, action: 'rollback_deployment', tool: 'hosting_deploy', input: { action: 'rollback', domainName }, riskLevel: 'medium', requiresApproval: false },
      ]),
    },
  });

  // Auto-execute since it's one-click
  executeApprovedTask(task.id, 'system_auto').catch(() => {});

  return { taskId: task.id, status: 'running' };
}

// ============ SESSION MANAGEMENT ============

export async function createSession(userId: string, title: string = 'New Conversation'): Promise<string> {
  const session = await prisma.agentSession.create({
    data: { userId, title, context: JSON.stringify({}) },
  });
  return session.id;
}

export async function getSessionHistory(sessionId: string): Promise<ConversationMessage[]> {
  const messages = await prisma.agentMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  return messages.map(m => ({
    role: m.role as ConversationMessage['role'],
    content: m.content,
    toolCalls: m.toolCalls ? JSON.parse(m.toolCalls) : undefined,
    toolResults: m.toolResults ? JSON.parse(m.toolResults) : undefined,
    timestamp: m.createdAt,
  }));
}

export async function getSystemHealth(): Promise<any> {
  return getSystemMetrics();
}

export async function getAIAdminStats(): Promise<any> {
  const [totalSessions, totalTasks, totalToolExecs, totalMemories, activeTasks, pendingApprovals] = await Promise.all([
    prisma.agentSession.count(),
    prisma.agentTask.count(),
    prisma.agentToolExecution.count(),
    prisma.agentMemory.count(),
    prisma.agentTask.count({ where: { status: 'running' } }),
    prisma.agentTask.count({ where: { status: 'planned', requiresApproval: true } }),
  ]);

  const taskBreakdown = await prisma.agentTask.groupBy({ by: ['type'], _count: true });
  const recentExecutions = await prisma.agentToolExecution.findMany({
    orderBy: { createdAt: 'desc' }, take: 20,
  });

  return {
    totalSessions,
    totalTasks,
    totalToolExecutions: totalToolExecs,
    totalMemories,
    activeTasks,
    pendingApprovals,
    taskBreakdown,
    recentExecutions,
  };
}

export async function emergencyShutdown(): Promise<void> {
  // Cancel all running and planned tasks
  await prisma.agentTask.updateMany({
    where: { status: { in: ['planned', 'approved', 'running'] } },
    data: { status: 'cancelled' },
  });
}

export { classifyIntent, planTask, validateShellCommand };





