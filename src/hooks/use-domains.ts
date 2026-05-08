'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api';
import type { Domain, DomainSearchResult, DnsRecord } from '@/types';

export function useDomains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [searchResult, setSearchResult] = useState<DomainSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getDomains();
      setDomains(Array.isArray(data.domains) ? data.domains : Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  const searchDomain = useCallback(async (domain: string) => {
    if (!domain.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const data = await apiClient.checkDomain(domain.trim().toLowerCase());
      setSearchResult(data);
    } catch {}
    setSearching(false);
  }, []);

  const registerDomain = useCallback(async (domain: string, price: number) => {
    const orderData = await apiClient.createOrder({
      type: 'domain_registration', domain, amount: price, description: `Domain registration: ${domain}`,
    });
    return { id: orderData.order?.id || orderData.id, domain, price, type: 'domain_registration' };
  }, []);

  const deleteDomain = useCallback(async (domainId: string) => {
    await apiClient.deleteDomain(domainId);
    setDomains(prev => prev.filter(d => d.id !== domainId));
  }, []);

  return { domains, searchResult, searching, loading, loadDomains, searchDomain, registerDomain, deleteDomain, setDomains };
}
