import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/middleware";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type");

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const where: any = {};
    if (type) where.type = type;

    const [activities, total] = await Promise.all([
      prisma.activityFeed.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityFeed.count({ where })
    ]);

    await prisma.$disconnect();
    return NextResponse.json({ activities, total, pagination: { page, limit } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
    }

    const body = await request.json();
    const { type, title, message, metadata, priority } = body;

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const activity = await prisma.activityFeed.create({
      data: {
        userId: auth.user!.userId,
        type: type || "system",
        title: title || "System Activity",
        message: message || "",
        metadata: metadata ? JSON.stringify(metadata) : null,
        priority: priority || "info",
      }
    });

    await prisma.$disconnect();
    return NextResponse.json({ activity });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
