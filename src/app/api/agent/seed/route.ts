// ============ SEED ALL AGENTS INTO DATABASE ============
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const agents = [
      { agentId: 'devops', name: 'DevOps Agent', type: 'devops', description: 'CI/CD pipelines, build automation, deployment orchestration', capabilities: ['ci_cd', 'docker', 'kubernetes', 'automation'] },
      { agentId: 'security', name: 'Security Agent', type: 'security', description: 'Threat detection, vulnerability scanning, firewall management', capabilities: ['threat_detection', 'vulnerability_scan', 'waf', 'ddos_protection'] },
      { agentId: 'deployment', name: 'Deployment Agent', type: 'deployment', description: 'Framework detection, build execution, SSL installation', capabilities: ['framework_detect', 'build', 'ssl_install', 'cdn_config'] },
      { agentId: 'monitoring', name: 'Monitoring Agent', type: 'monitoring', description: 'CPU/RAM/disk metrics, health checks, alerting', capabilities: ['metrics', 'health_check', 'alerting', 'uptime'] },
      { agentId: 'debugging', name: 'Debug Agent', type: 'debug', description: 'Error analysis, log correlation, root cause identification', capabilities: ['error_analysis', 'log_correlation', 'root_cause', 'diagnostics'] },
      { agentId: 'infrastructure', name: 'Infrastructure Agent', type: 'infrastructure', description: 'Docker/K8s orchestration, server management, IaC', capabilities: ['docker', 'kubernetes', 'server_mgmt', 'terraform'] },
      { agentId: 'database', name: 'Database Agent', type: 'database', description: 'Query optimization, backup management, migration', capabilities: ['query_optimize', 'backup', 'migration', 'pooling'] },
      { agentId: 'optimization', name: 'Optimization Agent', type: 'optimization', description: 'Performance tuning, caching, resource optimization', capabilities: ['performance', 'caching', 'resource_opt', 'profiling'] },
      { agentId: 'recovery', name: 'Recovery Agent', type: 'recovery', description: 'Disaster recovery, backup restoration, failover', capabilities: ['disaster_recovery', 'backup_restore', 'failover', 'data_integrity'] },
      { agentId: 'scaling', name: 'Scaling Agent', type: 'scaling', description: 'Auto-scaling, load balancing, capacity planning', capabilities: ['auto_scale', 'load_balance', 'capacity_plan', 'resource_alloc'] },
      { agentId: 'dns_domain', name: 'DNS Agent', type: 'dns_domain', description: 'DNS record management, nameserver configuration', capabilities: ['dns_records', 'nameservers', 'propagation', 'email_dns'] },
      { agentId: 'payment', name: 'Payment Agent', type: 'payment', description: 'bKash processing, order management, billing', capabilities: ['bkash', 'orders', 'billing', 'invoices'] },
      { agentId: 'supervisor', name: 'Master Controller', type: 'supervisor', description: 'Central coordinator for all agent workflows', capabilities: ['orchestration', 'coordination', 'task_routing', 'workflow'] },
      { agentId: 'auto_learning', name: 'Auto-Learning Agent', type: 'auto_learning', description: 'Knowledge acquisition, research, pattern recognition', capabilities: ['research', 'knowledge_build', 'pattern_recognition', 'auto_improve'] },
      { agentId: 'ui_design', name: 'UI Agent', type: 'ui', description: 'UI/UX optimization, accessibility, responsive design', capabilities: ['ui_design', 'accessibility', 'responsive', 'design_system'] },
      { agentId: 'research', name: 'Research Agent', type: 'research', description: 'Web research, documentation analysis, information gathering', capabilities: ['web_research', 'doc_analysis', 'info_gathering', 'citations'] },
      { agentId: 'self_improvement', name: 'Self-Improvement Agent', type: 'self_improvement', description: 'Learning from interactions, capability enhancement', capabilities: ['self_analyze', 'capability_enhance', 'quality_improve', 'adaptive'] },
      { agentId: 'bug_detector', name: 'Bug Detector', type: 'bug_detector', description: 'Continuous scanning, anomaly detection, error tracking', capabilities: ['continuous_scan', 'anomaly_detect', 'error_track', 'vulnerability'] },
      { agentId: 'bug_fixer', name: 'Auto-Fix Engine', type: 'auto_fix', description: 'Automated bug patching, code correction, testing', capabilities: ['auto_patch', 'code_fix', 'testing', 'rollback'] },
      { agentId: 'chat', name: 'Chat Agent', type: 'chat', description: 'Natural language processing, conversation management', capabilities: ['nlp', 'conversation', 'intent_classify', 'context_track'] },
      { agentId: 'devops_advanced', name: 'Advanced DevOps Agent', type: 'devops', description: 'Advanced infrastructure, multi-cloud, GitOps', capabilities: ['multi_cloud', 'gitops', 'helm', 'observability'] },
      { agentId: 'learning', name: 'Learning Agent', type: 'learning', description: 'Topic research, knowledge base building, insights', capabilities: ['topic_research', 'knowledge_build', 'insight_gen', 'depth_analysis'] },
    ];

    let created = 0;
    let updated = 0;

    for (const agent of agents) {
      const existing = await db.agentRegistry.findFirst({ where: { agentId: agent.agentId } });
      if (existing) {
        await db.agentRegistry.update({
          where: { id: existing.id },
          data: {
            name: agent.name,
            type: agent.type,
            description: agent.description,
            capabilities: JSON.stringify(agent.capabilities),
            status: 'idle',
          },
        });
        updated++;
      } else {
        await db.agentRegistry.create({
          data: {
            agentId: agent.agentId,
            name: agent.name,
            type: agent.type,
            description: agent.description,
            capabilities: JSON.stringify(agent.capabilities),
            status: 'idle',
          },
        });
        created++;
      }
    }

    return NextResponse.json({ 
      message: `Agents seeded: ${created} created, ${updated} updated`, 
      total: agents.length,
      agents: agents.map(a => a.agentId),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
