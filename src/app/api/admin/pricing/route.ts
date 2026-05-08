import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminLogRepository } from '@/lib/repositories';
import { requireAdmin, requireSuperAdmin, getClientIp, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const pricing = await db.tldPricing.findMany({
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
        transferPriceBDT: Math.round(p.transferPrice * 110 * 100) / 100,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Admin pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to get pricing' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { id, registerPrice, renewPrice, transferPrice, category, promo, promoPrice, isFree } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Pricing ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.tldPricing.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Pricing entry not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (registerPrice !== undefined) updateData.registerPrice = registerPrice;
    if (renewPrice !== undefined) updateData.renewPrice = renewPrice;
    if (transferPrice !== undefined) updateData.transferPrice = transferPrice;
    if (category !== undefined) updateData.category = category;
    if (promo !== undefined) updateData.promo = promo;
    if (promoPrice !== undefined) updateData.promoPrice = promoPrice;
    if (isFree !== undefined) updateData.isFree = isFree;

    const updated = await db.tldPricing.update({
      where: { id },
      data: updateData,
    });

    const ip = getClientIp(request);

    // Log admin action
    await adminLogRepository.logAction({
      adminId: auth.user!.userId,
      action: 'pricing_updated',
      targetType: 'tldPricing',
      targetId: id,
      details: JSON.stringify({
        tld: existing.tld,
        previousPrice: existing.registerPrice,
        newPrice: updateData.registerPrice || existing.registerPrice,
        updates: updateData,
      }),
      ipAddress: ip,
    });

    return NextResponse.json({
      message: 'Pricing updated successfully',
      pricing: updated,
    });
  } catch (error: any) {
    console.error('Update pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { tld, registerPrice, renewPrice, transferPrice = 0, category = 'popular', promo = false, promoPrice = null, isFree = false } = body;

    if (!tld || registerPrice === undefined || renewPrice === undefined) {
      return NextResponse.json(
        { error: 'TLD, register price, and renew price are required' },
        { status: 400 }
      );
    }

    // Ensure TLD starts with a dot
    const formattedTld = tld.startsWith('.') ? tld : '.' + tld;

    // Check if TLD already exists
    const existing = await db.tldPricing.findUnique({ where: { tld: formattedTld } });
    if (existing) {
      return NextResponse.json(
        { error: `Pricing for ${formattedTld} already exists` },
        { status: 409 }
      );
    }

    const pricing = await db.tldPricing.create({
      data: {
        tld: formattedTld,
        registerPrice,
        renewPrice,
        transferPrice,
        category,
        promo,
        promoPrice,
        isFree,
      },
    });

    const ip = getClientIp(request);

    // Log admin action
    await adminLogRepository.logAction({
      adminId: auth.user!.userId,
      action: 'pricing_created',
      targetType: 'tldPricing',
      targetId: pricing.id,
      details: JSON.stringify({
        tld: formattedTld,
        registerPrice,
        renewPrice,
        category,
      }),
      ipAddress: ip,
    });

    return NextResponse.json({
      message: 'TLD pricing added successfully',
      pricing,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to add pricing' },
      { status: 500 }
    );
  }
}
