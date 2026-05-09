'use client'
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Shield, Loader2, CheckCircle, AlertCircle, RefreshCw, Calendar, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Domain } from '@/types';

interface SslViewProps {
  domains: Domain[];
  onInstallSsl: (domainName: string) => void;
}

interface SslInstallState {
  [domainName: string]: {
    loading: boolean;
    success: boolean;
    error: string | null;
    provider?: string;
    expiry?: string;
  };
}

export default function SslView({ domains, onInstallSsl }: SslViewProps) {
  const [installState, setInstallState] = useState<SslInstallState>({});
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const handleInstallSsl = async (domainName: string) => {
    setInstallState(prev => ({
      ...prev,
      [domainName]: { loading: true, success: false, error: null },
    }));

    try {
      const res = await fetch('/api/domains/ssl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setInstallState(prev => ({
          ...prev,
          [domainName]: { loading: false, success: false, error: data.error || 'SSL installation failed' },
        }));
        return;
      }

      setInstallState(prev => ({
        ...prev,
        [domainName]: {
          loading: false,
          success: true,
          error: null,
          provider: data.ssl?.provider,
          expiry: data.ssl?.expiryDate,
        },
      }));
    } catch (e: any) {
      setInstallState(prev => ({
        ...prev,
        [domainName]: { loading: false, success: false, error: e.message || 'Network error' },
      }));
    }
  };

  const checkSslStatus = async (domainName: string) => {
    setRefreshing(domainName);
    try {
      const res = await fetch(`/api/domains/ssl?domain=${domainName}`);
      const data = await res.json();
      if (data.sslEnabled) {
        setInstallState(prev => ({
          ...prev,
          [domainName]: {
            loading: false,
            success: true,
            error: null,
            provider: data.sslProvider,
            expiry: data.sslExpiry,
          },
        }));
      }
    } catch {}
    setRefreshing(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getSslState = (domain: Domain) => {
    const domainName = domain.name;
    // If already enabled in domain data
    if (domain.sslEnabled && !installState[domainName]) {
      return {
        loading: false,
        success: true,
        error: null,
        provider: domain.sslProvider || "Let's Encrypt",
        expiry: domain.sslExpiry,
      };
    }
    return installState[domainName] || { loading: false, success: false, error: null };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            SSL Certificates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              No domains found. Register a domain first.
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map(d => {
                const state = getSslState(d);
                return (
                  <div key={d.id} className={cn(
                    'p-4 rounded-xl border transition-colors',
                    state.success ? 'bg-emerald-50/50 border-emerald-200' :
                    state.error ? 'bg-red-50/50 border-red-200' :
                    'bg-slate-50 border-slate-200'
                  )}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {state.loading ? (
                          <Loader2 className="w-5 h-5 text-emerald-500 shrink-0 animate-spin mt-0.5" />
                        ) : state.success ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : state.error ? (
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        ) : (
                          <Shield className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{d.name}</div>
                          {state.loading && (
                            <div className="text-sm text-emerald-600 mt-1">
                              Installing SSL certificate...
                            </div>
                          )}
                          {state.success && (
                            <div className="space-y-1 mt-1">
                              <div className="text-sm text-emerald-700 flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5" />
                                SSL Active - Provider: {state.provider || "Let's Encrypt"}
                              </div>
                              {state.expiry && (
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Expires: {formatDate(state.expiry)}
                                </div>
                              )}
                            </div>
                          )}
                          {state.error && (
                            <div className="text-sm text-red-600 mt-1">
                              Error: {state.error}
                            </div>
                          )}
                          {!state.loading && !state.success && !state.error && !d.sslEnabled && (
                            <div className="text-xs text-slate-500 mt-1">No SSL installed</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {state.success || d.sslEnabled ? (
                          <>
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">Secure</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => checkSslStatus(d.name)}
                              disabled={refreshing === d.name}
                            >
                              <RefreshCw className={cn('w-3.5 h-3.5', refreshing === d.name && 'animate-spin')} />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                            onClick={() => handleInstallSsl(d.name)}
                            disabled={state.loading}
                          >
                            {state.loading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Installing...
                              </>
                            ) : (
                              'Install SSL'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SSL Info Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm text-slate-600">About SSL Certificates</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-500 space-y-2">
          <p>SSL certificates encrypt data between your website and its visitors, ensuring security and trust.</p>
          <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Free Let's Encrypt certificates with auto-renewal</div>
          <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> HTTPS redirect enabled automatically</div>
          <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> 90-day validity with automatic renewal</div>
        </CardContent>
      </Card>
    </div>
  );
}
