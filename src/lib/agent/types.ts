// ============ MULTI-AGENT TYPES & DEFINITIONS ============
// FahadCloud Advanced Autonomous Multi-Agent Cloud Intelligence System v3.0
// 20+ Specialized AI Agents with Real AI Power

export type AgentId = 
  | 'devops' | 'security' | 'deployment' | 'monitoring' 
  | 'debugging' | 'infrastructure' | 'database' | 'optimization'
  | 'recovery' | 'scaling' | 'dns_domain' | 'payment' | 'supervisor'
  | 'auto_learning'
  // NEW AGENTS v3.0
  | 'coding' | 'ui_design' | 'research' | 'self_improvement'
  | 'bug_detector' | 'bug_fixer' | 'devops_advanced' | 'chat';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  capabilities: string[];
  specializations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  canAutoExecute: boolean;
  requiresApproval: string[];
  cooldownMs: number;
  maxConcurrentTasks: number;
  icon: string;
  color: string;
  version: string;
  intelligenceLevel: number;
  learningEnabled: boolean;
  isAiPowered: boolean; // NEW: marks real AI agents
  aiModel?: string; // NEW: which AI model this agent uses
}

export const AGENT_DEFINITIONS: Record<AgentId, AgentDefinition> = {
  // ============ ORIGINAL AGENTS (UPGRADED TO REAL AI) ============
  
  devops: {
    id: 'devops',
    name: 'DevOps Agent',
    description: 'AI-powered DevOps automation with intelligent CI/CD pipeline management, build optimization, and deployment workflows.',
    capabilities: [
      'ci_cd_pipeline_management', 'build_optimization', 'deployment_automation',
      'environment_configuration', 'release_management', 'rollback_execution',
      'artifact_management', 'dependency_management', 'container_orchestration',
      'multi_environment_deploy', 'blue_green_deployment', 'canary_release',
    ],
    specializations: ['react', 'nextjs', 'vue', 'nodejs', 'python', 'php', 'docker', 'kubernetes'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['production_deploy', 'database_migration', 'config_change'],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'Rocket',
    color: 'from-orange-500 to-red-500',
    version: '3.0',
    intelligenceLevel: 9,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  security: {
    id: 'security',
    name: 'Security Agent',
    description: 'AI-powered autonomous security with real threat detection, vulnerability scanning, and behavioral anomaly analysis.',
    capabilities: [
      'threat_detection', 'intrusion_prevention', 'vulnerability_scanning',
      'malware_scanning', 'firewall_optimization', 'ssl_management',
      'access_control', 'audit_logging', 'behavioral_anomaly_detection',
      'exploit_prevention', 'secret_rotation', 'compliance_checking',
      'zero_day_detection', 'rate_limit_enforcement', 'ip_reputation_check',
    ],
    specializations: ['network_security', 'application_security', 'infrastructure_security', 'compliance'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['block_ip', 'disable_service', 'quarantine_resource'],
    cooldownMs: 2000,
    maxConcurrentTasks: 10,
    icon: 'Shield',
    color: 'from-red-500 to-red-700',
    version: '3.0',
    intelligenceLevel: 10,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  deployment: {
    id: 'deployment',
    name: 'Deployment Agent',
    description: 'AI-powered deployment with intelligent framework detection, build optimization, and zero-downtime deployment.',
    capabilities: [
      'framework_detection', 'build_execution', 'deployment_verification',
      'rollback_management', 'blue_green_deploy', 'canary_deploy',
      'static_site_deploy', 'container_deploy', 'ssl_provisioning',
      'github_sync', 'environment_setup', 'dependency_installation',
    ],
    specializations: ['react', 'nextjs', 'nuxt', 'vue', 'nodejs', 'python', 'php', 'docker'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['production_deploy', 'database_migration'],
    cooldownMs: 3000,
    maxConcurrentTasks: 8,
    icon: 'Rocket',
    color: 'from-orange-500 to-amber-500',
    version: '3.0',
    intelligenceLevel: 9,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  monitoring: {
    id: 'monitoring',
    name: 'Monitoring Agent',
    description: 'AI-enhanced monitoring with predictive alerting, anomaly detection, and intelligent scaling recommendations.',
    capabilities: [
      'cpu_monitoring', 'ram_monitoring', 'disk_monitoring', 'network_monitoring',
      'anomaly_detection', 'predictive_alerting', 'auto_scaling_recommendation',
      'health_check', 'uptime_monitoring', 'performance_profiling',
      'log_analysis', 'metric_aggregation', 'custom_alerts',
    ],
    specializations: ['infrastructure', 'application', 'network', 'database'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: [],
    cooldownMs: 1000,
    maxConcurrentTasks: 15,
    icon: 'Activity',
    color: 'from-yellow-500 to-orange-500',
    version: '3.0',
    intelligenceLevel: 8,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  debugging: {
    id: 'debugging',
    name: 'Debug Agent',
    description: 'AI-powered debugging with intelligent error analysis, stack trace interpretation, and root cause identification.',
    capabilities: [
      'error_analysis', 'stack_trace_interpretation', 'root_cause_analysis',
      'log_correlation', 'performance_debugging', 'memory_leak_detection',
      'network_debugging', 'configuration_debugging', 'dependency_conflict_resolution',
    ],
    specializations: ['javascript', 'typescript', 'python', 'nodejs', 'react', 'nextjs'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: [],
    cooldownMs: 2000,
    maxConcurrentTasks: 8,
    icon: 'Bug',
    color: 'from-purple-500 to-pink-500',
    version: '3.0',
    intelligenceLevel: 9,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  infrastructure: {
    id: 'infrastructure',
    name: 'Infrastructure Agent',
    description: 'AI-powered infrastructure management with Docker/K8s orchestration and infrastructure-as-code generation.',
    capabilities: [
      'docker_management', 'kubernetes_orchestration', 'server_provisioning',
      'cluster_management', 'iac_generation', 'network_configuration',
      'load_balancing', 'reverse_proxy', 'storage_management',
    ],
    specializations: ['docker', 'kubernetes', 'nginx', 'linux', 'networking'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['destroy_container', 'modify_network', 'change_proxy'],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'Server',
    color: 'from-gray-500 to-gray-700',
    version: '3.0',
    intelligenceLevel: 9,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  database: {
    id: 'database',
    name: 'Database Agent',
    description: 'AI-powered database management with query optimization, schema analysis, and automated migrations.',
    capabilities: [
      'database_creation', 'migration_management', 'backup_scheduling',
      'query_optimization', 'schema_analysis', 'performance_tuning',
      'replication_setup', 'connection_pooling', 'index_optimization',
    ],
    specializations: ['sqlite', 'postgresql', 'mysql', 'mongodb', 'redis'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['drop_database', 'destructive_migration'],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'Database',
    color: 'from-cyan-500 to-blue-500',
    version: '3.0',
    intelligenceLevel: 9,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  optimization: {
    id: 'optimization',
    name: 'Optimization Agent',
    description: 'AI-powered performance optimization with intelligent caching strategies and resource optimization.',
    capabilities: [
      'performance_optimization', 'caching_strategy', 'resource_optimization',
      'bundle_optimization', 'image_optimization', 'database_optimization',
      'cdn_configuration', 'lazy_loading', 'code_splitting',
    ],
    specializations: ['frontend', 'backend', 'database', 'network'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: [],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'Zap',
    color: 'from-amber-500 to-yellow-500',
    version: '3.0',
    intelligenceLevel: 8,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  recovery: {
    id: 'recovery',
    name: 'Recovery Agent',
    description: 'AI-powered disaster recovery with automated backup restoration and service healing.',
    capabilities: [
      'disaster_recovery', 'backup_restoration', 'service_healing',
      'failover_management', 'data_recovery', 'configuration_recovery',
    ],
    specializations: ['backup', 'restoration', 'failover'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['restore_from_backup', 'failover_switch'],
    cooldownMs: 10000,
    maxConcurrentTasks: 3,
    icon: 'RotateCcw',
    color: 'from-emerald-500 to-teal-500',
    version: '3.0',
    intelligenceLevel: 9,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  scaling: {
    id: 'scaling',
    name: 'Scaling Agent',
    description: 'AI-powered auto-scaling with predictive resource provisioning and load balancing.',
    capabilities: [
      'auto_scaling', 'horizontal_scaling', 'vertical_scaling',
      'load_balancing', 'resource_provisioning', 'capacity_planning',
    ],
    specializations: ['horizontal', 'vertical', 'cluster', 'serverless'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['scale_down', 'provision_new_instance'],
    cooldownMs: 10000,
    maxConcurrentTasks: 3,
    icon: 'TrendingUp',
    color: 'from-blue-500 to-indigo-500',
    version: '3.0',
    intelligenceLevel: 8,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  dns_domain: {
    id: 'dns_domain',
    name: 'DNS Agent',
    description: 'AI-powered DNS management with automatic configuration, zone management, and real DNS resolution serving.',
    capabilities: [
      'dns_configuration', 'zone_management', 'record_optimization',
      'propagation_verification', 'dns_serving', 'dnssec_management',
    ],
    specializations: ['bind', 'dnsmasq', 'cloudflare', 'route53'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['change_nameservers', 'delete_zone'],
    cooldownMs: 3000,
    maxConcurrentTasks: 8,
    icon: 'Globe',
    color: 'from-sky-500 to-blue-500',
    version: '3.0',
    intelligenceLevel: 8,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  payment: {
    id: 'payment',
    name: 'Payment Agent',
    description: 'AI-enhanced payment processing with fraud detection and billing intelligence.',
    capabilities: [
      'payment_processing', 'fraud_detection', 'billing_management',
      'invoice_generation', 'subscription_management', 'refund_processing',
    ],
    specializations: ['stripe', 'bkash', 'nagad', 'paypal'],
    riskLevel: 'high',
    canAutoExecute: false,
    requiresApproval: ['process_refund', 'apply_discount', 'change_pricing'],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'CreditCard',
    color: 'from-green-500 to-emerald-500',
    version: '3.0',
    intelligenceLevel: 7,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  supervisor: {
    id: 'supervisor',
    name: 'Supervisor Agent',
    description: 'AI master supervisor that monitors all agents, handles escalations, and ensures system reliability.',
    capabilities: [
      'agent_monitoring', 'escalation_handling', 'system_reliability',
      'conflict_resolution', 'priority_management', 'resource_allocation',
    ],
    specializations: ['management', 'coordination', 'escalation'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: [],
    cooldownMs: 1000,
    maxConcurrentTasks: 20,
    icon: 'Eye',
    color: 'from-indigo-500 to-purple-500',
    version: '3.0',
    intelligenceLevel: 10,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  auto_learning: {
    id: 'auto_learning',
    name: 'Auto-Learning Agent',
    description: 'AI-powered continuous learning engine with real knowledge graph building, pattern recognition, and web research.',
    capabilities: [
      'web_research', 'pattern_recognition', 'knowledge_graph_building',
      'insight_generation', 'model_improvement', 'documentation_analysis',
      'cross_domain_learning', 'adaptive_behavior',
    ],
    specializations: ['ml', 'nlp', 'knowledge_management', 'research'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: [],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'GraduationCap',
    color: 'from-violet-500 to-purple-500',
    version: '3.0',
    intelligenceLevel: 10,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },

  // ============ NEW AGENTS v3.0 ============

  coding: {
    id: 'coding',
    name: 'Coding Agent',
    description: 'AI-powered code generation, refactoring, and review. Can write, analyze, and improve code across multiple languages.',
    capabilities: [
      'code_generation', 'code_review', 'refactoring', 'bug_fixing',
      'test_generation', 'documentation_generation', 'code_optimization',
      'api_development', 'database_schema_design', 'algorithm_design',
      'pattern_implementation', 'code_migration',
    ],
    specializations: ['typescript', 'javascript', 'python', 'rust', 'go', 'sql', 'html', 'css', 'react', 'nextjs', 'nodejs'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['production_code_change', 'database_migration', 'api_modification'],
    cooldownMs: 3000,
    maxConcurrentTasks: 5,
    icon: 'Code',
    color: 'from-blue-500 to-cyan-500',
    version: '3.0',
    intelligenceLevel: 10,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  ui_design: {
    id: 'ui_design',
    name: 'UI Agent',
    description: 'AI-powered UI/UX design with component generation, accessibility analysis, and responsive layout creation.',
    capabilities: [
      'component_generation', 'layout_design', 'responsive_design',
      'accessibility_analysis', 'color_scheme_generation', 'typography_optimization',
      'animation_design', 'design_system_management', 'css_generation',
      'ux_review', 'wireframe_generation',
    ],
    specializations: ['react', 'tailwind', 'css', 'html', 'accessibility', 'design-systems'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: [],
    cooldownMs: 2000,
    maxConcurrentTasks: 5,
    icon: 'Palette',
    color: 'from-pink-500 to-rose-500',
    version: '3.0',
    intelligenceLevel: 9,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  research: {
    id: 'research',
    name: 'Research Agent',
    description: 'AI-powered web research with real-time information gathering, document analysis, and knowledge synthesis.',
    capabilities: [
      'web_search', 'document_analysis', 'knowledge_synthesis',
      'trend_analysis', 'competitive_analysis', 'technology_evaluation',
      'best_practice_discovery', 'documentation_research', 'api_documentation',
    ],
    specializations: ['web_search', 'academic_research', 'technology', 'market_analysis'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: [],
    cooldownMs: 2000,
    maxConcurrentTasks: 8,
    icon: 'BookOpen',
    color: 'from-teal-500 to-cyan-500',
    version: '3.0',
    intelligenceLevel: 9,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  self_improvement: {
    id: 'self_improvement',
    name: 'Self-Improvement Agent',
    description: 'AI agent that continuously analyzes and improves the FahadCloud system itself - optimizing agents, fixing issues, and upgrading capabilities.',
    capabilities: [
      'self_analysis', 'agent_optimization', 'performance_improvement',
      'capability_expansion', 'error_pattern_learning', 'efficiency_boosting',
      'codebase_analysis', 'architecture_improvement', 'best_practice_adoption',
      'automated_refactoring', 'dependency_updates', 'security_hardening',
    ],
    specializations: ['meta_learning', 'system_optimization', 'continuous_improvement'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['agent_modification', 'architecture_change', 'breaking_update'],
    cooldownMs: 10000,
    maxConcurrentTasks: 3,
    icon: 'Cog',
    color: 'from-fuchsia-500 to-purple-500',
    version: '3.0',
    intelligenceLevel: 10,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  bug_detector: {
    id: 'bug_detector',
    name: 'Bug Detector Agent',
    description: 'AI-powered continuous bug scanning that detects broken APIs, missing imports, dead code, memory leaks, and security vulnerabilities.',
    capabilities: [
      'broken_api_detection', 'missing_import_detection', 'dead_code_analysis',
      'memory_leak_detection', 'security_vulnerability_scanning', 'error_pattern_analysis',
      'log_analysis', 'performance_regression_detection', 'dependency_conflict_detection',
      'configuration_error_detection', 'type_error_detection', 'runtime_error_prediction',
    ],
    specializations: ['static_analysis', 'dynamic_analysis', 'security_auditing', 'performance_profiling'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: [],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'Search',
    color: 'from-red-400 to-orange-500',
    version: '3.0',
    intelligenceLevel: 9,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  bug_fixer: {
    id: 'bug_fixer',
    name: 'Auto Fix Agent',
    description: 'AI-powered automatic bug fixing with patch generation, test running, and safe rollback capabilities.',
    capabilities: [
      'patch_generation', 'test_running', 'safe_rollback', 'fix_verification',
      'incremental_fixing', 'dependency_fixing', 'configuration_fixing',
      'security_patch_application', 'performance_fix', 'compatibility_fix',
    ],
    specializations: ['automated_fixing', 'testing', 'rollback', 'safe_deployment'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['production_fix', 'database_fix', 'breaking_change_fix'],
    cooldownMs: 10000,
    maxConcurrentTasks: 3,
    icon: 'Wrench',
    color: 'from-green-500 to-emerald-500',
    version: '3.0',
    intelligenceLevel: 9,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
  
  devops_advanced: {
    id: 'devops_advanced',
    name: 'Advanced DevOps Agent',
    description: 'Advanced infrastructure, multi-cloud, GitOps',
    capabilities: ['multi_cloud', 'gitops', 'infrastructure_as_code', 'monitoring'],
    specializations: ['aws', 'gcp', 'azure', 'terraform'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['destroy', 'delete', 'remove'],
    cooldownMs: 5000,
    maxConcurrentTasks: 3,
    icon: '🚀',
    color: 'from-blue-500 to-indigo-500',
    version: '2.0.0',
    intelligenceLevel: 0.8,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'default',
  },

  chat: {
    id: 'chat',
    name: 'Chat Agent',
    description: 'AI-powered conversational interface with natural language understanding, context awareness, and intelligent routing.',
    capabilities: [
      'natural_language_understanding', 'conversation_management', 'context_awareness',
      'intent_routing', 'multi_turn_dialogue', 'explanation_generation',
      'task_delegation', 'clarification_requesting', 'feedback_handling',
    ],
    specializations: ['conversation', 'routing', 'explanation', 'assistance'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: [],
    cooldownMs: 500,
    maxConcurrentTasks: 20,
    icon: 'MessageSquare',
    color: 'from-emerald-500 to-teal-500',
    version: '3.0',
    intelligenceLevel: 9,
    learningEnabled: true,
    isAiPowered: true,
    aiModel: 'z-ai-chat',
  },
};

// ============ HELPER FUNCTIONS ============

export function getAgentForIntent(intent: string): AgentId {
  const intentAgentMap: Record<string, AgentId> = {
    domain_check: 'dns_domain',
    domain_register: 'dns_domain',
    domain_manage: 'dns_domain',
    hosting_deploy: 'deployment',
    hosting_manage: 'devops',
    hosting_configure: 'devops',
    ssl_install: 'security',
    ssl_manage: 'security',
    dns_configure: 'dns_domain',
    dns_manage: 'dns_domain',
    database_create: 'database',
    database_manage: 'database',
    storage_upload: 'infrastructure',
    shell_execute: 'devops',
    monitoring_check: 'monitoring',
    monitoring_setup: 'monitoring',
    payment_check: 'payment',
    optimization: 'optimization',
    troubleshoot: 'debugging',
    code_review: 'coding',
    security_scan: 'security',
    bug_detect: 'bug_detector',
    bug_fix: 'bug_fixer',
    learn_topic: 'auto_learning',
    agent_status: 'supervisor',
    self_improve: 'self_improvement',
    general_help: 'chat',
    greeting: 'chat',
  };
  return intentAgentMap[intent] || 'chat';
}

export function getAgentsForComplexTask(intent: string): AgentId[] {
  const complexTaskMap: Record<string, AgentId[]> = {
    hosting_deploy: ['deployment', 'devops', 'dns_domain', 'security', 'monitoring'],
    security_scan: ['security', 'bug_detector', 'monitoring', 'supervisor'],
    bug_fix: ['bug_detector', 'bug_fixer', 'coding', 'debugging'],
    optimization: ['optimization', 'monitoring', 'coding', 'infrastructure'],
    self_improve: ['self_improvement', 'auto_learning', 'research', 'coding'],
    troubleshoot: ['debugging', 'bug_detector', 'monitoring', 'infrastructure'],
  };
  return complexTaskMap[intent] || [getAgentForIntent(intent)];
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

// ============ KEEP EXISTING TYPES (compatibility) ============

export interface AgentMessage {
  id: string;
  agentId: AgentId;
  type: 'request' | 'response' | 'notification' | 'error';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentTaskRequest {
  id: string;
  agentId: AgentId;
  task: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  input: Record<string, any>;
  dependencies?: string[];
  createdAt: Date;
}

export interface AgentTaskResult {
  taskId: string;
  agentId: AgentId;
  success: boolean;
  output: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface OrchestrationPlan {
  id: string;
  sessionId: string;
  userId: string;
  originalRequest: string;
  steps: OrchestrationStep[];
  status: 'planning' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
}

export interface OrchestrationStep {
  step: number;
  agentId: AgentId;
  action: string;
  description: string;
  input: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentCollaborationContext {
  sessionId: string;
  userId: string;
  originalRequest: string;
  classifiedIntent: string;
  activeAgents: AgentId[];
  sharedMemory: Record<string, any>;
  decisions: AgentDecision[];
  timeline: AgentTimelineEntry[];
}

export interface AgentDecision {
  id: string;
  agentId: AgentId;
  decision: string;
  reasoning: string;
  confidence: number;
  timestamp: Date;
  impact?: string;
}

export interface AgentTimelineEntry {
  timestamp: Date;
  agentId: AgentId;
  event: string;
  details?: string;
}

export interface ThoughtStep {
  step: number;
  type: 'analyze' | 'plan' | 'reason' | 'decide' | 'validate';
  content: string;
  confidence?: number;
}

export interface ReasoningChain {
  id: string;
  steps: ThoughtStep[];
  conclusion: string;
  confidence: number;
}

export interface LearningRecord {
  id: string;
  agentId: AgentId;
  type: 'success' | 'failure' | 'optimization' | 'pattern' | 'insight';
  context: Record<string, any>;
  outcome: Record<string, any>;
  score: number;
  timestamp: Date;
  appliedInProduction: boolean;
}

export interface Prediction {
  id: string;
  agentId: AgentId;
  type: string;
  confidence: number;
  timeframe: string;
  details: Record<string, any>;
  preventativeActions: string[];
  createdAt: Date;
}

export interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  rules: SecurityRule[];
}

export interface SecurityRule {
  id: string;
  type: 'deny' | 'allow' | 'rate_limit' | 'require_approval';
  pattern: string;
  resource: string;
  action: string;
  threshold?: number;
  window?: number;
}

export type MemoryType = 
  | 'short_term' | 'long_term' | 'semantic' | 'workflow' 
  | 'infrastructure' | 'deployment' | 'security' | 'performance'
  | 'error_solution' | 'user_preference' | 'project_context' 
  | 'agent_learning' | 'optimization_history';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  category: string;
  key: string;
  value: any;
  relevance: number;
  accessCount: number;
  createdAt: Date;
  lastAccessed: Date;
  expiresAt?: Date;
  tags: string[];
  source: AgentId;
  connections: string[];
}

export interface MemoryQuery {
  types?: MemoryType[];
  category?: string;
  key?: string;
  textQuery?: string;
  minRelevance?: number;
  timeRange?: { from: Date; to: Date };
  limit?: number;
}
