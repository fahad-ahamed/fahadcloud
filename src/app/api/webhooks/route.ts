import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/middleware";
import { db } from '@/lib/db';

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

    const webhook = await db.webhook.create({
      data: {
        url,
        events: JSON.stringify(events),
        secret: secret || crypto.randomUUID(),
        description: description || "",
        active: active !== false,
        userId: auth.user!.userId
      }
    });

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

    const webhooks = await db.webhook.findMany({
      where: { userId: auth.user!.userId },
      select: { id: true, url: true, events: true, description: true, active: true, createdAt: true }
    });

    return NextResponse.json({ webhooks });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
