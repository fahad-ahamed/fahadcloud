'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Search,
  Plus,
  Trash2,
  Lock,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  ExternalLink,
  RefreshCw,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { statusColor } from '@/lib/formatters';
import { apiClient } from '@/services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Domain = {
  id: string;
  name: string;
  tld: string;
  status: string;
  sslEnabled: boolean;
  expiresAt: string;
  createdAt: string;
  autoRenew: boolean;
  nameservers: string[];
};

interface DomainsViewProps {
  searchDomain: string;
  setSearchDomain: (v: string) => void;
  searchResult: any;
  searching: boolean;
  domains: Domain[];
  onDomainSearch: () => void;
  onRegisterDomain: (domain: string, price: number) => void;
}

interface DnsRecord {
  id: string;
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

interface SslInfo {
  enabled: boolean;
  issuer?: string;
  expiresAt?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// Sub‑components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    expired: 'bg-red-50 text-red-700 border-red-200',
    inactive: 'bg-slate-50 text-slate-600 border-slate-200',
    verifying: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const iconMap: Record<string, React.ReactNode> = {
    active: <CheckCircle className="h-3 w-3" />,
    pending: <Loader2 className="h-3 w-3 animate-spin" />,
    expired: <XCircle className="h-3 w-3" />,
    inactive: <XCircle className="h-3 w-3" />,
    verifying: <RefreshCw className="h-3 w-3" />,
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium text-xs',
        colorMap[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
      )}
    >
      {iconMap[status] ?? <Globe className="h-3 w-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function SslBadge({ sslEnabled, loading }: { sslEnabled: boolean; loading?: boolean }) {
  if (loading) {
    return (
      <Badge variant="outline" className="gap-1 font-medium text-xs bg-slate-50 text-slate-500 border-slate-200">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking
      </Badge>
    );
  }
  if (sslEnabled) {
    return (
      <Badge variant="outline" className="gap-1 font-medium text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
        <Lock className="h-3 w-3" />
        SSL Active
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 font-medium text-xs bg-amber-50 text-amber-700 border-amber-200">
      <Shield className="h-3 w-3" />
      No SSL
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DomainsView({
  searchDomain,
  setSearchDomain,
  searchResult,
  searching,
  domains: propDomains,
  onDomainSearch,
  onRegisterDomain,
}: DomainsViewProps) {
  // ---- state ----
  const [domains, setDomains] = useState<Domain[]>(propDomains ?? []);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('search');

  // Domain detail / expansion
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  // DNS
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [dnsError, setDnsError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);
  const [newDnsRecord, setNewDnsRecord] = useState({
    type: 'A',
    name: '',
    value: '',
    ttl: 3600,
    priority: 10,
  });
  const [showAddDns, setShowAddDns] = useState(false);
  const [dnsSaving, setDnsSaving] = useState(false);

  // SSL
  const [sslInfo, setSslInfo] = useState<SslInfo | null>(null);
  const [sslLoading, setSslLoading] = useState(false);
  const [sslInstalling, setSslInstalling] = useState(false);
  const [sslError, setSslError] = useState<string | null>(null);

  // Registration
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Delete
  const [deletingDomainId, setDeletingDomainId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Toast‑like feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ---- helpers ----
  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  // ---- load domains ----
  const fetchDomains = useCallback(async () => {
    setLoadingDomains(true);
    try {
      const res = await apiClient.getDomains();
      setDomains(Array.isArray(res) ? res : res?.data ?? propDomains);
    } catch {
      setDomains(propDomains);
    } finally {
      setLoadingDomains(false);
    }
  }, [propDomains]);

  useEffect(() => {
    if (propDomains && propDomains.length > 0) {
      setDomains(propDomains);
    } else {
      fetchDomains();
    }
  }, [propDomains, fetchDomains]);

  // ---- DNS operations ----
  const fetchDnsRecords = useCallback(async (domain: Domain) => {
    setDnsLoading(true);
    setDnsError(null);
    try {
      const res = await apiClient.getDnsRecords(domain.id, domain.name);
      setDnsRecords(Array.isArray(res) ? res : res?.data ?? []);
    } catch (err: any) {
      setDnsError(err?.message ?? 'Failed to load DNS records');
      setDnsRecords([]);
    } finally {
      setDnsLoading(false);
    }
  }, []);

  const handleAddDnsRecord = async () => {
    if (!selectedDomain) return;
    setDnsSaving(true);
    try {
      await apiClient.addDnsRecord({
        domainId: selectedDomain.id,
        domain: selectedDomain.name,
        type: newDnsRecord.type,
        name: newDnsRecord.name,
        value: newDnsRecord.value,
        ttl: newDnsRecord.ttl,
        priority: newDnsRecord.type === 'MX' ? newDnsRecord.priority : undefined,
      });
      showFeedback('success', 'DNS record added successfully');
      setNewDnsRecord({ type: 'A', name: '', value: '', ttl: 3600, priority: 10 });
      setShowAddDns(false);
      fetchDnsRecords(selectedDomain);
    } catch (err: any) {
      showFeedback('error', err?.message ?? 'Failed to add DNS record');
    } finally {
      setDnsSaving(false);
    }
  };

  const handleUpdateDnsRecord = async () => {
    if (!selectedDomain || !editingRecord) return;
    setDnsSaving(true);
    try {
      await apiClient.updateDnsRecord({
        domainId: selectedDomain.id,
        domain: selectedDomain.name,
        recordId: editingRecord.id,
        type: editingRecord.type,
        name: editingRecord.name,
        value: editingRecord.value,
        ttl: editingRecord.ttl,
        priority: editingRecord.priority,
      });
      showFeedback('success', 'DNS record updated');
      setEditingRecord(null);
      fetchDnsRecords(selectedDomain);
    } catch (err: any) {
      showFeedback('error', err?.message ?? 'Failed to update DNS record');
    } finally {
      setDnsSaving(false);
    }
  };

  const handleDeleteDnsRecord = async (recordId: string) => {
    if (!selectedDomain) return;
    setDnsSaving(true);
    try {
      await apiClient.deleteDnsRecord(recordId);
      showFeedback('success', 'DNS record deleted');
      fetchDnsRecords(selectedDomain);
    } catch (err: any) {
      showFeedback('error', err?.message ?? 'Failed to delete DNS record');
    } finally {
      setDnsSaving(false);
    }
  };

  // ---- SSL operations ----
  const fetchSslStatus = useCallback(async (domainName: string) => {
    setSslLoading(true);
    setSslError(null);
    try {
      const res = await apiClient.getSslStatus(domainName);
      setSslInfo(res?.data ?? res ?? { enabled: false });
    } catch {
      setSslInfo({ enabled: false });
    } finally {
      setSslLoading(false);
    }
  }, []);

  const handleInstallSsl = async () => {
    if (!selectedDomain) return;
    setSslInstalling(true);
    setSslError(null);
    try {
      await apiClient.installSsl(selectedDomain.name);
      showFeedback('success', 'SSL certificate installation initiated');
      fetchSslStatus(selectedDomain.name);
    } catch (err: any) {
      setSslError(err?.message ?? 'Failed to install SSL');
      showFeedback('error', err?.message ?? 'SSL installation failed');
    } finally {
      setSslInstalling(false);
    }
  };

  // ---- Domain management ----
  const handleRegister = async (domain: string, price: number) => {
    setRegistering(true);
    setRegisterError(null);
    try {
      await onRegisterDomain(domain, price);
      showFeedback('success', `${domain} registered successfully!`);
      fetchDomains();
      setActiveTab('my-domains');
    } catch (err: any) {
      setRegisterError(err?.message ?? 'Registration failed');
      showFeedback('error', err?.message ?? 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    setDeletingDomainId(domainId);
    try {
      await apiClient.deleteDomain(domainId);
      showFeedback('success', 'Domain deleted');
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
      if (selectedDomain?.id === domainId) {
        setSelectedDomain(null);
      }
      setDeleteConfirmId(null);
    } catch (err: any) {
      showFeedback('error', err?.message ?? 'Failed to delete domain');
    } finally {
      setDeletingDomainId(null);
    }
  };

  const openDomainDetail = (domain: Domain) => {
    setSelectedDomain(domain);
    fetchDnsRecords(domain);
    fetchSslStatus(domain.name);
  };

  const closeDomainDetail = () => {
    setSelectedDomain(null);
    setDnsRecords([]);
    setSslInfo(null);
    setEditingRecord(null);
    setShowAddDns(false);
    setDnsError(null);
    setSslError(null);
  };

  // ---- search ----
  const handleSearch = () => {
    if (!searchDomain.trim()) return;
    onDomainSearch();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ---- derived ----
  const tldPriceMap: Record<string, number> = {
    '.com.bd': 1200,
    '.com': 1500,
    '.net': 1300,
    '.org': 1400,
    '.io': 3500,
    '.dev': 2000,
    '.bd': 800,
    '.info': 1100,
  };

  const getPrice = (tld: string): number => tldPriceMap[tld] ?? 1500;

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      {/* ---- Feedback Toast ---- */}
      {feedback && (
        <div
          className={cn(
            'fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all',
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          )}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {feedback.message}
          <button onClick={() => setFeedback(null)} className="ml-2 hover:opacity-70">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ---- Page Header ---- */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Domain Management</h1>
          <p className="text-sm text-slate-500">Search, register and manage your domains</p>
        </div>
      </div>

      {/* ---- Tabs ---- */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== 'my-domains') closeDomainDetail(); }}>
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
          <TabsTrigger
            value="search"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-md text-sm"
          >
            <Search className="h-4 w-4 mr-1.5" />
            Search &amp; Register
          </TabsTrigger>
          <TabsTrigger
            value="my-domains"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-md text-sm"
          >
            <Globe className="h-4 w-4 mr-1.5" />
            My Domains
            {domains.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-semibold">
                {domains.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ================================================================
            TAB: Search & Register
        ================================================================ */}
        <TabsContent value="search" className="mt-6 space-y-6">
          {/* Search Bar */}
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Find Your Perfect Domain</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Search for .com.bd, .bd, .com, .net and more — great prices for Bangladesh
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Enter domain name (e.g. mybusiness)"
                      value={searchDomain}
                      onChange={(e) => setSearchDomain(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-10 h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={searching || !searchDomain.trim()}
                    className="h-11 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-sm"
                  >
                    {searching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching…
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Result */}
          {searching && (
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mr-3" />
                <span className="text-slate-600">Checking domain availability…</span>
              </CardContent>
            </Card>
          )}

          {!searching && searchResult && (
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-semibold text-slate-900">Search Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Available domains */}
                {searchResult.available && Array.isArray(searchResult.available) && searchResult.available.length > 0 && (
                  <div className="divide-y divide-slate-100">
                    {searchResult.available.map((result: any) => {
                      const tld = result.tld ?? result.domain?.replace(/^[^.]+/, '') ?? '.com.bd';
                      const fullName = result.domain ?? `${searchDomain}${tld}`;
                      const price = result.price ?? getPrice(tld);
                      return (
                        <div
                          key={fullName}
                          className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                            <div>
                              <p className="font-medium text-slate-900">{fullName}</p>
                              <p className="text-xs text-slate-500">Available for registration</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">৳{price.toLocaleString()}</p>
                              <p className="text-xs text-slate-400">/year</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleRegister(fullName, price)}
                              disabled={registering}
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                            >
                              {registering ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                              ) : (
                                <Plus className="h-3.5 w-3.5 mr-1" />
                              )}
                              Register
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Unavailable domains */}
                {searchResult.unavailable && Array.isArray(searchResult.unavailable) && searchResult.unavailable.length > 0 && (
                  <div>
                    {(searchResult.available?.length ?? 0) > 0 && (
                      <div className="px-6 py-2 bg-slate-50 border-y border-slate-100">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Unavailable</p>
                      </div>
                    )}
                    <div className="divide-y divide-slate-100">
                      {searchResult.unavailable.map((result: any) => {
                        const fullName = result.domain ?? `${searchDomain}${result.tld ?? '.com'}`;
                        return (
                          <div
                            key={fullName}
                            className="flex items-center justify-between px-6 py-4 opacity-60"
                          >
                            <div className="flex items-center gap-3">
                              <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                              <div>
                                <p className="font-medium text-slate-600">{fullName}</p>
                                <p className="text-xs text-slate-400">Already taken</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Single result format (availability check) */}
                {searchResult.domain && !searchResult.available && !searchResult.unavailable && (
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {searchResult.isAvailable ? (
                          <CheckCircle className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-400" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 text-lg">{searchResult.domain}</p>
                          <p className="text-sm text-slate-500">
                            {searchResult.isAvailable ? 'Available for registration' : 'This domain is already taken'}
                          </p>
                        </div>
                      </div>
                      {searchResult.isAvailable && (
                        <Button
                          onClick={() =>
                            handleRegister(
                              searchResult.domain,
                              searchResult.price ?? getPrice(searchResult.tld ?? '.com.bd')
                            )
                          }
                          disabled={registering}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                        >
                          {registering ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          Register — ৳{(searchResult.price ?? getPrice(searchResult.tld ?? '.com.bd')).toLocaleString()}/yr
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Popular TLDs pricing */}
          {!searchResult && !searching && (
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">Popular Domain Extensions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(tldPriceMap).map(([tld, price]) => (
                    <div
                      key={tld}
                      className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => {
                        const base = searchDomain.trim() || 'yourdomain';
                        setSearchDomain(`${base}${tld}`);
                      }}
                    >
                      <span className="text-lg font-bold text-slate-900">{tld}</span>
                      <span className="text-sm font-semibold text-emerald-600 mt-1">৳{price.toLocaleString()}</span>
                      <span className="text-xs text-slate-400">/year</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registration error */}
          {registerError && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0" />
              {registerError}
            </div>
          )}
        </TabsContent>

        {/* ================================================================
            TAB: My Domains
        ================================================================ */}
        <TabsContent value="my-domains" className="mt-6 space-y-6">
          {/* Loading */}
          {loadingDomains && (
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mr-3" />
                <span className="text-slate-600">Loading your domains…</span>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!loadingDomains && domains.length === 0 && !selectedDomain && (
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Globe className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No Domains Yet</h3>
                <p className="text-sm text-slate-500 mb-4 max-w-sm">
                  Register your first domain to get started. We support .com.bd, .bd, and many more extensions.
                </p>
                <Button
                  onClick={() => setActiveTab('search')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search Domains
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Domains list + detail layout */}
          {!loadingDomains && domains.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* ---- Left: Domain List ---- */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Your Domains ({domains.length})
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchDomains}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {domains.map((domain) => (
                  <Card
                    key={domain.id}
                    className={cn(
                      'border cursor-pointer transition-all hover:shadow-md',
                      selectedDomain?.id === domain.id
                        ? 'border-emerald-300 ring-1 ring-emerald-200 shadow-md'
                        : 'border-slate-200 shadow-sm hover:border-slate-300'
                    )}
                    onClick={() => openDomainDetail(domain)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Globe className="h-4 w-4 text-emerald-500 shrink-0" />
                            <p className="font-semibold text-slate-900 truncate text-sm">{domain.name}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge status={domain.status} />
                            <SslBadge sslEnabled={domain.sslEnabled} />
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            Expires {formatDate(domain.expiresAt)}
                          </p>
                        </div>
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 mt-1 transition-colors',
                            selectedDomain?.id === domain.id ? 'text-emerald-500' : 'text-slate-300'
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ---- Right: Domain Detail ---- */}
              <div className="lg:col-span-3">
                {!selectedDomain ? (
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                      <Globe className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500">Select a domain to view details</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-5">
                    {/* Domain Header */}
                    <Card className="border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                              <Globe className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-white">{selectedDomain.name}</h2>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-white/20 text-white border-0 text-xs hover:bg-white/30">
                                  {selectedDomain.status}
                                </Badge>
                                {selectedDomain.autoRenew && (
                                  <Badge className="bg-white/20 text-white border-0 text-xs hover:bg-white/30">
                                    Auto‑Renew
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={closeDomainDetail}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">TLD</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedDomain.tld}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Status</p>
                            <StatusBadge status={selectedDomain.status} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">SSL</p>
                            <SslBadge sslEnabled={selectedDomain.sslEnabled} loading={sslLoading} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Expires</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatDate(selectedDomain.expiresAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* SSL Management */}
                    <Card className="border border-slate-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-emerald-500" />
                            SSL Certificate
                          </CardTitle>
                          {!selectedDomain.sslEnabled && (
                            <Button
                              size="sm"
                              onClick={handleInstallSsl}
                              disabled={sslInstalling}
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                            >
                              {sslInstalling ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 mr-1" />
                              )}
                              Install SSL
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {sslLoading ? (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading SSL status…
                          </div>
                        ) : sslInfo?.enabled ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-emerald-800">SSL Certificate Active</p>
                                {sslInfo.issuer && (
                                  <p className="text-xs text-emerald-600">Issuer: {sslInfo.issuer}</p>
                                )}
                                {sslInfo.expiresAt && (
                                  <p className="text-xs text-emerald-600">
                                    Expires: {formatDate(sslInfo.expiresAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                              <Shield className="h-5 w-5 text-amber-600 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-amber-800">No SSL Installed</p>
                                <p className="text-xs text-amber-600">
                                  Install a free SSL certificate to secure your domain with HTTPS
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {sslError && (
                          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> {sslError}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* DNS Management */}
                    <Card className="border border-slate-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <ExternalLink className="h-4 w-4 text-emerald-500" />
                            DNS Records
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchDnsRecords(selectedDomain)}
                              className="text-slate-400 hover:text-slate-600 h-8 w-8 p-0"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowAddDns(true);
                                setEditingRecord(null);
                              }}
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Add Record
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* DNS Error */}
                        {dnsError && (
                          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                            <XCircle className="h-4 w-4 shrink-0" />
                            {dnsError}
                          </div>
                        )}

                        {/* Loading */}
                        {dnsLoading && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 py-4 justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading DNS records…
                          </div>
                        )}

                        {/* Add DNS Record Form */}
                        {showAddDns && !dnsLoading && (
                          <div className="p-4 mb-4 rounded-lg border border-emerald-200 bg-emerald-50/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-900">Add DNS Record</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowAddDns(false);
                                  setNewDnsRecord({ type: 'A', name: '', value: '', ttl: 3600, priority: 10 });
                                }}
                                className="h-7 w-7 p-0 text-slate-400"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-slate-600 mb-1">Type</Label>
                                <select
                                  value={newDnsRecord.type}
                                  onChange={(e) =>
                                    setNewDnsRecord((prev) => ({ ...prev, type: e.target.value }))
                                  }
                                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-emerald-400 focus:ring-emerald-400 focus:outline-none"
                                >
                                  {['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'].map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <Label className="text-xs text-slate-600 mb-1">Name</Label>
                                <Input
                                  placeholder={newDnsRecord.type === 'CNAME' ? 'www' : '@'}
                                  value={newDnsRecord.name}
                                  onChange={(e) =>
                                    setNewDnsRecord((prev) => ({ ...prev, name: e.target.value }))
                                  }
                                  className="h-9 text-sm border-slate-200 focus:border-emerald-400 focus:ring-emerald-400"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-600 mb-1">Value</Label>
                                <Input
                                  placeholder={
                                    newDnsRecord.type === 'A'
                                      ? '192.168.1.1'
                                      : newDnsRecord.type === 'CNAME'
                                      ? 'example.com'
                                      : 'value'
                                  }
                                  value={newDnsRecord.value}
                                  onChange={(e) =>
                                    setNewDnsRecord((prev) => ({ ...prev, value: e.target.value }))
                                  }
                                  className="h-9 text-sm border-slate-200 focus:border-emerald-400 focus:ring-emerald-400"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-600 mb-1">TTL</Label>
                                <select
                                  value={newDnsRecord.ttl}
                                  onChange={(e) =>
                                    setNewDnsRecord((prev) => ({
                                      ...prev,
                                      ttl: parseInt(e.target.value, 10),
                                    }))
                                  }
                                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-emerald-400 focus:ring-emerald-400 focus:outline-none"
                                >
                                  <option value={300}>5 min (300)</option>
                                  <option value={900}>15 min (900)</option>
                                  <option value={1800}>30 min (1800)</option>
                                  <option value={3600}>1 hour (3600)</option>
                                  <option value={14400}>4 hours (14400)</option>
                                  <option value={86400}>1 day (86400)</option>
                                </select>
                              </div>
                              {newDnsRecord.type === 'MX' && (
                                <div>
                                  <Label className="text-xs text-slate-600 mb-1">Priority</Label>
                                  <Input
                                    type="number"
                                    value={newDnsRecord.priority}
                                    onChange={(e) =>
                                      setNewDnsRecord((prev) => ({
                                        ...prev,
                                        priority: parseInt(e.target.value, 10) || 10,
                                      }))
                                    }
                                    className="h-9 text-sm border-slate-200 focus:border-emerald-400 focus:ring-emerald-400"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowAddDns(false);
                                  setNewDnsRecord({ type: 'A', name: '', value: '', ttl: 3600, priority: 10 });
                                }}
                                className="text-slate-500"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleAddDnsRecord}
                                disabled={dnsSaving || !newDnsRecord.name || !newDnsRecord.value}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
                              >
                                {dnsSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                )}
                                Add Record
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* DNS Records Table */}
                        {!dnsLoading && dnsRecords.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-200">
                                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Type
                                  </th>
                                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Name
                                  </th>
                                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Value
                                  </th>
                                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    TTL
                                  </th>
                                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {dnsRecords.map((record) =>
                                  editingRecord?.id === record.id ? (
                                    <tr key={record.id} className="bg-emerald-50/30">
                                      <td className="py-2 px-3">
                                        <select
                                          value={editingRecord.type}
                                          onChange={(e) =>
                                            setEditingRecord((prev) =>
                                              prev ? { ...prev, type: e.target.value } : prev
                                            )
                                          }
                                          className="h-8 rounded border border-slate-200 bg-white px-2 text-xs focus:border-emerald-400 focus:outline-none"
                                        >
                                          {['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'].map((t) => (
                                            <option key={t} value={t}>
                                              {t}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="py-2 px-3">
                                        <Input
                                          value={editingRecord.name}
                                          onChange={(e) =>
                                            setEditingRecord((prev) =>
                                              prev ? { ...prev, name: e.target.value } : prev
                                            )
                                          }
                                          className="h-8 text-xs border-slate-200 focus:border-emerald-400 focus:ring-emerald-400"
                                        />
                                      </td>
                                      <td className="py-2 px-3">
                                        <Input
                                          value={editingRecord.value}
                                          onChange={(e) =>
                                            setEditingRecord((prev) =>
                                              prev ? { ...prev, value: e.target.value } : prev
                                            )
                                          }
                                          className="h-8 text-xs border-slate-200 focus:border-emerald-400 focus:ring-emerald-400"
                                        />
                                      </td>
                                      <td className="py-2 px-3">
                                        <Input
                                          type="number"
                                          value={editingRecord.ttl}
                                          onChange={(e) =>
                                            setEditingRecord((prev) =>
                                              prev
                                                ? { ...prev, ttl: parseInt(e.target.value, 10) || 3600 }
                                                : prev
                                            )
                                          }
                                          className="h-8 text-xs w-20 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400"
                                        />
                                      </td>
                                      <td className="py-2 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleUpdateDnsRecord}
                                            disabled={dnsSaving}
                                            className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                          >
                                            {dnsSaving ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                              <Save className="h-3.5 w-3.5" />
                                            )}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingRecord(null)}
                                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-2.5 px-3">
                                        <Badge
                                          variant="outline"
                                          className="font-mono text-xs bg-slate-50 border-slate-200 text-slate-700"
                                        >
                                          {record.type}
                                        </Badge>
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-xs text-slate-700">
                                        {record.name}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-xs text-slate-700 max-w-[200px] truncate">
                                        {record.value}
                                      </td>
                                      <td className="py-2.5 px-3 text-xs text-slate-500">
                                        {record.ttl}
                                      </td>
                                      <td className="py-2.5 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingRecord(record);
                                              setShowAddDns(false);
                                            }}
                                            className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                          >
                                            <Edit3 className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteDnsRecord(record.id)}
                                            disabled={dnsSaving}
                                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                          >
                                            {dnsSaving ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Empty DNS */}
                        {!dnsLoading && dnsRecords.length === 0 && !dnsError && (
                          <div className="py-8 text-center">
                            <ExternalLink className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No DNS records found</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Add your first DNS record to point your domain
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Nameservers */}
                    <Card className="border border-slate-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-emerald-500" />
                          Nameservers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedDomain.nameservers && selectedDomain.nameservers.length > 0 ? (
                          <div className="space-y-2">
                            {selectedDomain.nameservers.map((ns, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 p-2.5 rounded-md bg-slate-50 border border-slate-100"
                              >
                                <span className="text-xs font-mono text-slate-500">{i + 1}.</span>
                                <span className="text-sm font-mono text-slate-700">{ns}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No nameservers configured</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border border-red-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Danger Zone
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {deleteConfirmId === selectedDomain.id ? (
                          <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-3">
                            <p className="text-sm text-red-800 font-medium">
                              Are you sure you want to delete <strong>{selectedDomain.name}</strong>?
                              This action is permanent and cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteDomain(selectedDomain.id)}
                                disabled={deletingDomainId === selectedDomain.id}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deletingDomainId === selectedDomain.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                )}
                                Yes, Delete Domain
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-slate-500"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-700">Delete this domain</p>
                              <p className="text-xs text-slate-400">
                                Permanently remove this domain and all its DNS records
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirmId(selectedDomain.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
