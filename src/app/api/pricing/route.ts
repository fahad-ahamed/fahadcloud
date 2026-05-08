import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const promo = searchParams.get('promo');

    const where: any = {};
    if (category) where.category = category;
    if (promo === 'true') where.promo = true;

    const pricing = await db.tldPricing.findMany({
      where,
      orderBy: [{ isFree: 'desc' }, { category: 'asc' }, { registerPrice: 'asc' }],
    });

    return NextResponse.json({
      pricing: pricing.map(p => ({
        id: p.id,
        tld: p.tld,
        registerPrice: p.registerPrice,
        renewPrice: p.renewPrice,
        transferPrice: p.transferPrice,
        category: p.category,
        promo: p.promo,
        promoPrice: p.promoPrice,
        isFree: p.isFree,
        registerPriceBDT: Math.round(p.registerPrice * 110 * 100) / 100,
        renewPriceBDT: Math.round(p.renewPrice * 110 * 100) / 100,
      })),
    });
  } catch (error: any) {
    console.error('Get pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to get pricing' },
      { status: 500 }
    );
  }
}
