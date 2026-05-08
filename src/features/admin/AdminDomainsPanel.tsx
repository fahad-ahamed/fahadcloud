'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { statusColor } from '@/lib/formatters';

interface AdminDomainsPanelProps {
  domains: any[];
  loading: boolean;
}

export default function AdminDomainsPanel({
  domains, loading,
}: AdminDomainsPanelProps) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Domains</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
            <span className="text-slate-500">Loading domains...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-left">
                  <th className="pb-2">Domain</th>
                  <th className="pb-2">Owner</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">SSL</th>
                  <th className="pb-2">Expires</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d: any) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium">{d.name}</td>
                    <td className="py-2 text-slate-500">{d.userId?.substring(0, 8) || '-'}...</td>
                    <td className="py-2"><Badge className={statusColor(d.status)}>{d.status}</Badge></td>
                    <td className="py-2">{d.sslEnabled ? '✓' : '✕'}</td>
                    <td className="py-2 text-slate-500">{new Date(d.expiresAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {domains.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-slate-400">No domains found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
