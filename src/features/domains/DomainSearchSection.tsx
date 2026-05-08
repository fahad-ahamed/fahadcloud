'use client'
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';

interface DomainSearchSectionProps {
  searchDomain: string;
  setSearchDomain: (v: string) => void;
  searching: boolean;
  onSearch: () => void;
}

export default function DomainSearchSection({
  searchDomain, setSearchDomain, searching, onSearch,
}: DomainSearchSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-500/20">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">Find Your Perfect Domain</h2>
        <div className="flex gap-3">
          <Input
            className="flex-1 bg-white border-slate-300 text-slate-900 text-lg h-12"
            placeholder="Search for a domain... (e.g., mysite.com)"
            value={searchDomain}
            onChange={e => setSearchDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
          />
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 h-12 px-8" onClick={onSearch} disabled={searching}>
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
