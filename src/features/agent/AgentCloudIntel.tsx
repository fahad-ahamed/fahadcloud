'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Radar, Shield, Activity, Bot, Loader2, RefreshCw, Database, Server,
  Brain, Zap, CheckCircle, XCircle, Cpu, HardDrive, AlertTriangle, Clock, TrendingUp, Globe, Terminal, Rocket, CreditCard, Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const AGENT_ICONS: Record<string, any> = {
  devops: Rocket, security: Shield, deployment: Zap, monitoring: Monitor,
  debugging: AlertTriangle, infrastructure: Server, database: Database,
  optimization: TrendingUp, recovery: RefreshCw, scaling: Cpu,
  dns_domain: Globe, payment: CreditCard, supervisor: Brain, auto_learning: Brain,
  ui_design: Monitor, research: Globe, self_improvement: TrendingUp,
  bug_fixer: AlertTriangle, chat: Terminal, devops_advanced: Rocket, bug_detector: AlertTriangle, learning: Brain,
};

export default function AgentCloudIntel() {
  const [agents, setAgents] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const [monitorRes, dbRes] = await Promise.all([
        fetch('/api/agent/monitor').catch(() => null),
        fetch('/api/database').catch(() => null),
      ]);
      if (monitorRes?.ok) {
        const data = await monitorRes.json();
        setAgents(data.agents || []);
      }
      if (dbRes?.ok) {
        const data = await dbRes.json();
        setDbStatus(data);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => { loadData(); }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = (healthy: boolean) => healthy ?
    <CheckCircle className="w-4 h-4 text-emerald-500" /> :
    <XCircle className="w-4 h-4 text-red-500" />;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-emerald-400';
      case 'busy': case 'active': return 'bg-amber-400 animate-pulse';
      case 'learning': return 'bg-blue-400 animate-pulse';
      case 'error': return 'bg-red-400';
      default: return 'bg-slate-300';
    }
  };

  // Calculate system health score
  const healthChecks = [
    dbStatus?.databases?.postgresql?.status === 'healthy',
    dbStatus?.databases?.redis?.status === 'healthy',
    dbStatus?.databases?.qdrant?.status === 'healthy',
    !!dbStatus?.queues && Object.keys(dbStatus.queues).length > 0,
  ];
  const healthScore = Math.round((healthChecks.filter(Boolean).length / healthChecks.length) * 100);
  const activeAgents = agents.filter(a => a.status === 'busy' || a.status === 'learning').length;
  const totalTasks = agents.reduce((sum, a) => sum + (a.totalTasks || a.completedTasks || 0), 0);
  const completedTasks = agents.reduce((sum, a) => sum + (a.completedTasks || 0), 0);
  const failedTasks = agents.reduce((sum, a) => sum + (a.failedTasks || 0), 0);

  if (loading && agents.length === 0) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-3" />
      <span className="text-slate-500">Loading Cloud Intelligence...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cloud Intelligence</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time overview of your multi-agent AI cloud system</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Updated: {lastRefresh.toLocaleTimeString()}</span>
          <Button onClick={loadData} size="sm" variant="outline" className="gap-1.5 border-slate-200">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />Refresh
          </Button>
        </div>
      </div>

      {/* System Health Score */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm md:col-span-1">
          <CardContent className="p-4 text-center">
            <div className={cn("w-16 h-16 rounded-full mx-auto flex items-center justify-center text-xl font-bold text-white",
              healthScore >= 75 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
              healthScore >= 50 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
              'bg-gradient-to-br from-red-400 to-red-600'
            )}>
              {healthScore}%
            </div>
            <p className="text-xs text-slate-500 mt-2">System Health</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Database className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-slate-500">PostgreSQL</p>
              <div className="flex items-center gap-1">{getHealthIcon(dbStatus?.databases?.postgresql?.status === 'healthy')}<span className="text-xs font-medium">{dbStatus?.databases?.postgresql?.status || 'checking'}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><Server className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-slate-500">Redis</p>
              <div className="flex items-center gap-1">{getHealthIcon(dbStatus?.databases?.redis?.status === 'healthy')}<span className="text-xs font-medium">{dbStatus?.databases?.redis?.status || 'checking'}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Brain className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-slate-500">Qdrant</p>
              <div className="flex items-center gap-1">{getHealthIcon(dbStatus?.databases?.qdrant?.status === 'healthy')}<span className="text-xs font-medium">{dbStatus?.databases?.qdrant?.status || 'checking'}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Zap className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-slate-500">BullMQ</p>
              <div className="flex items-center gap-1">{getHealthIcon(!!dbStatus?.queues && Object.keys(dbStatus.queues).length > 0)}<span className="text-xs font-medium">{dbStatus?.queues ? Object.keys(dbStatus.queues).length + ' queues' : 'checking'}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-3 flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-600" />
            <div><p className="text-[10px] text-slate-500">Agents</p><p className="text-lg font-bold text-slate-900">{agents.length}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            <div><p className="text-[10px] text-slate-500">Active</p><p className="text-lg font-bold text-slate-900">{activeAgents}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <div><p className="text-[10px] text-slate-500">Completed</p><p className="text-lg font-bold text-slate-900">{completedTasks}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-3 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <div><p className="text-[10px] text-slate-500">Failed</p><p className="text-lg font-bold text-slate-900">{failedTasks}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Fleet */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Radar className="w-4 h-4 text-emerald-600" />Agent Fleet</CardTitle>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{agents.length} Agents Online</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((agent: any) => {
              const agentId = agent.agentId || agent.id;
              const IconComp = AGENT_ICONS[agentId] || Bot;
              return (
                <div key={agent.id || agent.agentId} className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', AGENT_COLORS[agentId] || 'from-emerald-500 to-teal-500')}>
                      <IconComp className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{agent.name || agentId}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(agent.status))} />
                        <span className="text-[10px] text-slate-500 capitalize">{agent.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span>Tasks: {agent.totalTasks || agent.completedTasks || 0}</span>
                    <span>Done: {agent.completedTasks || 0}</span>
                    {agent.avgResponseTime > 0 && <span>{agent.avgResponseTime}ms</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {agents.length === 0 && (
            <div className="text-center py-8">
              <Bot className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No agents detected. Refresh to load.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vector DB Collections */}
      {dbStatus?.databases?.qdrant?.collections && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-purple-600" />Vector Collections</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(dbStatus.databases.qdrant.collections).map(([name, info]: [string, any]) => (
                <div key={name} className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs font-medium text-slate-700 mb-1">{name.replace(/_/g, ' ')}</div>
                  <div className="text-lg font-bold text-slate-900">{info.pointsCount || 0}</div>
                  <Badge className={cn('text-[10px]', info.status === 'green' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>{info.status || 'unknown'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Status */}
      {dbStatus?.queues && Object.keys(dbStatus.queues).length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-amber-600" />Job Queues</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {Object.entries(dbStatus.queues).map(([name, info]: [string, any]) => (
                <div key={name} className="p-2 bg-slate-50 rounded-lg text-center">
                  <div className="text-[10px] font-medium text-slate-500 mb-1 truncate">{name.replace(/_/g, ' ')}</div>
                  <div className="text-sm font-bold text-slate-900">{info.waiting || 0}</div>
                  <div className="text-[10px] text-slate-400">waiting</div>
                  {(info.active || 0) > 0 && <div className="text-[10px] text-amber-600">{info.active} active</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
