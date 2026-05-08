'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Globe, Lock, Loader2, Search, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusColor } from '@/lib/formatters';
import type { Domain } from '@/types';

interface DomainsViewProps {
  searchDomain: string;
  setSearchDomain: (v: string) => void;
  searchResult: any;
  searching: boolean;
  domains: Domain[];
  onDomainSearch: () => void;
  onRegisterDomain: (domain: string, price: number) => void;
}

export default function DomainsView({
  searchDomain, setSearchDomain, searchResult, searching, domains,
  onDomainSearch, onRegisterDomain,
}: DomainsViewProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-500/20">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Find Your Perfect Domain</h2>
          <div className="flex gap-3">
            <Input
              className="flex-1 bg-white border-slate-300 text-slate-900 text-lg h-12"
              placeholder="Search for a domain... (e.g., mysite.com)"
              value={searchDomain}
              onChange={e => setSearchDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onDomainSearch()}
            />
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 h-12 px-8" onClick={onDomainSearch} disabled={searching}>
              {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Result */}
      {searchResult && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            {searchResult.available ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-emerald-600 mb-2">{searchResult.domain} is Available!</h3>
                <p className="text-slate-500 mb-4">Register for ৳{searchResult.price?.toFixed(0) || '---'}/year</p>
                <Button
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  onClick={() => onRegisterDomain(searchResult.domain, searchResult.price)}
                >
                  Register Now <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-500 mb-2">{searchResult.domain} is Taken</h3>
                <p className="text-slate-500 mb-4">Try a different domain or TLD</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TLD Pricing */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Domain Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { tld: '.com', price: 1200, free: false },
              { tld: '.net', price: 1100, free: false },
              { tld: '.org', price: 1000, free: false },
              { tld: '.io', price: 3500, free: false },
              { tld: '.xyz', price: 150, free: false },
              { tld: '.dev', price: 1800, free: false },
              { tld: '.fahadcloud.com', price: 0, free: true },
              { tld: '.tk', price: 0, free: true },
              { tld: '.ml', price: 0, free: true },
              { tld: '.ga', price: 0, free: true },
              { tld: '.cf', price: 0, free: true },
              { tld: '.app', price: 1800, free: false },
            ].map((t, i) => (
              <button key={i} onClick={() => setSearchDomain(`example${t.tld}`)} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-center">
                <div className="text-lg font-bold text-slate-900">{t.tld}</div>
                <div className={cn('text-sm font-medium', t.free ? 'text-emerald-600' : 'text-emerald-600')}>{t.free ? 'FREE' : `৳${t.price}/yr`}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Domains */}
      {domains.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">My Domains</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {domains.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-slate-500">Expires: {new Date(d.expiresAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
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
