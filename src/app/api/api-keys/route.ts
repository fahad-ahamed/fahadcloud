import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import crypto from "crypto";
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const body = await request.json();
    const { name, permissions, expiresAt } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const apiKey = "fc_" + crypto.randomBytes(24).toString("hex");
    const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const key = await db.apiKey.create({
      data: {
        name,
        keyHash: apiKeyHash,
        keyPrefix: apiKey.substring(0, 12),
        permissions: JSON.stringify(permissions || ["read"]),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: auth.user!.userId,
        lastUsedAt: null
      }
    });
    
    return NextResponse.json({ 
      apiKey,
      key: {
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        permissions: key.permissions,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt
      },
      message: "API key created. Save this key - it will not be shown again."
    });
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

    const keys = await db.apiKey.findMany({
      where: { userId: auth.user!.userId },
      select: { id: true, name: true, keyPrefix: true, permissions: true, expiresAt: true, lastUsedAt: true, createdAt: true, active: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ apiKeys: keys });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");
    if (!keyId) return NextResponse.json({ error: "Key ID is required" }, { status: 400 });

    await db.apiKey.deleteMany({ where: { id: keyId, userId: auth.user!.userId } });
    
    return NextResponse.json({ message: "API key deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
