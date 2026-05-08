// ============ MULTI-AGENT TYPES & DEFINITIONS ============
// FahadCloud Advanced Autonomous Multi-Agent Cloud Intelligence System

export type AgentId = 
  | 'devops' | 'security' | 'deployment' | 'monitoring' 
  | 'debugging' | 'infrastructure' | 'database' | 'optimization'
  | 'recovery' | 'scaling' | 'dns_domain' | 'payment' | 'supervisor';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  capabilities: string[];
  specializations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  canAutoExecute: boolean;
  requiresApproval: string[];  // action types that require approval
  cooldownMs: number;
  maxConcurrentTasks: number;
  icon: string;
  color: string;
}

export const AGENT_DEFINITIONS: Record<AgentId, AgentDefinition> = {
  devops: {
    id: 'devops',
    name: 'DevOps Agent',
    description: 'Manages CI/CD pipelines, build processes, deployment workflows, and DevOps automation.',
    capabilities: [
      'ci_cd_pipeline_management', 'build_optimization', 'deployment_automation',
      'environment_configuration', 'release_management', 'rollback_execution',
      'artifact_management', 'dependency_management', 'container_orchestration',
    ],
    specializations: ['react', 'nextjs', 'vue', 'nodejs', 'python', 'php', 'laravel', 'wordpress', 'docker'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['production_deploy', 'database_migration', 'config_change'],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'Rocket',
    color: 'from-orange-500 to-red-500',
  },
  security: {
    id: 'security',
    name: 'Security Agent',
    description: 'Autonomous security monitoring, threat detection, intrusion prevention, and vulnerability scanning.',
    capabilities: [
      'threat_detection', 'intrusion_prevention', 'vulnerability_scanning',
      'malware_scanning', 'firewall_optimization', 'ssl_management',
      'access_control', 'audit_logging', 'behavioral_anomaly_detection',
      'exploit_prevention', 'secret_rotation', 'compliance_checking',
    ],
    specializations: ['network_security', 'application_security', 'infrastructure_security', 'compliance'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['block_ip', 'disable_service', 'quarantine_resource'],
    cooldownMs: 2000,
    maxConcurrentTasks: 10,
    icon: 'Shield',
    color: 'from-red-500 to-red-700',
  },
  deployment: {
    id: 'deployment',
    name: 'Deployment Agent',
    description: 'Handles one-click deployments, framework detection, build optimization, and deployment verification.',
    capabilities: [
      'framework_detection', 'build_execution', 'deployment_verification',
      'rollback_management', 'blue_green_deploy', 'canary_deploy',
      'static_site_deploy', 'container_deploy', 'ssl_provisioning',
      'github_sync', 'environment_setup', 'dependency_installation',
    ],
    specializations: ['react', 'nextjs', 'nuxt', 'vue', 'nodejs', 'python', 'laravel', 'wordpress', 'docker', 'static'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['production_deploy', 'rollback', 'database_migration'],
    cooldownMs: 3000,
    maxConcurrentTasks: 3,
    icon: 'Rocket',
    color: 'from-emerald-500 to-teal-500',
  },
  monitoring: {
    id: 'monitoring',
    name: 'Monitoring Agent',
    description: 'Real-time system health monitoring, metric collection, anomaly detection, and alerting.',
    capabilities: [
      'system_metrics', 'application_health', 'uptime_monitoring',
      'performance_analysis', 'alert_management', 'log_aggregation',
      'anomaly_detection', 'capacity_planning', 'sla_monitoring',
      'custom_dashboards', 'real_time_streaming', 'predictive_alerts',
    ],
    specializations: ['server_monitoring', 'application_monitoring', 'network_monitoring', 'business_metrics'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: [],
    cooldownMs: 1000,
    maxConcurrentTasks: 20,
    icon: 'Monitor',
    color: 'from-blue-500 to-cyan-500',
  },
  debugging: {
    id: 'debugging',
    name: 'Debugging Agent',
    description: 'Autonomous problem diagnosis, root cause analysis, error resolution, and log analysis.',
    capabilities: [
      'error_analysis', 'root_cause_analysis', 'log_analysis',
      'performance_profiling', 'crash_diagnosis', 'dependency_conflict_resolution',
      'configuration_debugging', 'network_debugging', 'database_debugging',
      'automated_fix_suggestion', 'stack_trace_analysis', 'memory_leak_detection',
    ],
    specializations: ['javascript', 'python', 'php', 'database', 'network', 'system'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['apply_fix', 'restart_service', 'modify_config'],
    cooldownMs: 3000,
    maxConcurrentTasks: 5,
    icon: 'Bug',
    color: 'from-amber-500 to-orange-500',
  },
  infrastructure: {
    id: 'infrastructure',
    name: 'Infrastructure Agent',
    description: 'Manages servers, containers, networking, storage, and infrastructure-as-code generation.',
    capabilities: [
      'server_provisioning', 'container_management', 'network_configuration',
      'storage_management', 'infrastructure_as_code', 'environment_replication',
      'cluster_management', 'edge_deployment', 'reverse_proxy',
      'load_balancing', 'dns_routing', 'cdn_configuration',
    ],
    specializations: ['docker', 'kubernetes', 'nginx', 'networking', 'storage', 'compute'],
    riskLevel: 'high',
    canAutoExecute: false,
    requiresApproval: ['create_server', 'destroy_server', 'network_change', 'storage_resize'],
    cooldownMs: 10000,
    maxConcurrentTasks: 2,
    icon: 'Server',
    color: 'from-purple-500 to-indigo-500',
  },
  database: {
    id: 'database',
    name: 'Database Agent',
    description: 'Database creation, migration, optimization, backup, and intelligent query analysis.',
    capabilities: [
      'database_creation', 'migration_management', 'query_optimization',
      'backup_verification', 'replication_setup', 'schema_analysis',
      'index_optimization', 'connection_pooling', 'data_integrity',
      'performance_tuning', 'automated_backups', 'point_in_time_recovery',
    ],
    specializations: ['sqlite', 'mysql', 'postgresql', 'mongodb', 'redis'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['drop_database', 'schema_migration', 'data_deletion'],
    cooldownMs: 5000,
    maxConcurrentTasks: 3,
    icon: 'Database',
    color: 'from-teal-500 to-cyan-500',
  },
  optimization: {
    id: 'optimization',
    name: 'Optimization Agent',
    description: 'Performance optimization, caching, compression, CDN management, and intelligent tuning.',
    capabilities: [
      'performance_profiling', 'cache_optimization', 'compression_optimization',
      'cdn_optimization', 'image_optimization', 'code_splitting',
      'lazy_loading', 'bundle_analysis', 'server_tuning',
      'database_optimization', 'network_optimization', 'resource_right_sizing',
    ],
    specializations: ['frontend', 'backend', 'database', 'network', 'system'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['production_change', 'cache_invalidation', 'config_tuning'],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'Zap',
    color: 'from-yellow-500 to-amber-500',
  },
  recovery: {
    id: 'recovery',
    name: 'Recovery Agent',
    description: 'Automatic crash recovery, service restart, backup restoration, and self-healing infrastructure.',
    capabilities: [
      'crash_recovery', 'service_restart', 'backup_restoration',
      'failover_execution', 'data_recovery', 'configuration_recovery',
      'health_restoration', 'cascade_failure_prevention', 'disaster_recovery',
      'automated_remediation', 'state_reconstruction', 'partial_recovery',
    ],
    specializations: ['service_recovery', 'data_recovery', 'infrastructure_recovery', 'application_recovery'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['full_restore', 'failover_switch', 'data_overwrite'],
    cooldownMs: 3000,
    maxConcurrentTasks: 5,
    icon: 'RotateCcw',
    color: 'from-green-500 to-emerald-500',
  },
  scaling: {
    id: 'scaling',
    name: 'Scaling Agent',
    description: 'Auto-scaling, load balancing, resource allocation, and traffic management.',
    capabilities: [
      'horizontal_scaling', 'vertical_scaling', 'load_balancing',
      'traffic_management', 'resource_allocation', 'capacity_forecasting',
      'auto_scaling_groups', 'container_scaling', 'database_scaling',
      'cdn_scaling', 'queue_scaling', 'cost_optimization',
    ],
    specializations: ['compute_scaling', 'database_scaling', 'storage_scaling', 'network_scaling'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['scale_up', 'scale_down', 'resource_change'],
    cooldownMs: 15000,
    maxConcurrentTasks: 3,
    icon: 'TrendingUp',
    color: 'from-indigo-500 to-purple-500',
  },
  dns_domain: {
    id: 'dns_domain',
    name: 'DNS/Domain Agent',
    description: 'Domain registration, DNS management, WHOIS privacy, and intelligent DNS routing.',
    capabilities: [
      'domain_search', 'domain_registration', 'dns_record_management',
      'nameserver_configuration', 'whois_privacy', 'domain_transfer',
      'dns_propagation_check', 'geo_dns', 'failover_dns',
      'ssl_certificate_binding', 'domain_renewal', 'subdomain_management',
    ],
    specializations: ['domain_registration', 'dns_management', 'ssl_management', 'whois'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['domain_purchase', 'dns_change', 'nameserver_change'],
    cooldownMs: 3000,
    maxConcurrentTasks: 5,
    icon: 'Globe',
    color: 'from-emerald-500 to-green-500',
  },
  payment: {
    id: 'payment',
    name: 'Payment Verification Agent',
    description: 'bKash payment processing, fraud detection, TRX verification, and billing intelligence.',
    capabilities: [
      'payment_verification', 'fraud_detection', 'trx_validation',
      'duplicate_detection', 'billing_management', 'invoice_generation',
      'refund_processing', 'payment_analytics', 'revenue_tracking',
      'subscription_management', 'payment_reconciliation', 'compliance_reporting',
    ],
    specializations: ['bkash', 'fraud_detection', 'billing', 'compliance'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['approve_payment', 'reject_payment', 'process_refund'],
    cooldownMs: 2000,
    maxConcurrentTasks: 10,
    icon: 'CreditCard',
    color: 'from-pink-500 to-rose-500',
  },
  supervisor: {
    id: 'supervisor',
    name: 'AI Supervisor Agent',
    description: 'Master orchestrator that coordinates all sub-agents, resolves conflicts, and ensures system coherence.',
    capabilities: [
      'task_delegation', 'conflict_resolution', 'priority_management',
      'workflow_orchestration', 'agent_coordination', 'resource_allocation',
      'decision_making', 'escalation_handling', 'system_wide_optimization',
      'cross_agent_communication', 'task_dependency_management', 'global_policy_enforcement',
    ],
    specializations: ['orchestration', 'coordination', 'decision_making', 'policy'],
    riskLevel: 'critical',
    canAutoExecute: true,
    requiresApproval: ['critical_operation', 'system_wide_change', 'emergency_action'],
    cooldownMs: 1000,
    maxConcurrentTasks: 20,
    icon: 'Brain',
    color: 'from-violet-500 to-purple-600',
  },
};

// ============ AGENT MESSAGE TYPES ============

export interface AgentMessage {
  id: string;
  fromAgent: AgentId;
  toAgent: AgentId | 'broadcast';
  type: 'task_request' | 'task_result' | 'alert' | 'query' | 'command' | 'status_update' | 'collaboration_request';
  payload: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  requiresResponse: boolean;
  correlationId?: string;
}

export interface AgentTaskRequest {
  id: string;
  requestingAgent: AgentId;
  targetAgent: AgentId;
  action: string;
  input: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  deadline?: Date;
  retryCount: number;
  maxRetries: number;
  fallbackAgent?: AgentId;
  fallbackAction?: string;
}

export interface AgentTaskResult {
  taskId: string;
  agentId: AgentId;
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
  sideEffects?: string[];
  followUpActions?: AgentTaskRequest[];
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
  alternatives: string[];
  timestamp: Date;
  approved: boolean;
  approvedBy?: string;
}

export interface AgentTimelineEntry {
  timestamp: Date;
  agentId: AgentId;
  action: string;
  status: 'started' | 'completed' | 'failed' | 'waiting';
  details?: string;
}

// ============ ORCHESTRATION TYPES ============

export interface OrchestrationPlan {
  id: string;
  originalRequest: string;
  steps: OrchestrationStep[];
  dependencies: Record<string, string[]>;  // stepId -> depends on stepIds
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiredAgents: AgentId[];
  approvalRequired: boolean;
  rollbackPlan: OrchestrationStep[];
  createdAt: Date;
}

export interface OrchestrationStep {
  id: string;
  order: number;
  agentId: AgentId;
  action: string;
  input: Record<string, any>;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  timeout: number;
  retryCount: number;
  maxRetries: number;
  fallback?: {
    agentId: AgentId;
    action: string;
    input: Record<string, any>;
  };
  condition?: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains';
    value: any;
  };
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// ============ MEMORY TYPES ============

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
  embedding?: number[];
  relevance: number;
  accessCount: number;
  createdAt: Date;
  lastAccessed: Date;
  expiresAt?: Date;
  tags: string[];
  source: AgentId;
  connections: string[];  // IDs of related memories
}

export interface MemoryQuery {
  types?: MemoryType[];
  category?: string;
  key?: string;
  tags?: string[];
  minRelevance?: number;
  limit?: number;
  timeRange?: { from: Date; to: Date };
  semanticQuery?: string;
}

// ============ SECURITY TYPES ============

export interface SecurityEvent {
  id: string;
  type: 'intrusion_attempt' | 'malware_detected' | 'anomaly_detected' | 'vulnerability_found' 
       | 'brute_force' | 'ddos' | 'suspicious_activity' | 'policy_violation' | 'data_breach_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: AgentId;
  resolution?: string;
  autoRemediated: boolean;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  rules: SecurityRule[];
  isActive: boolean;
  priority: number;
}

export interface SecurityRule {
  id: string;
  type: 'allow' | 'deny' | 'rate_limit' | 'alert' | 'block';
  pattern: string;
  resource: string;
  threshold?: number;
  window?: number;  // time window in seconds
  action: string;
}

// ============ INFRASTRUCTURE TYPES ============

export interface ContainerSpec {
  name: string;
  image: string;
  ports: number[];
  env: Record<string, string>;
  volumes: Record<string, string>;
  cpuLimit?: string;
  memoryLimit?: string;
  replicas?: number;
  healthCheck?: { path: string; interval: number; timeout: number };
}

export interface ClusterNode {
  id: string;
  name: string;
  ip: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  cpu: number;
  ram: number;
  disk: number;
  containers: number;
  region: string;
  labels: Record<string, string>;
}

// ============ LEARNING TYPES ============

export interface LearningRecord {
  id: string;
  agentId: AgentId;
  type: 'success_pattern' | 'failure_pattern' | 'optimization_result' | 'performance_metric' | 'user_feedback';
  context: Record<string, any>;
  outcome: Record<string, any>;
  score: number;  // -1.0 to 1.0
  timestamp: Date;
  appliedInProduction: boolean;
}

export interface Prediction {
  id: string;
  agentId: AgentId;
  type: 'failure' | 'performance_degradation' | 'resource_exhaustion' | 'security_threat' | 'cost_anomaly';
  confidence: number;
  timeframe: string;
  details: Record<string, any>;
  preventativeActions: string[];
  createdAt: Date;
}

// ============ ENTERPRISE TYPES ============

export interface Tenant {
  id: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise';
  resources: { cpu: number; ram: number; storage: number; bandwidth: number };
  usage: { cpu: number; ram: number; storage: number; bandwidth: number };
  sla: { uptime: number; responseTime: number; supportLevel: string };
}

export interface AuditLog {
  id: string;
  userId: string;
  agentId: AgentId;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

// ============ CHAIN OF THOUGHT ============

export interface ThoughtStep {
  step: number;
  type: 'observation' | 'reasoning' | 'planning' | 'decision' | 'validation' | 'reflection';
  content: string;
  confidence: number;
  agentId: AgentId;
  timestamp: Date;
  dependencies?: number[];  // step numbers this depends on
}

export interface ReasoningChain {
  id: string;
  sessionId: string;
  originalQuery: string;
  thoughts: ThoughtStep[];
  conclusion: string;
  totalConfidence: number;
  agentsInvolved: AgentId[];
  duration: number;
  createdAt: Date;
}

// ============ HELPER FUNCTIONS ============

export function getAgentForIntent(intent: string): AgentId {
  const intentAgentMap: Record<string, AgentId> = {
    'domain_check': 'dns_domain',
    'domain_register': 'dns_domain',
    'domain_manage': 'dns_domain',
    'hosting_deploy': 'deployment',
    'hosting_manage': 'devops',
    'hosting_configure': 'devops',
    'ssl_install': 'security',
    'ssl_manage': 'security',
    'dns_configure': 'dns_domain',
    'dns_manage': 'dns_domain',
    'database_create': 'database',
    'database_manage': 'database',
    'storage_upload': 'infrastructure',
    'storage_manage': 'infrastructure',
    'shell_execute': 'devops',
    'monitoring_check': 'monitoring',
    'monitoring_setup': 'monitoring',
    'payment_check': 'payment',
    'payment_verify': 'payment',
    'optimization': 'optimization',
    'troubleshoot': 'debugging',
    'security_scan': 'security',
    'scaling': 'scaling',
    'recovery': 'recovery',
    'general_help': 'supervisor',
    'greeting': 'supervisor',
  };
  return intentAgentMap[intent] || 'supervisor';
}

export function getAgentsForComplexTask(taskType: string): AgentId[] {
  const complexTaskMap: Record<string, AgentId[]> = {
    'full_deployment': ['deployment', 'devops', 'dns_domain', 'security', 'monitoring'],
    'production_migration': ['devops', 'database', 'deployment', 'recovery', 'monitoring'],
    'security_incident': ['security', 'infrastructure', 'recovery', 'monitoring', 'supervisor'],
    'performance_crisis': ['optimization', 'debugging', 'monitoring', 'scaling', 'infrastructure'],
    'infrastructure_setup': ['infrastructure', 'devops', 'security', 'monitoring', 'scaling'],
    'domain_full_setup': ['dns_domain', 'deployment', 'security', 'monitoring'],
    'disaster_recovery': ['recovery', 'infrastructure', 'database', 'devops', 'security', 'supervisor'],
  };
  return complexTaskMap[taskType] || ['supervisor'];
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

