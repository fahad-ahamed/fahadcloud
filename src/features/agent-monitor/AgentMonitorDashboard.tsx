'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Monitor, RefreshCw, Activity, Bot, CheckCircle, XCircle, Clock, Loader2, Zap, TrendingUp, AlertTriangle, Shield, Server, Database, Brain, Terminal, Rocket, Globe, CreditCard, Lock, HardDrive, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

const AGENT_ICONS: Record<string, any> = {
  devops: Rocket, security: Shield, deployment: Zap, monitoring: Monitor,
  debugging: AlertTriangle, infrastructure: Server, database: Database,
  optimization: TrendingUp, recovery: RefreshCw, scaling: Cpu,
  dns_domain: Globe, payment: CreditCard, supervisor: Brain, auto_learning: Brain,
  ui_design: Monitor, research: Globe, self_improvement: TrendingUp,
  bug_fixer: AlertTriangle, chat: Terminal, devops_advanced: Rocket, bug_detector: AlertTriangle, learning: Brain,
};

const AGENT_COLORS: Record<string, string> = {
  devops: 'from-blue-500 to-cyan-500', security: 'from-red-500 to-orange-500',
  deployment: 'from-emerald-500 to-green-500', monitoring: 'from-purple-500 to-pink-500',
  debugging: 'from-amber-500 to-yellow-500', infrastructure: 'from-slate-500 to-gray-600',
  database: 'from-indigo-500 to-violet-500', optimization: 'from-teal-500 to-cyan-500',
  recovery: 'from-orange-500 to-red-500', scaling: 'from-lime-500 to-green-500',
  dns_domain: 'from-sky-500 to-blue-500', payment: 'from-yellow-500 to-amber-500',
  supervisor: 'from-fuchsia-500 to-pink-500', auto_learning: 'from-violet-500 to-purple-500',
  ui_design: 'from-pink-500 to-rose-500', research: 'from-cyan-500 to-teal-500',
  self_improvement: 'from-emerald-500 to-teal-500', bug_fixer: 'from-red-500 to-pink-500',
  chat: 'from-green-500 to-emerald-500', devops_advanced: 'from-blue-500 to-indigo-500',
  bug_detector: 'from-orange-500 to-amber-500', learning: 'from-violet-500 to-indigo-500',
};

const AGENT_DESCRIPTIONS: Record<string, string> = {
  devops: 'CI/CD pipelines, build automation, deployment orchestration',
  security: 'Threat detection, vulnerability scanning, firewall management',
  deployment: 'Framework detection, build execution, SSL installation',
  monitoring: 'CPU/RAM/disk metrics, health checks, alerting',
  debugging: 'Error analysis, log correlation, root cause identification',
  infrastructure: 'Docker/K8s orchestration, server management, IaC',
  database: 'Query optimization, backup management, migration',
  optimization: 'Performance tuning, caching, resource optimization',
  recovery: 'Disaster recovery, backup restoration, failover',
  scaling: 'Auto-scaling, load balancing, capacity planning',
  dns_domain: 'DNS record management, nameserver configuration',
  payment: 'bKash processing, order management, billing',
  supervisor: 'Central coordinator for all agent workflows',
  auto_learning: 'Knowledge acquisition, research, pattern recognition',
  ui_design: 'UI/UX optimization, accessibility, responsive design',
  research: 'Web research, documentation analysis, information gathering',
  self_improvement: 'Learning from interactions, capability enhancement',
  bug_fixer: 'Automated bug patching, code correction, testing',
  chat: 'Natural language processing, conversation management',
  devops_advanced: 'Advanced infrastructure, multi-cloud, GitOps',
  bug_detector: 'Continuous scanning, anomaly detection, error tracking',
  learning: 'Topic research, knowledge base building, insights',
};

