'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Server, HardDrive, CreditCard, TrendingUp, Search, Brain, Rocket, Monitor, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes, statusColor } from '@/lib/formatters';
import type { User, Domain, HostingEnv } from '@/types';

interface DashboardViewProps {
  user: User;
  domains: Domain[];
  hostingEnvs: HostingEnv[];
  dashboardLoading: boolean;
  onNavigate: (view: string) => void;
}

export default function DashboardView({
  user, domains, hostingEnvs, dashboardLoading, onNavigate,
}: DashboardViewProps) {
  // AI Agent stats
  const [aiStats, setAiStats] = useState<{ activeAgents: number; recentActivity: number } | null>(null);

  useEffect(() => {
    fetch('/api/agent/monitor')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          const agents = data.agents || [];
          const activeAgents = agents.filter((a: any) => a.status === 'active' || a.status === 'running').length;
          const recentActivity = agents.reduce((sum: number, a: any) => sum + (a.tasksCompleted || 0), 0);
          setAiStats({ activeAgents, recentActivity });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {dashboardLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
          <span className="text-slate-500">Loading dashboard...</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Domains', value: domains.length, icon: Globe, color: 'from-emerald-500 to-teal-500', change: '+2 this month' },
          { label: 'Active Hosting', value: hostingEnvs.filter(h => h.status === 'active').length, icon: Server, color: 'from-emerald-500 to-teal-500', change: 'All healthy' },
          { label: 'Storage Used', value: formatBytes(user.storageUsed), icon: HardDrive, color: 'from-emerald-500 to-teal-500', change: `${((user.storageUsed / user.storageLimit) * 100).toFixed(1)}% of ${formatBytes(user.storageLimit)}` },
          { label: 'Balance', value: `৳${user.balance.toFixed(0)}`, icon: CreditCard, color: 'from-yellow-500 to-orange-500', change: 'bKash' },
        ].map((s, i) => (
          <Card key={i} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', s.color)}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Agents Card */}
      <Card className="bg-gradient-to-r from-violet-500 to-purple-600 border-0 shadow-md animate-slide-up">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI Agents</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white/80 text-xs">{aiStats?.activeAgents ?? '...'} active agents</span>
                  <span className="text-white/60 text-xs">|</span>
                  <span className="text-white/80 text-xs">{aiStats?.recentActivity ?? '...'} recent tasks</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('ai_agent')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition flex items-center gap-1.5"
            >
              <Rocket className="w-4 h-4" /> View AI Agents
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white border-slate-200 shadow-sm animate-slide-up">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Search Domain', icon: Search, action: () => onNavigate('domains'), color: 'from-emerald-500 to-teal-500' },
            { label: 'AI Agent', icon: Brain, action: () => onNavigate('ai_agent'), color: 'from-emerald-500 to-teal-500' },
            { label: 'Deploy Site', icon: Rocket, action: () => onNavigate('deploy'), color: 'from-orange-500 to-red-500' },
            { label: 'Check Status', icon: Monitor, action: () => onNavigate('monitoring'), color: 'from-emerald-500 to-teal-500' },
          ].map((a, i) => (
            <button key={i} onClick={a.action} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition group">
              <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition', a.color)}>
                <a.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-slate-600">{a.label}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Domains List */}
      {domains.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Your Domains</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {domains.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium truncate">{d.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={statusColor(d.status)}>{d.status}</Badge>
                  {d.sslEnabled && <Lock className="w-4 h-4 text-emerald-500" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
