'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Shield } from 'lucide-react';
import type { Domain } from '@/types';

interface SslViewProps {
  domains: Domain[];
  onInstallSsl: (domainName: string) => void;
}

export default function SslView({ domains, onInstallSsl }: SslViewProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">SSL Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          {domains.map(d => (
            <div key={d.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-2">
              <div className="flex items-center gap-3">
                {d.sslEnabled ? <Lock className="w-5 h-5 text-emerald-500" /> : <Shield className="w-5 h-5 text-slate-400" />}
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-slate-500">{d.sslEnabled ? "SSL Active - Provider: Let's Encrypt" : 'No SSL installed'}</div>
                </div>
              </div>
              {d.sslEnabled ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Secure</Badge>
              ) : (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onInstallSsl(d.name)}>
                  Install SSL
                </Button>
              )}
            </div>
          ))}
          {domains.length === 0 && <div className="text-center py-8 text-slate-400">No domains found. Register a domain first.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
