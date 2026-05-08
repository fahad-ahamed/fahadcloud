import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    const domainLower = domain.toLowerCase().trim();
    const parts = domainLower.split('.');
    if (parts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    const tld = parts.slice(1).join('.');

    // Find RDAP server for this TLD
    const rdapServer = await findRdapServer(tld);
    if (!rdapServer) {
      return NextResponse.json(
        { error: `No RDAP server found for .${tld}` },
        { status: 404 }
      );
    }

    // Query RDAP for domain information
    const rdapUrl = `${rdapServer.replace(/\/$/, '')}/domain/${domainLower}`;
    const response = await fetch(rdapUrl, {
      headers: { Accept: 'application/rdap+json' },
      signal: AbortSignal.timeout(15000),
    });

    if (response.status === 404) {
      return NextResponse.json({
        domain: domainLower,
        available: true,
        message: 'Domain appears to be available (not found in RDAP)',
      });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `RDAP lookup failed with status ${response.status}` },
        { status: 502 }
      );
    }

    const rdapData = await response.json();

    // Parse RDAP data into a readable format
    const whoisData: any = {
      domain: domainLower,
      available: false,
      ldhName: rdapData.ldhName || domainLower,
      handle: rdapData.handle || null,
      status: rdapData.status || [],
      nameservers: [] as string[],
      events: [] as any[],
      entities: [] as any[],
    };

    // Extract status
    if (rdapData.status && Array.isArray(rdapData.status)) {
      whoisData.status = rdapData.status;
    }

    // Extract nameservers
    if (rdapData.nameservers && Array.isArray(rdapData.nameservers)) {
      whoisData.nameservers = rdapData.nameservers.map((ns: any) => ns.ldhName || ns.value);
    }

    // Extract events (registration, expiration, etc.)
    if (rdapData.events && Array.isArray(rdapData.events)) {
      whoisData.events = rdapData.events.map((e: any) => ({
        action: e.eventAction,
        date: e.eventDate,
      }));
    }

    // Extract entities (registrar, registrant)
    if (rdapData.entities && Array.isArray(rdapData.entities)) {
      whoisData.entities = rdapData.entities.map((entity: any) => ({
        handle: entity.handle,
        roles: entity.roles,
        vcard: entity.vcardArray ? entity.vcardArray[1] : null,
        publicIds: entity.publicIds || null,
      }));
    }

    // Extract secure DNS info
    if (rdapData.secureDNS) {
      whoisData.secureDNS = {
        delegationSigned: rdapData.secureDNS.delegationSigned || false,
        dsData: rdapData.secureDNS.dsData || [],
      };
    }

    // Extract links
    if (rdapData.links && Array.isArray(rdapData.links)) {
      whoisData.links = rdapData.links.map((l: any) => ({
        rel: l.rel,
        href: l.href,
        type: l.type,
      }));
    }

    return NextResponse.json(whoisData);
  } catch (error: any) {
    console.error('WHOIS lookup error:', error);
    if (error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'WHOIS lookup timed out. Please try again later.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to perform WHOIS lookup' },
      { status: 500 }
    );
  }
}
