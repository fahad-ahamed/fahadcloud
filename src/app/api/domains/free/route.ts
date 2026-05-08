import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const freeDomains = [
      { tld: '.fahadcloud.com', name: 'FahadCloud Subdomain', description: 'Free subdomain on FahadCloud', isFree: true, requirements: 'None - instant activation' },
      { tld: '.tk', name: 'Tokelau', description: 'Free domain from Tokelau', isFree: true, requirements: 'Freenom registration' },
      { tld: '.ml', name: 'Mali', description: 'Free domain from Mali', isFree: true, requirements: 'Freenom registration' },
      { tld: '.ga', name: 'Gabon', description: 'Free domain from Gabon', isFree: true, requirements: 'Freenom registration' },
      { tld: '.cf', name: 'Central African Republic', description: 'Free domain from Central African Republic', isFree: true, requirements: 'Freenom registration' },
      { tld: '.eu.org', name: 'EU.org', description: 'Free subdomain from EU.org', isFree: true, requirements: 'Manual approval by EU.org' },
      { tld: '.pp.ua', name: 'PP.UA', description: 'Free subdomain from PP.UA (Ukraine)', isFree: true, requirements: 'SMS verification required' },
    ];

    // Check which ones have pricing entries in the database
    const tldPricing = await db.tldPricing.findMany({
      where: { tld: { in: freeDomains.map(d => d.tld) } },
    });

    const pricingMap = new Map(tldPricing.map(p => [p.tld, p]));

    const results = freeDomains.map(d => ({
      ...d,
      pricing: pricingMap.get(d.tld) || null,
    }));

    return NextResponse.json({ freeDomains: results });
  } catch (error: any) {
    console.error('Free domains error:', error);
    return NextResponse.json(
      { error: 'Failed to get free domain options' },
      { status: 500 }
    );
  }
}
