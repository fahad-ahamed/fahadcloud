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
      // API returns: { query, sld, tld, primaryResult: { domain, available, pricing: {...} }, alternatives }
      // Transform to flat format the frontend expects
      const primary = data.primaryResult || data;
      const isFree = primary.pricing?.isFree || primary.isFree || false;
      const price = isFree ? 0 : (primary.pricing?.promoPrice || primary.pricing?.registerPrice || primary.price || 0);
      
      // Also get alternative TLD results
      const alternatives = data.alternatives || {};
      const altResults = Object.entries(alternatives).map(([tld, info]: [string, any]) => ({
        domain: info.domain || `${data.sld}${tld}`,
        available: info.available || false,
        price: info.pricing?.isFree ? 0 : (info.pricing?.promoPrice || info.pricing?.registerPrice || 0),
        isFree: info.pricing?.isFree || false,
        pricing: info.pricing,
      }));

      setSearchResult({
        domain: primary.domain || data.query || domain,
        available: primary.available || false,
        price,
        isFree,
        pricing: primary.pricing,
        alternatives: altResults,
        sld: data.sld,
        tld: data.tld,
      });
    } catch (e: any) {
      console.error('Domain search error:', e);
    }
    setSearching(false);
  }, []);

  const registerDomain = useCallback(async (domain: string, price: number) => {
    // For free domains, register directly via /api/domains
    const isFree = price === 0;
    if (isFree) {
      const data = await apiClient.registerDomain({
        domainName: domain,
        isFree: true,
      });
      // Reload domains after registration
      await loadDomains();
      return { id: data.domain?.id || 'free', domain, price, type: 'domain_registration', isFree: true };
    }
    // For paid domains, create an order first
    const orderData = await apiClient.createOrder({
      type: 'domain_registration', domainName: domain, amount: price, description: `Domain registration: ${domain}`,
    });
    return { id: orderData.order?.id || orderData.id, domain, price, type: 'domain_registration', isFree: false };
  }, []);

  const deleteDomain = useCallback(async (domainId: string) => {
    await apiClient.deleteDomain(domainId);
    setDomains(prev => prev.filter(d => d.id !== domainId));
  }, []);

  return { domains, searchResult, searching, loading, loadDomains, searchDomain, registerDomain, deleteDomain, setDomains };
}
