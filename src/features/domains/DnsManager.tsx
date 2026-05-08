'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Trash2, Plus, Wifi } from 'lucide-react';
import type { Domain } from '@/types';

interface DnsManagerProps {
  domains: Domain[];
  dnsDomain: string;
  setDnsDomain: (v: string) => void;
  dnsRecords: any[];
  dnsLoading: boolean;
  newDnsRecord: { type: string; name: string; value: string; ttl: number };
  setNewDnsRecord: (v: { type: string; name: string; value: string; ttl: number }) => void;
  onLoadDnsRecords: (domainName: string) => void;
  onAddDnsRecord: () => void;
  onNavigate: (view: string) => void;
}

export default function DnsManager({
  domains, dnsDomain, setDnsDomain,
  dnsRecords, dnsLoading, newDnsRecord, setNewDnsRecord,
  onLoadDnsRecords, onAddDnsRecord, onNavigate,
}: DnsManagerProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">DNS Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={dnsDomain} onValueChange={setDnsDomain}>
            <SelectTrigger className="bg-white border-slate-300 mb-4">
              <SelectValue placeholder="Select a domain" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-300">
              {domains.map(d => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {dnsDomain && (
        <>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">DNS Records</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onLoadDnsRecords(dnsDomain)}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {dnsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
                  <span className="text-slate-500">Loading DNS records...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-left">
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Value</th>
                        <th className="pb-2">TTL</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dnsRecords.map((r, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="py-2"><Badge className="bg-emerald-500/20 text-emerald-700">{r.type}</Badge></td>
                          <td className="py-2">{r.name}</td>
                          <td className="py-2 text-slate-500">{r.value}</td>
                          <td className="py-2 text-slate-500">{r.ttl}</td>
                          <td className="py-2">
                            <Button variant="ghost" size="sm" className="text-red-400 h-6">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {dnsRecords.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-slate-400">No DNS records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Add DNS Record</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Select value={newDnsRecord.type} onValueChange={v => setNewDnsRecord(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-300">
                    {['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input className="bg-white border-slate-300" placeholder="Name" value={newDnsRecord.name} onChange={e => setNewDnsRecord(p => ({ ...p, name: e.target.value }))} />
                <Input className="bg-white border-slate-300" placeholder="Value" value={newDnsRecord.value} onChange={e => setNewDnsRecord(p => ({ ...p, value: e.target.value }))} />
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onAddDnsRecord}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {domains.length === 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <Wifi className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No domains found. Register a domain first to manage DNS.</p>
            <Button variant="outline" onClick={() => onNavigate('domains')}>
              Register a Domain
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
