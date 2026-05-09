// ============ MULTI-AGENT TYPES & DEFINITIONS ============
// FahadCloud Advanced Autonomous Multi-Agent Cloud Intelligence System v2.0
// 14 Specialized AI Agents with Auto Learning

export type AgentId = 
  | 'devops' | 'security' | 'deployment' | 'monitoring' 
  | 'debugging' | 'infrastructure' | 'database' | 'optimization'
  | 'recovery' | 'scaling' | 'dns_domain' | 'payment' | 'supervisor'
  | 'auto_learning';

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
  intelligenceLevel: number; // 1-10
  learningEnabled: boolean;
}

export const AGENT_DEFINITIONS: Record<AgentId, AgentDefinition> = {
  devops: {
    id: 'devops',
    name: 'DevOps Agent',
    description: 'Manages CI/CD pipelines, build processes, deployment workflows, and DevOps automation with intelligent rollback capabilities.',
    capabilities: [
      'ci_cd_pipeline_management', 'build_optimization', 'deployment_automation',
      'environment_configuration', 'release_management', 'rollback_execution',
      'artifact_management', 'dependency_management', 'container_orchestration',
      'multi_environment_deploy', 'blue_green_deployment', 'canary_release',
    ],
    specializations: ['react', 'nextjs', 'vue', 'nodejs', 'python', 'php', 'laravel', 'wordpress', 'docker', 'kubernetes'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['production_deploy', 'database_migration', 'config_change'],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'Rocket',
    color: 'from-orange-500 to-red-500',
    version: '2.0',
    intelligenceLevel: 9,
    learningEnabled: true,
  },
  security: {
    id: 'security',
    name: 'Security Agent',
    description: 'Autonomous security monitoring, threat detection, intrusion prevention, vulnerability scanning, and compliance enforcement.',
    capabilities: [
      'threat_detection', 'intrusion_prevention', 'vulnerability_scanning',
      'malware_scanning', 'firewall_optimization', 'ssl_management',
      'access_control', 'audit_logging', 'behavioral_anomaly_detection',
      'exploit_prevention', 'secret_rotation', 'compliance_checking',
      'zero_day_detection', 'rate_limit_enforcement', 'ip_reputation_check',
    ],
    specializations: ['network_security', 'application_security', 'infrastructure_security', 'compliance', 'owasp'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['block_ip', 'disable_service', 'quarantine_resource'],
    cooldownMs: 2000,
    maxConcurrentTasks: 10,
    icon: 'Shield',
    color: 'from-red-500 to-red-700',
    version: '2.0',
    intelligenceLevel: 10,
    learningEnabled: true,
  },
  deployment: {
    id: 'deployment',
    name: 'Deployment Agent',
    description: 'Handles one-click deployments, framework detection, build optimization, and deployment verification with zero-downtime guarantees.',
    capabilities: [
      'framework_detection', 'build_execution', 'deployment_verification',
      'rollback_management', 'blue_green_deploy', 'canary_deploy',
      'static_site_deploy', 'container_deploy', 'ssl_provisioning',
      'github_sync', 'environment_setup', 'dependency_installation',
      'auto_scaling_config', 'health_check_verification',
    ],
    specializations: ['react', 'nextjs', 'nuxt', 'vue', 'nodejs', 'python', 'php', 'docker', 'static'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['production_deploy', 'database_migration'],
    cooldownMs: 3000,
    maxConcurrentTasks: 8,
    icon: 'Rocket',
    color: 'from-orange-500 to-amber-500',
    version: '2.0',
    intelligenceLevel: 9,
    learningEnabled: true,
  },
  monitoring: {
    id: 'monitoring',
    name: 'Monitoring Agent',
    description: '24/7 real-time monitoring with intelligent alerting, anomaly detection, predictive scaling, and comprehensive health scoring.',
    capabilities: [
      'system_metrics_collection', 'application_health_monitoring', 'alert_management',
      'anomaly_detection', 'performance_profiling', 'resource_tracking',
      'log_aggregation', 'uptime_monitoring', 'capacity_planning',
      'predictive_scaling', 'custom_dashboards', 'incident_correlation',
    ],
    specializations: ['cpu_monitoring', 'memory_monitoring', 'disk_monitoring', 'network_monitoring', 'application_monitoring'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: [],
    cooldownMs: 1000,
    maxConcurrentTasks: 20,
    icon: 'Monitor',
    color: 'from-yellow-500 to-orange-500',
    version: '2.0',
    intelligenceLevel: 8,
    learningEnabled: true,
  },
  debugging: {
    id: 'debugging',
    name: 'Debugging Agent',
    description: 'Intelligent error analysis, root cause identification, automated debugging, and fix suggestion with context-aware reasoning.',
    capabilities: [
      'error_analysis', 'root_cause_identification', 'log_analysis',
      'stack_trace_analysis', 'performance_debugging', 'memory_leak_detection',
      'automated_fix_suggestion', 'regression_testing', 'test_generation',
      'code_review', 'dependency_conflict_resolution',
    ],
    specializations: ['javascript', 'typescript', 'python', 'php', 'nodejs', 'database_errors', 'network_errors'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: ['apply_fix', 'code_change'],
    cooldownMs: 3000,
    maxConcurrentTasks: 8,
    icon: 'AlertTriangle',
    color: 'from-amber-500 to-yellow-500',
    version: '2.0',
    intelligenceLevel: 9,
    learningEnabled: true,
  },
  infrastructure: {
    id: 'infrastructure',
    name: 'Infrastructure Agent',
    description: 'Docker/K8s orchestration, server provisioning, cluster management, and infrastructure-as-code generation.',
    capabilities: [
      'docker_management', 'kubernetes_orchestration', 'server_provisioning',
      'cluster_management', 'network_configuration', 'iac_generation',
      'container_scaling', 'resource_optimization', 'volume_management',
      'load_balancing', 'cdn_configuration', 'environment_replication',
    ],
    specializations: ['docker', 'kubernetes', 'aws', 'nginx', 'networking', 'storage'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['server_restart', 'container_recreate', 'network_change'],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'Server',
    color: 'from-gray-500 to-gray-700',
    version: '2.0',
    intelligenceLevel: 9,
    learningEnabled: true,
  },
  database: {
    id: 'database',
    name: 'Database Agent',
    description: 'Intelligent database creation, migration, backup, query optimization, and performance tuning across all database types.',
    capabilities: [
      'database_creation', 'schema_migration', 'backup_management',
      'query_optimization', 'index_management', 'replication_setup',
      'connection_pooling', 'data_integrity_check', 'performance_tuning',
      'migration_planning', ' disaster_recovery', 'multi_db_support',
    ],
    specializations: ['mysql', 'postgresql', 'sqlite', 'mongodb', 'redis'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['drop_database', 'schema_migration', 'data_deletion'],
    cooldownMs: 5000,
    maxConcurrentTasks: 3,
    icon: 'Database',
    color: 'from-cyan-500 to-blue-500',
    version: '2.0',
    intelligenceLevel: 9,
    learningEnabled: true,
  },
  optimization: {
    id: 'optimization',
    name: 'Optimization Agent',
    description: 'Performance profiling, resource right-sizing, cost optimization, and intelligent auto-scaling with predictive analysis.',
    capabilities: [
      'performance_profiling', 'resource_rightsizing', 'cost_optimization',
      'auto_scaling_recommendations', 'caching_optimization', 'cdn_optimization',
      'code_splitting', 'image_optimization', 'bundle_analysis',
      'database_query_optimization', 'load_time_optimization', 'green_computing',
    ],
    specializations: ['frontend_performance', 'backend_performance', 'database_optimization', 'cost_optimization'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['apply_optimization', 'scale_resources'],
    cooldownMs: 10000,
    maxConcurrentTasks: 5,
    icon: 'TrendingUp',
    color: 'from-pink-500 to-rose-500',
    version: '2.0',
    intelligenceLevel: 8,
    learningEnabled: true,
  },
  recovery: {
    id: 'recovery',
    name: 'Recovery Agent',
    description: 'Automated backup management, point-in-time recovery, disaster recovery orchestration, and data integrity verification.',
    capabilities: [
      'automated_backup', 'point_in_time_recovery', 'disaster_recovery',
      'data_integrity_verification', 'backup_scheduling', 'restore_testing',
      'cross_region_replication', 'incremental_backup', 'snapshot_management',
      'recovery_orchestration', 'backup_compliance',
    ],
    specializations: ['full_backup', 'incremental_backup', 'snapshot', 'disaster_recovery'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['restore_database', 'delete_backup'],
    cooldownMs: 10000,
    maxConcurrentTasks: 3,
    icon: 'RotateCcw',
    color: 'from-teal-500 to-cyan-500',
    version: '2.0',
    intelligenceLevel: 9,
    learningEnabled: true,
  },
  scaling: {
    id: 'scaling',
    name: 'Scaling Agent',
    description: 'Auto-scaling management, load distribution, capacity planning, and intelligent resource provisioning based on demand patterns.',
    capabilities: [
      'horizontal_scaling', 'vertical_scaling', 'auto_scaling_configuration',
      'load_distribution', 'capacity_planning', 'demand_prediction',
      'resource_provisioning', 'cluster_expansion', 'traffic_management',
      'cost_efficient_scaling', 'multi_region_scaling',
    ],
    specializations: ['horizontal_scaling', 'vertical_scaling', 'auto_scaling', 'multi_region'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['scale_up', 'scale_down', 'region_expansion'],
    cooldownMs: 15000,
    maxConcurrentTasks: 3,
    icon: 'Zap',
    color: 'from-yellow-400 to-amber-500',
    version: '2.0',
    intelligenceLevel: 8,
    learningEnabled: true,
  },
  dns_domain: {
    id: 'dns_domain',
    name: 'DNS Agent',
    description: 'Automatic DNS configuration, zone management, record optimization, and propagation verification across all domains.',
    capabilities: [
      'dns_zone_management', 'record_management', 'propagation_verification',
      'dns_optimization', 'domain_registration', 'nameserver_configuration',
      'dns_security', 'dns_monitoring', 'record_migration',
      'bulk_dns_operations', 'dns_troubleshooting',
    ],
    specializations: ['a_record', 'cname', 'mx_record', 'txt_record', 'srv_record', 'ns_record'],
    riskLevel: 'medium',
    canAutoExecute: true,
    requiresApproval: ['delete_zone', 'change_nameservers'],
    cooldownMs: 5000,
    maxConcurrentTasks: 10,
    icon: 'Globe',
    color: 'from-sky-500 to-blue-500',
    version: '2.0',
    intelligenceLevel: 8,
    learningEnabled: true,
  },
  payment: {
    id: 'payment',
    name: 'Payment Agent',
    description: 'Payment processing, bKash integration, transaction verification, invoicing, and financial reporting.',
    capabilities: [
      'payment_processing', 'transaction_verification', 'invoice_generation',
      'refund_management', 'financial_reporting', 'fraud_detection',
      'subscription_management', 'payment_reminder', 'revenue_analytics',
    ],
    specializations: ['bkash', 'nagad', 'rocket', 'card_payment', 'bank_transfer'],
    riskLevel: 'high',
    canAutoExecute: true,
    requiresApproval: ['refund', 'cancel_subscription', 'waive_fee'],
    cooldownMs: 5000,
    maxConcurrentTasks: 5,
    icon: 'CreditCard',
    color: 'from-green-500 to-emerald-500',
    version: '2.0',
    intelligenceLevel: 8,
    learningEnabled: true,
  },
  supervisor: {
    id: 'supervisor',
    name: 'Orchestrator Agent',
    description: 'Master coordination engine that delegates tasks to specialized agents, manages workflows, and ensures optimal resource allocation.',
    capabilities: [
      'task_delegation', 'workflow_orchestration', 'agent_coordination',
      'conflict_resolution', 'priority_management', 'resource_allocation',
      'progress_tracking', 'decision_making', 'escalation_handling',
      'quality_assurance', 'performance_optimization', 'agent_training',
    ],
    specializations: ['orchestration', 'coordination', 'planning', 'decision_making'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: ['emergency_shutdown', 'agent_override'],
    cooldownMs: 1000,
    maxConcurrentTasks: 50,
    icon: 'Cpu',
    color: 'from-purple-500 to-indigo-500',
    version: '2.0',
    intelligenceLevel: 10,
    learningEnabled: true,
  },
  auto_learning: {
    id: 'auto_learning',
    name: 'Auto Learning Agent',
    description: 'Continuously trains and improves all FahadCloud AI agents using project data, user interactions, system metrics, and cross-domain insights. Unlimited, scalable, autonomous learning engine.',
    capabilities: [
      'continuous_training', 'cross_agent_learning', 'pattern_recognition',
      'auto_optimization', 'knowledge_graph_construction', 'predictive_modeling',
      'data_aggregation', 'insight_extraction', 'model_fine_tuning',
      'feedback_loop_integration', 'adaptive_behavior', 'skill_transfer',
      'performance_tracking', 'self_improvement', 'knowledge_synthesis',
    ],
    specializations: ['machine_learning', 'deep_learning', 'reinforcement_learning', 'nlp', 'knowledge_graphs', 'transfer_learning'],
    riskLevel: 'low',
    canAutoExecute: true,
    requiresApproval: ['reset_models', 'delete_training_data'],
    cooldownMs: 500,
    maxConcurrentTasks: 100,
    icon: 'GraduationCap',
    color: 'from-violet-600 to-fuchsia-500',
    version: '1.0',
    intelligenceLevel: 10,
    learningEnabled: true,
  },
};

// ============ HELPER FUNCTIONS ============

export function getAgentForIntent(intent: string): AgentId {
  const intentMap: Record<string, AgentId> = {
    domain_check: 'dns_domain', domain_register: 'dns_domain', domain_manage: 'dns_domain',
    hosting_deploy: 'deployment', hosting_manage: 'infrastructure', hosting_configure: 'devops',
    ssl_install: 'security', ssl_manage: 'security',
    dns_configure: 'dns_domain', dns_manage: 'dns_domain',
    database_create: 'database', database_manage: 'database',
    storage_upload: 'infrastructure', storage_manage: 'infrastructure',
    shell_execute: 'debugging',
    monitoring_check: 'monitoring', monitoring_setup: 'monitoring',
    payment_check: 'payment', payment_verify: 'payment',
    optimization: 'optimization',
    troubleshoot: 'debugging',
    general_help: 'supervisor',
    greeting: 'supervisor',
    unknown: 'supervisor',
  };
  return intentMap[intent] || 'supervisor';
}

export function getAgentsForComplexTask(intent: string): AgentId[] {
  const complexTaskMap: Record<string, AgentId[]> = {
    domain_register: ['dns_domain', 'security', 'payment'],
    hosting_deploy: ['deployment', 'devops', 'infrastructure', 'security', 'monitoring'],
    ssl_install: ['security', 'infrastructure', 'dns_domain'],
    database_create: ['database', 'recovery', 'monitoring'],
    troubleshoot: ['debugging', 'monitoring', 'security'],
    optimization: ['optimization', 'monitoring', 'infrastructure'],
  };
  return complexTaskMap[intent] || [getAgentForIntent(intent)];
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============ COMPLEX TYPES ============

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

export interface AgentMessage {
  id: string;
  fromAgent: AgentId;
  toAgent: AgentId | 'all';
  type: 'task' | 'result' | 'query' | 'alert' | 'command';
  content: string;
  payload?: Record<string, any>;
  timestamp: Date;
}

export interface AgentTaskRequest {
  id: string;
  agentId: AgentId;
  sessionId: string;
  userId: string;
  type: string;
  description: string;
  input: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
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

export interface OrchestrationStep {
  id: string;
  order: number;
  agentId: AgentId;
  action: string;
  description: string;
  input: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  result?: AgentTaskResult;
}

export interface OrchestrationPlan {
  id: string;
  sessionId: string;
  userId: string;
  intent: string;
  steps: OrchestrationStep[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  approvalRequired: boolean;
  status: 'planning' | 'pending_approval' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
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
  type: string;
  decision: string;
  reasoning: string;
  confidence: number;
  timestamp: Date;
}

export interface AgentTimelineEntry {
  id: string;
  agentId: AgentId;
  event: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface ThoughtStep {
  step: number;
  type: 'observation' | 'analysis' | 'planning' | 'execution' | 'reflection';
  content: string;
  confidence: number;
  agentId?: AgentId;
}

export interface ReasoningChain {
  id: string;
  sessionId: string;
  thoughts: ThoughtStep[];
  conclusion: string;
  confidence: number;
  createdAt: Date;
}

export interface SecurityEvent {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  source: string;
  description: string;
  timestamp: Date;
  handled: boolean;
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
  type: 'allow' | 'deny' | 'rate_limit';
  pattern: string;
  resource: string;
  action: string;
  ttl?: number;
}

export interface ContainerSpec {
  name: string;
  image: string;
  ports: number[];
  env: Record<string, string>;
  volumes: Record<string, string>;
}

export interface ClusterNode {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  cpu: number;
  memory: number;
  containers: number;
}
