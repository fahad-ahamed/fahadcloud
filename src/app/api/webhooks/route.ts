import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/middleware";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
    }

    const body = await request.json();
    const { url, events, secret, description, active } = body;

    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: "url and events array are required" }, { status: 400 });
    }

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const webhook = await prisma.webhook.create({
      data: {
        url,
        events: JSON.stringify(events),
        secret: secret || crypto.randomUUID(),
        description: description || "",
        active: active !== false,
        userId: auth.user!.userId
      }
    });

    await prisma.$disconnect();
    return NextResponse.json({ webhook, message: "Webhook created successfully" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const webhooks = await prisma.webhook.findMany({
      where: { userId: auth.user!.userId },
      select: { id: true, url: true, events: true, description: true, active: true, createdAt: true }
    });

    await prisma.$disconnect();
    return NextResponse.json({ webhooks });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
