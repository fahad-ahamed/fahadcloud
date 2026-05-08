import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

const RDAP_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';

interface RdapBootstrapEntry {
  tld: string[];
  urls: string[];
}

let rdapCache: { data: RdapBootstrapEntry[]; timestamp: number } | null = null;

async function getRdapBootstrap(): Promise<RdapBootstrapEntry[]> {
  if (rdapCache && Date.now() - rdapCache.timestamp < 3600000) {
    return rdapCache.data;
  }
  try {
    const response = await fetch(RDAP_BOOTSTRAP_URL);
    const data = await response.json();
    rdapCache = { data: data.services || [], timestamp: Date.now() };
    return rdapCache.data;
  } catch {
    return [];
  }
}

async function findRdapServer(tld: string): Promise<string | null> {
  const services = await getRdapBootstrap();
  for (const service of services) {
    for (const serviceTld of service.tld) {
      if (serviceTld.toLowerCase() === tld.toLowerCase() || 
          tld.toLowerCase().endsWith('.' + serviceTld.toLowerCase())) {
        return service.urls[0];
      }
    }
  }
  return null;
}

async function checkRdapAvailability(domain: string, tld: string): Promise<{ available: boolean; source: string }> {
  try {
    const rdapServer = await findRdapServer(tld);
    if (!rdapServer) {
      return { available: false, source: 'rdap_no_server' };
    }

    const rdapUrl = `${rdapServer.replace(/\/$/, '')}/domain/${domain}`;
    const response = await fetch(rdapUrl, {
      headers: { Accept: 'application/rdap+json' },
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 404) {
      return { available: true, source: 'rdap' };
    }

    if (response.ok) {
      return { available: false, source: 'rdap' };
    }

    return { available: false, source: 'rdap_error' };
  } catch {
    return { available: false, source: 'rdap_timeout' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(ip, 'domain_search');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many domain search requests. Please try again later.' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    const domainLower = domain.toLowerCase().trim();
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    const parts = domainLower.split('.');
    
    if (parts.length < 2) {
      return NextResponse.json(
        { error: 'Please provide a full domain name (e.g., example.com)' },
        { status: 400 }
      );
    }

    const sld = parts[0];
    const tld = parts.slice(1).join('.');

    if (!domainRegex.test(sld) || sld.length < 1 || sld.length > 63) {
      return NextResponse.json(
        { error: 'Invalid domain name format' },
        { status: 400 }
      );
    }

    // Check if already registered in our system
    const existingDomain = await db.domain.findUnique({ where: { name: domainLower } });

    // Get pricing for the TLD
    const tldPricing = await db.tldPricing.findUnique({ where: { tld: `.${tld}` } });

    // Also check common TLDs
    const commonTlds = ['.com', '.net', '.org', '.io', '.dev', '.app', '.me', '.co', '.xyz', '.info', '.biz', '.online'];
    const tldsToCheck = new Set<string>([`.${tld}`]);
    for (const ct of commonTlds) {
      tldsToCheck.add(ct);
    }

    const allPricing = await db.tldPricing.findMany({
      where: { tld: { in: Array.from(tldsToCheck) } },
    });

    const pricingMap = new Map(allPricing.map(p => [p.tld, p]));

    // Check availability via RDAP for the requested domain
    let mainAvailability = { available: false, source: 'unknown' };
    if (!existingDomain) {
      mainAvailability = await checkRdapAvailability(domainLower, tld);
    }

    // Build results for multiple TLDs
    const results: Record<string, any> = {};
    for (const currentTld of Array.from(tldsToCheck)) {
      const currentDomain = `${sld}${currentTld}`;
      const existing = currentTld === `.${tld}` ? existingDomain : 
        await db.domain.findUnique({ where: { name: currentDomain } }).catch(() => null);
      
      const pricing = pricingMap.get(currentTld);
      
      let available = false;
      let availabilitySource = 'unknown';
      
      if (existing) {
        available = false;
        availabilitySource = 'local_db';
      } else if (currentTld === `.${tld}`) {
        available = mainAvailability.available;
        availabilitySource = mainAvailability.source;
      } else {
        const rdapResult = await checkRdapAvailability(currentDomain, currentTld.slice(1));
        available = rdapResult.available;
        availabilitySource = rdapResult.source;
      }

      const registerPrice = pricing?.promo && pricing.promoPrice ? pricing.promoPrice : pricing?.registerPrice || 0;
      const isFree = pricing?.isFree || false;

      results[currentTld] = {
        domain: currentDomain,
        available,
        availabilitySource,
        pricing: pricing ? {
          registerPrice,
          renewPrice: pricing.renewPrice,
          transferPrice: pricing.transferPrice,
          isFree,
          promo: pricing.promo,
          promoPrice: pricing.promoPrice,
          category: pricing.category,
        } : null,
      };
    }

    return NextResponse.json({
      query: domainLower,
      sld,
      tld: `.${tld}`,
      primaryResult: results[`.${tld}`],
      alternatives: results,
    });
  } catch (error: any) {
    console.error('Domain check error:', error);
    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}
