'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { statusColor } from '@/lib/formatters';
import type { AgentTask } from '@/types';

interface AgentTaskPanelProps {
  agentTasks: AgentTask[];
  onApproveTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
}

export default function AgentTaskPanel({
  agentTasks, onApproveTask, onCancelTask,
}: AgentTaskPanelProps) {
  const activeTasks = agentTasks.filter(t => ['running', 'planned', 'approved'].includes(t.status));

  return (
    <div className="space-y-4">
      {/* Active Tasks */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Active Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeTasks.length === 0 ? (
            <p className="text-xs text-slate-400">No active tasks</p>
          ) : (
            activeTasks.map(t => (
              <div key={t.id} className="p-2 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{t.type}</span>
                  <Badge className={statusColor(t.status)}>{t.status}</Badge>
                </div>
                <p className="text-xs text-slate-500">{t.description}</p>
                {t.totalSteps > 0 && (
                  <div className="mt-1">
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(t.currentStep / t.totalSteps) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400">Step {t.currentStep}/{t.totalSteps}</span>
                  </div>
                )}
                {t.status === 'planned' && (
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => onApproveTask(t.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] border-red-200 text-red-500 flex-1" onClick={() => onCancelTask(t.id)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 max-h-64 overflow-y-auto">
          {agentTasks.length === 0 ? (
            <p className="text-xs text-slate-400">No tasks yet</p>
          ) : (
            agentTasks.slice(0, 10).map(t => (
              <div key={t.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-slate-50">
                {t.status === 'completed' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : t.status === 'failed' ? <XCircle className="w-3 h-3 text-red-400" /> : <Clock className="w-3 h-3 text-amber-500" />}
                <span className="text-slate-600 truncate">{t.type}</span>
                <Badge className={statusColor(t.status) + ' text-[9px] ml-auto'}>{t.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
