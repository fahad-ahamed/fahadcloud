
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function registerAgents() {
  const agents = [
    { agentId: 'devops', name: 'DevOps Agent', type: 'devops', description: 'CI/CD, deployments, environment management', capabilities: JSON.stringify(['ci_cd', 'deploy', 'build', 'rollback', 'container']), status: 'idle' },
    { agentId: 'security', name: 'Security Agent', type: 'security', description: 'Threat detection, vulnerability scanning, firewall', capabilities: JSON.stringify(['threat_detection', 'vuln_scan', 'firewall', 'ssl', 'audit']), status: 'idle' },
    { agentId: 'deployment', name: 'Deployment Agent', type: 'deployment', description: 'Framework detection, build, deploy, SSL', capabilities: JSON.stringify(['framework_detect', 'build', 'deploy', 'ssl', 'verify']), status: 'idle' },
    { agentId: 'monitoring', name: 'Monitoring Agent', type: 'monitoring', description: 'System metrics, health checks, alerting', capabilities: JSON.stringify(['cpu', 'ram', 'disk', 'network', 'health', 'alerts']), status: 'idle' },
    { agentId: 'debugging', name: 'Debug Agent', type: 'debugging', description: 'Error analysis, log correlation, root cause', capabilities: JSON.stringify(['error_analysis', 'logs', 'root_cause', 'stack_trace']), status: 'idle' },
    { agentId: 'infrastructure', name: 'Infrastructure Agent', type: 'infrastructure', description: 'Docker, K8s, networking, storage', capabilities: JSON.stringify(['docker', 'k8s', 'network', 'storage', 'proxy']), status: 'idle' },
    { agentId: 'database', name: 'Database Agent', type: 'database', description: 'DB management, migrations, backups, optimization', capabilities: JSON.stringify(['create_db', 'migrate', 'backup', 'optimize', 'query']), status: 'idle' },
    { agentId: 'optimization', name: 'Optimization Agent', type: 'optimization', description: 'Performance, caching, resource optimization', capabilities: JSON.stringify(['performance', 'caching', 'bundle', 'cdn', 'lazy_load']), status: 'idle' },
    { agentId: 'recovery', name: 'Recovery Agent', type: 'recovery', description: 'Disaster recovery, backup restore, failover', capabilities: JSON.stringify(['disaster_recovery', 'restore', 'failover', 'healing']), status: 'idle' },
    { agentId: 'scaling', name: 'Scaling Agent', type: 'scaling', description: 'Auto-scaling, load balancing, capacity planning', capabilities: JSON.stringify(['auto_scale', 'load_balance', 'capacity', 'provision']), status: 'idle' },
    { agentId: 'dns_domain', name: 'DNS Agent', type: 'dns_domain', description: 'DNS configuration, zone management, propagation', capabilities: JSON.stringify(['dns_config', 'zone', 'records', 'propagation', 'dnssec']), status: 'idle' },
    { agentId: 'payment', name: 'Payment Agent', type: 'payment', description: 'Payment processing, fraud detection, billing', capabilities: JSON.stringify(['payment', 'fraud', 'billing', 'invoice', 'refund']), status: 'idle' },
    { agentId: 'supervisor', name: 'Supervisor Agent', type: 'supervisor', description: 'Agent monitoring, escalation, reliability', capabilities: JSON.stringify(['monitor_agents', 'escalate', 'reliability', 'coordinate']), status: 'idle' },
    { agentId: 'auto_learning', name: 'Auto-Learning Agent', type: 'auto_learning', description: 'Knowledge graph, pattern recognition, web research', capabilities: JSON.stringify(['web_research', 'patterns', 'knowledge_graph', 'insights']), status: 'idle' },
    { agentId: 'coding', name: 'Coding Agent', type: 'coding', description: 'Code generation, review, refactoring', capabilities: JSON.stringify(['code_gen', 'review', 'refactor', 'debug', 'test']), status: 'idle' },
    { agentId: 'ui_design', name: 'UI Agent', type: 'ui_design', description: 'UI/UX design, component generation, accessibility', capabilities: JSON.stringify(['components', 'layout', 'responsive', 'accessibility', 'css']), status: 'idle' },
    { agentId: 'research', name: 'Research Agent', type: 'research', description: 'Web research, document analysis, knowledge synthesis', capabilities: JSON.stringify(['web_search', 'docs', 'synthesis', 'trends']), status: 'idle' },
    { agentId: 'self_improvement', name: 'Self-Improvement Agent', type: 'self_improvement', description: 'System self-analysis, optimization, upgrades', capabilities: JSON.stringify(['self_analyze', 'optimize', 'upgrade', 'refactor']), status: 'idle' },
    { agentId: 'bug_detector', name: 'Bug Detector Agent', type: 'bug_detector', description: 'Continuous bug scanning, API detection, dead code', capabilities: JSON.stringify(['scan', 'detect', 'broken_api', 'dead_code', 'security']), status: 'idle' },
    { agentId: 'bug_fixer', name: 'Auto Fix Agent', type: 'bug_fixer', description: 'Automatic bug fixing, patches, rollback', capabilities: JSON.stringify(['patch', 'fix', 'test', 'rollback', 'verify']), status: 'idle' },
    { agentId: 'chat', name: 'Chat Agent', type: 'chat', description: 'Conversational AI, routing, explanations', capabilities: JSON.stringify(['chat', 'route', 'explain', 'assist', 'nlu']), status: 'idle' },
    { agentId: 'devops_advanced', name: 'Advanced DevOps Agent', type: 'devops_advanced', description: 'Advanced CI/CD, multi-env, canary releases', capabilities: JSON.stringify(['advanced_ci', 'multi_env', 'canary', 'blue_green']), status: 'idle' },
  ];

  for (const agent of agents) {
    await prisma.agentRegistry.upsert({
      where: { agentId: agent.agentId },
      update: { name: agent.name, description: agent.description, capabilities: agent.capabilities, type: agent.type },
      create: agent,
    });
    console.log(`Registered: ${agent.name}`);
  }

  const count = await prisma.agentRegistry.count();
  console.log(`Total agents registered: ${count}`);
  await prisma.$disconnect();
}

registerAgents().catch(console.error);

