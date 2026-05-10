import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unread") === "true";

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const where: any = { userId: auth.user!.userId };
    if (unreadOnly) where.read = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId: auth.user!.userId, read: false } })
    ]);

    await prisma.$disconnect();
    return NextResponse.json({ notifications, unreadCount: total, pagination: { page, limit, total: notifications.length } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const { id, ids } = await request.json();

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    if (action === "mark_read") {
      if (ids && Array.isArray(ids)) {
        await prisma.notification.updateMany({ where: { id: { in: ids }, userId: auth.user!.userId }, data: { read: true } });
      } else if (id) {
        await prisma.notification.update({ where: { id, userId: auth.user!.userId }, data: { read: true } });
      }
    } else if (action === "delete") {
      if (ids && Array.isArray(ids)) {
        await prisma.notification.deleteMany({ where: { id: { in: ids }, userId: auth.user!.userId } });
      } else if (id) {
        await prisma.notification.delete({ where: { id, userId: auth.user!.userId } });
      }
    }

    await prisma.$disconnect();
    return NextResponse.json({ message: "Notification updated" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