export default function AgentMonitorDashboard() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [monitorRes, dbRes] = await Promise.all([
        fetch('/api/agent/monitor').catch(() => null),
        fetch('/api/database').catch(() => null),
      ])
      if (monitorRes?.ok) {
        const data = await monitorRes.json()
        if (data.agents && data.agents.length > 0) setAgents(data.agents)
      }
      if (dbRes?.ok) {
        const data = await dbRes.json()
        setDbStatus(data)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'idle': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Idle</Badge>
      case 'busy': return <Badge className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse">Busy</Badge>
      case 'learning': return <Badge className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">Learning</Badge>
      case 'error': return <Badge className="bg-red-50 text-red-700 border-red-200">Error</Badge>
      default: return <Badge className="bg-slate-50 text-slate-500">{status}</Badge>
    }
  }

  const totalCompleted = agents.reduce((sum, a) => sum + (a.completedTasks || 0), 0)
  const totalFailed = agents.reduce((sum, a) => sum + (a.failedTasks || 0), 0)
  const activeCount = agents.filter(a => a.status === 'busy' || a.status === 'learning').length
  const selectedAgentData = agents.find(a => (a.agentId || a.id) === selectedAgent)

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mr-3" />
      <span className="text-slate-500">Loading agent monitor...</span>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agent Monitor</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time monitoring of {agents.length} AI agents</p>
        </div>
        <Button onClick={fetchData} size="sm" variant="outline" className="gap-1.5 border-slate-200">
          <RefreshCw className="w-4 h-4" />Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><Bot className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Total Agents</p><p className="text-xl font-bold text-slate-900">{agents.length}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Activity className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-slate-500">Active</p><p className="text-xl font-bold text-slate-900">{activeCount}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-slate-500">Completed</p><p className="text-xl font-bold text-slate-900">{totalCompleted}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-xs text-slate-500">Failed</p><p className="text-xl font-bold text-slate-900">{totalFailed}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Agent Fleet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agents.map((agent) => {
                  const agentId = agent.agentId || agent.id
                  const IconComp = AGENT_ICONS[agentId] || Bot
                  const isSelected = selectedAgent === agentId
                  return (
                    <div
                      key={agentId}
                      onClick={() => setSelectedAgent(isSelected ? null : agentId)}
                      className={cn(
                        'p-3 rounded-xl border cursor-pointer transition-all',
                        isSelected ? 'border-emerald-400 ring-2 ring-emerald-100 bg-emerald-50/30' : 'border-slate-200 hover:border-emerald-300 bg-white'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', AGENT_COLORS[agentId] || 'from-emerald-500 to-teal-500')}>
                          <IconComp className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{agent.name || agentId}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={cn('w-1.5 h-1.5 rounded-full', agent.status === 'idle' ? 'bg-emerald-400' : agent.status === 'busy' ? 'bg-amber-400 animate-pulse' : 'bg-slate-300')} />
                            <span className="text-[10px] text-slate-500 capitalize">{agent.status}</span>
                          </div>
                        </div>
                        {getStatusBadge(agent.status)}
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{AGENT_DESCRIPTIONS[agentId] || agent.description || 'AI agent for cloud management'}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                        <span>Tasks: {agent.totalTasks || agent.completedTasks || 0}</span>
                        <span>Done: {agent.completedTasks || 0}</span>
                        <span>Fail: {agent.failedTasks || 0}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Detail Panel */}
        <div>
          <Card className="bg-white border-slate-200 shadow-sm sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Agent Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAgentData ? (
                <div className="space-y-4">
                  {(() => {
                    const agentId = selectedAgentData.agentId || selectedAgentData.id
                    const IconComp = AGENT_ICONS[agentId] || Bot
                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', AGENT_COLORS[agentId] || 'from-emerald-500 to-teal-500')}>
                            <IconComp className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{selectedAgentData.name || agentId}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">{getStatusBadge(selectedAgentData.status)}<span className="text-xs text-slate-400">v{selectedAgentData.version || '3.0'}</span></div>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-600">{AGENT_DESCRIPTIONS[agentId] || selectedAgentData.description || 'AI agent for cloud management'}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs"><span className="text-slate-500">Total Tasks</span><span className="font-medium">{selectedAgentData.totalTasks || selectedAgentData.completedTasks || 0}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-slate-500">Completed</span><span className="font-medium text-emerald-600">{selectedAgentData.completedTasks || 0}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-slate-500">Failed</span><span className="font-medium text-red-600">{selectedAgentData.failedTasks || 0}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-slate-500">Avg Response</span><span className="font-medium">{selectedAgentData.avgResponseTime || 0}ms</span></div>
                          <div className="flex justify-between text-xs"><span className="text-slate-500">Last Active</span><span className="font-medium">{selectedAgentData.lastActiveAt ? new Date(selectedAgentData.lastActiveAt).toLocaleString() : 'Never'}</span></div>
                        </div>
                        {selectedAgentData.capabilities && (
                          <div>
                            <p className="text-xs font-medium text-slate-700 mb-1.5">Capabilities</p>
                            <div className="flex flex-wrap gap-1">
                              {(typeof selectedAgentData.capabilities === 'string' ? JSON.parse(selectedAgentData.capabilities || '[]') : selectedAgentData.capabilities || []).map((cap: string, i: number) => (
                                <Badge key={i} className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">{cap}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Test Agent */}
                        <div className="border-t border-slate-200 pt-3 mt-3">
                          <p className="text-xs font-medium text-slate-700 mb-2">Test Agent</p>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Send a test message..."
                              className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400"
                              id="agent-test-input"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.target as HTMLInputElement;
                                  const btn = document.getElementById('agent-test-btn');
                                  if (input.value.trim() && btn) btn.click();
                                }
                              }}
                            />
                            <button
                              id="agent-test-btn"
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs rounded-lg hover:opacity-90 transition"
                              onClick={async () => {
                                const input = document.getElementById('agent-test-input') as HTMLInputElement;
                                const msg = input?.value?.trim();
                                if (!msg) return;
                                input.value = '';
                                const responseArea = document.getElementById('agent-test-response');
                                if (responseArea) responseArea.innerHTML = '<span class="text-amber-500">Processing...</span>';
                                try {
                                  const res = await fetch('/api/agent/monitor/test', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ agentId: selectedAgentData.agentId || selectedAgentData.id, message: msg }),
                                  });
                                  const data = await res.json();
                                  if (responseArea) responseArea.innerHTML = '<span class="text-slate-700">' + (data.response || data.error || 'No response') + '</span>';
                                } catch (err: any) {
                                  if (responseArea) responseArea.innerHTML = '<span class="text-red-500">Error: ' + err.message + '</span>';
                                }
                              }}
                            >
                              Send
                            </button>
                          </div>
                          <div id="agent-test-response" className="mt-2 text-xs p-2 bg-slate-50 rounded-lg min-h-[40px] max-h-[200px] overflow-y-auto">
                            <span className="text-slate-400">Agent will respond here...</span>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Select an agent to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Infrastructure */}
      {dbStatus && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              System Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">PostgreSQL</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {dbStatus.databases?.postgresql?.status === 'healthy' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-xs font-medium">{dbStatus.databases?.postgresql?.status || 'unknown'}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Redis</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {dbStatus.databases?.redis?.status === 'healthy' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-xs font-medium">{dbStatus.databases?.redis?.status || 'unknown'}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Qdrant</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {dbStatus.databases?.qdrant?.status === 'healthy' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-xs font-medium">{dbStatus.databases?.qdrant?.status || 'unknown'}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">BullMQ</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {dbStatus.queues && Object.keys(dbStatus.queues).length > 0 ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-xs font-medium">{dbStatus.queues ? Object.keys(dbStatus.queues).length + ' queues' : 'unknown'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
