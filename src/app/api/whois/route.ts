import { NextRequest, NextResponse } from 'next/server';

const RDAP_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';

let rdapCache: { data: string[][]; timestamp: number } | null = null;

async function getRdapBootstrap(): Promise<string[][]> {
  if (rdapCache && Date.now() - rdapCache.timestamp < 3600000) {
    return rdapCache.data;
  }
  try {
    const response = await fetch(RDAP_BOOTSTRAP_URL);
    const data = await response.json();
    // IANA format: services is array of [tlds_array, urls_array]
    rdapCache = { data: data.services || [], timestamp: Date.now() };
    return rdapCache.data;
  } catch {
    return [];
  }
}

async function findRdapServer(tld: string): Promise<string | null> {
  const services = await getRdapBootstrap();
  for (const service of services) {
    if (!Array.isArray(service) || service.length < 2) continue;
    const tlds = Array.isArray(service[0]) ? service[0] : [service[0]];
    const urls = Array.isArray(service[1]) ? service[1] : [service[1]];
    for (const serviceTld of tlds) {
      if (serviceTld && typeof serviceTld === 'string' && (serviceTld.toLowerCase() === tld.toLowerCase() ||
          tld.toLowerCase().endsWith('.' + serviceTld.toLowerCase()))) {
        return urls[0] || null;
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

    const tld = parts.slice(-1)[0];

    // Try RDAP lookup
    const rdapServer = await findRdapServer(tld);
    if (!rdapServer) {
      return NextResponse.json(
        { error: `No RDAP server found for .${tld}`, domain: domainLower, available: null },
        { status: 404 }
      );
    }

    // Query RDAP server
    const rdapUrl = `${rdapServer}domain/${domainLower}`;
    const rdapResponse = await fetch(rdapUrl, {
      headers: { Accept: 'application/rdap+json' },
    });

    if (!rdapResponse.ok) {
      if (rdapResponse.status === 404) {
        return NextResponse.json({
          domain: domainLower,
          available: true,
          status: 'available',
          message: `Domain ${domainLower} appears to be available`,
        });
      }
      return NextResponse.json(
        { error: `RDAP lookup failed with status ${rdapResponse.status}` },
        { status: 502 }
      );
    }

    const rdapData = await rdapResponse.json();

    // Extract WHOIS-like info from RDAP
    const result: Record<string, any> = {
      domain: domainLower,
      available: false,
      status: 'registered',
      ldhName: rdapData.ldhName || domainLower,
      handle: rdapData.handle || '',
      events: rdapData.events || [],
      nameservers: (rdapData.nameservers || []).map((ns: any) => ns.ldhName || ''),
      entities: (rdapData.entities || []).map((e: any) => ({
        handle: e.handle || '',
        roles: e.roles || [],
        vcard: e.vcardArray?.[1] || [],
      })),
      secureDNS: rdapData.secureDNS || {},
      remarks: (rdapData.remarks || []).map((r: any) => r.description?.join(' ') || ''),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('WHOIS lookup error:', error.message);
    return NextResponse.json(
      { error: 'Failed to perform WHOIS lookup' },
      { status: 500 }
    );
  }
}


