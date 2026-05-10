
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Migrate users from SQLite
  const sqlite3 = require('better-sqlite3');
  let sqliteDb;
  try {
    sqliteDb = new sqlite3('/home/fahad/fahadcloud/db/fahadcloud.db');
    const users = sqliteDb.prepare('SELECT * FROM User').all();
    for (const u of users) {
      try {
        await prisma.user.upsert({
          where: { id: u.id },
          update: {},
          create: {
            id: u.id,
            email: u.email,
            password: u.password,
            firstName: u.firstName,
            lastName: u.lastName,
            company: u.company,
            phone: u.phone,
            address: u.address,
            city: u.city,
            country: u.country,
            avatar: u.avatar,
            role: u.role,
            adminRole: u.adminRole,
            balance: u.balance,
            storageLimit: u.storageLimit,
            storageUsed: u.storageUsed,
            twoFactorEnabled: !!u.twoFactorEnabled,
            emailVerified: !!u.emailVerified,
          },
        });
        console.log('Migrated user:', u.email);
      } catch (e) { console.error('User error:', u.email, e.message); }
    }
    sqliteDb.close();
  } catch (e) { console.log('No SQLite data to migrate:', e.message); }

  // Seed Agent Registry
  const agents = [
    { agentId: 'coding', name: 'Coding Agent', type: 'coding', description: 'Writes, reviews, and refactors code with best practices', capabilities: '["code_write","code_review","refactor","debug_code"]' },
    { agentId: 'security', name: 'Security Agent', type: 'security', description: 'Detects vulnerabilities and security issues', capabilities: '["vulnerability_scan","security_audit","penetration_test"]' },
    { agentId: 'debug', name: 'Debug Agent', type: 'debug', description: 'Finds and fixes bugs in code', capabilities: '["error_analysis","stack_trace","root_cause"]' },
    { agentId: 'ui', name: 'UI Agent', type: 'ui', description: 'Designs and implements user interfaces', capabilities: '["ui_design","component_create","accessibility"]' },
    { agentId: 'devops', name: 'DevOps Agent', type: 'devops', description: 'Manages deployments and infrastructure', capabilities: '["deploy","ci_cd","docker","kubernetes"]' },
    { agentId: 'research', name: 'Research Agent', type: 'research', description: 'Researches topics and gathers information', capabilities: '["web_search","doc_analysis","data_synthesis"]' },
    { agentId: 'self_improvement', name: 'Self-Improvement Agent', type: 'self_improvement', description: 'Learns and improves agent capabilities', capabilities: '["learn","optimize","self_analyze"]' },
    { agentId: 'bug_detector', name: 'Bug Detector', type: 'bug_detector', description: 'Continuously scans for bugs and issues', capabilities: '["code_scan","api_test","dead_code_detect"]' },
    { agentId: 'auto_fix', name: 'Auto Fix Engine', type: 'auto_fix', description: 'Automatically patches detected issues', capabilities: '["patch_generate","test_run","rollback"]' },
    { agentId: 'master_controller', name: 'Master Controller', type: 'master_controller', description: 'Central orchestrator for all agents', capabilities: '["task_distribute","monitor","retry","coordinate"]' },
    { agentId: 'learning', name: 'Learning Agent', type: 'learning', description: 'Learns new topics and builds knowledge', capabilities: '["web_research","doc_analyze","knowledge_store"]' },
    { agentId: 'memory', name: 'Memory Agent', type: 'memory', description: 'Manages AI memory and semantic search', capabilities: '["store","recall","semantic_search","embed"]' },
  ];

  for (const agent of agents) {
    try {
      await prisma.agentRegistry.upsert({
        where: { agentId: agent.agentId },
        update: {},
        create: agent,
      });
      console.log('Registered agent:', agent.name);
    } catch (e) { console.error('Agent error:', agent.name, e.message); }
  }

  // Verify
  const userCount = await prisma.user.count();
  const agentCount = await prisma.agentRegistry.count();
  console.log('Total users:', userCount);
  console.log('Total agents:', agentCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
