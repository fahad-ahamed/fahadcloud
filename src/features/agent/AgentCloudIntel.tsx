'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Radar, Shield, Activity, Bot, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentCloudIntelProps {
  allAgents: any[];
  systemOverview: any;
  securityStatus: any;
  predictions: any[];
  agentIconMap: Record<string, any>;
}

export default function AgentCloudIntel({
  allAgents, systemOverview, securityStatus, predictions, agentIconMap,
}: AgentCloudIntelProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Radar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Cloud Intelligence</h2>
              <p className="text-slate-500">Real-time overview of your multi-agent AI cloud system</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Fleet Status */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Agent Fleet</CardTitle>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{allAgents.length} Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {allAgents.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading agent fleet...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allAgents.map((agent: any) => (
                <div key={agent.id} className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent.color || 'from-emerald-500 to-teal-500'} flex items-center justify-center`}>
                      {agent.icon && agentIconMap[agent.icon] ? React.createElement(agentIconMap[agent.icon], { className: 'w-4 h-4 text-white' }) : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{agent.name}</div>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] text-slate-400 capitalize">{agent.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400">Tasks: {agent.activeTasks || 0}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Status */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {securityStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Security Score</span>
                  <span className="text-lg font-bold text-emerald-600">{securityStatus.score}/100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: `${securityStatus.score}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="text-xs p-2 bg-slate-50 rounded-lg">
                    <div className="text-slate-400">Blocked IPs</div>
                    <div className="font-semibold text-slate-700">{securityStatus.blockedIPs || 0}</div>
                  </div>
                  <div className="text-xs p-2 bg-slate-50 rounded-lg">
                    <div className="text-slate-400">Active Policies</div>
                    <div className="font-semibold text-slate-700">{securityStatus.activePolicies || 0}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Loading security data...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-500" /> System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {systemOverview ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Agents</span>
                  <span className="font-semibold text-slate-700">{systemOverview.totalAgents || allAgents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Active Tasks</span>
                  <span className="font-semibold text-emerald-600">{systemOverview.activeTasks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">System Health</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Healthy</Badge>
                </div>
                {predictions.length > 0 && (
                  <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="text-xs font-medium text-amber-700 mb-1">Predictions</div>
                    {predictions.slice(0, 3).map((p: any, i: number) => (
                      <div key={i} className="text-[10px] text-amber-600">{p.description || p.type || JSON.stringify(p).substring(0, 50)}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Loading system data...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
