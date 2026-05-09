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

// Free TLDs that we can register directly
const FREE_TLDS = ['fahadcloud.com', 'tk', 'ml', 'ga', 'cf', 'eu.org', 'pp.ua'];

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

    // Check if this is a free TLD
    const isFreeTld = FREE_TLDS.includes(tld);

    // Get pricing for the TLD (try both with and without dot prefix)
    const tldWithDot = tld.startsWith('.') ? tld : '.' + tld;
    const tldPricing = await db.tldPricing.findFirst({
      where: {
        OR: [
          { tld: tldWithDot },
          { tld: tld },
        ]
      }
    });

    // Determine availability
    let available = false;
    let availabilitySource = 'unknown';

    if (existingDomain) {
      available = false;
      availabilitySource = 'local_db';
    } else if (isFreeTld) {
      // Free TLDs are always available if not already registered
      available = true;
      availabilitySource = 'local_db';
    } else {
      // Check RDAP for paid domains
      const rdapResult = await checkRdapAvailability(domainLower, tld);
      available = rdapResult.available;
      availabilitySource = rdapResult.source;
    }

    // Calculate price
    const registerPrice = tldPricing?.promo && tldPricing.promoPrice ? tldPricing.promoPrice : tldPricing?.registerPrice || 0;
    const isFree = isFreeTld || (tldPricing?.isFree || false);

    // Get alternative TLD prices for suggestions
    const altTlds = ['.com', '.net', '.org', '.io', '.xyz', '.dev', '.app', '.online', '.store', '.site'];
    const altPricing = await db.tldPricing.findMany({
      where: { tld: { in: altTlds } },
    });

    const alternatives = altPricing.map(p => {
      const altDomain = `${sld}${p.tld}`;
      const altIsFree = p.isFree || false;
      const altPrice = p.promo && p.promoPrice ? p.promoPrice : p.registerPrice;
      return {
        domain: altDomain,
        available: altIsFree ? true : false, // We don't check RDAP for all alternatives to save time
        price: altIsFree ? 0 : altPrice,
        isFree: altIsFree,
        pricing: {
          registerPrice: p.registerPrice,
          renewPrice: p.renewPrice,
          isFree: p.isFree,
          promo: p.promo,
          promoPrice: p.promoPrice,
          category: p.category,
        },
      };
    });

    // Return frontend-friendly format
    return NextResponse.json({
      domain: domainLower,
      available,
      price: isFree ? 0 : registerPrice,
      isFree,
      availabilitySource,
      pricing: tldPricing ? {
        registerPrice,
        renewPrice: tldPricing.renewPrice,
        transferPrice: tldPricing.transferPrice,
        isFree,
        promo: tldPricing.promo,
        promoPrice: tldPricing.promoPrice,
        category: tldPricing.category,
      } : null,
      alternatives,
      sld,
      tld: '.' + tld,
    });
  } catch (error: any) {
    console.error('Domain check error:', error);
    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}
