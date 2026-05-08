'use client'
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Server, Lock, RotateCcw, ExternalLink, Plus } from 'lucide-react';
import { formatBytes, statusColor } from '@/lib/formatters';
import type { HostingEnv } from '@/types';

interface HostingViewProps {
  hostingEnvs: HostingEnv[];
  onNavigate: (view: string) => void;
  onRestartEnv: (envId: string) => void;
}

export default function HostingView({
  hostingEnvs, onNavigate, onRestartEnv,
}: HostingViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Hosting Environments</h2>
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" onClick={() => onNavigate('deploy')}>
          <Plus className="w-4 h-4 mr-2" />
          New Hosting
        </Button>
      </div>
      {hostingEnvs.length > 0 ? (
        hostingEnvs.map(h => (
          <Card key={h.id} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-medium">{h.domain?.name || h.rootPath}</div>
                    <div className="text-xs text-slate-500">{h.serverType} - {h.planSlug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColor(h.status)}>{h.status}</Badge>
                  {h.sslEnabled && <Lock className="w-4 h-4 text-emerald-500" />}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Storage:</span> <span>{formatBytes(h.storageUsed)} / {formatBytes(h.storageLimit)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Last Deploy:</span> <span>{h.lastDeployedAt ? new Date(h.lastDeployedAt).toLocaleDateString() : 'Never'}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-slate-300 text-xs" onClick={() => onRestartEnv(h.id)}>
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-300 text-xs">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <Server className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No hosting environments yet</p>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={() => onNavigate('deploy')}>
              Deploy Your First Site
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
