'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { statusColor } from '@/lib/formatters';

interface MonitoringViewProps {
  monData: any;
  monLoading: boolean;
  onRefresh: () => void;
}

function renderGauge(value: number, label: string, color: string) {
  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-2">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8" strokeDasharray={`${value * 2.51} ${251 - value * 2.51}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-900">{value}%</span>
      </div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

export default function MonitoringView({
  monData, monLoading, onRefresh,
}: MonitoringViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {monLoading && !monData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mr-3" />
          <span className="text-slate-500">Loading monitoring data...</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {monData ? (
          <>
            {renderGauge(monData.system?.cpu || 0, 'CPU Usage', '#10b981')}
            {renderGauge(monData.system?.ram || 0, 'RAM Usage', '#14b8a6')}
            {renderGauge(monData.system?.disk || 0, 'Disk Usage', '#f59e0b')}
          </>
        ) : (
          !monLoading && (
            <div className="col-span-3 text-center py-12">
              <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No monitoring data available</p>
            </div>
          )
        )}
      </div>

      {monData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">System Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">CPU Cores</span><span>{monData.system?.cpuCores || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">RAM Total</span><span>{monData.system?.ramTotal || '-'} MB</span></div>
                <div className="flex justify-between"><span className="text-slate-500">RAM Used</span><span>{monData.system?.ramUsed || '-'} MB</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Uptime</span><span>{monData.system?.uptime || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Load Average</span><span>{monData.system?.loadAverage?.join(', ') || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">App Status</span><Badge className={statusColor(monData.system?.appStatus || 'active')}>{monData.system?.appStatus || 'unknown'}</Badge></div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Active Hosting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(monData.hostingEnvs || []).map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">{h.domain?.name || h.rootPath}</div>
                      <div className="text-xs text-slate-500">{h.serverType} - {h.planSlug}</div>
                    </div>
                    <Badge className={statusColor(h.status)}>{h.status}</Badge>
                  </div>
                ))}
                {(!monData.hostingEnvs || monData.hostingEnvs.length === 0) && <p className="text-sm text-slate-400">No hosting environments</p>}
              </CardContent>
            </Card>
          </div>

          {monData.system?.issues?.length > 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-sm text-red-600">Issues Detected</CardTitle>
              </CardHeader>
              <CardContent>
                {monData.system.issues.map((iss: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    {iss}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Button variant="outline" className="border-slate-300 w-full sm:w-auto" onClick={onRefresh}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
}
