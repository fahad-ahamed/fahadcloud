import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const rules = await prisma.firewallRule.findMany({ orderBy: { priority: "asc" } });
    await prisma.$disconnect();
    return NextResponse.json({ rules });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });

    const body = await request.json();
    const { name, type, ip, port, protocol, priority } = body;
    if (!name || !type) return NextResponse.json({ error: "name and type are required" }, { status: 400 });

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const rule = await prisma.firewallRule.create({ data: { name, type, ip, port, protocol, priority: priority || 100 } });
    await prisma.$disconnect();
    return NextResponse.json({ rule, message: "Firewall rule created" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.firewallRule.delete({ where: { id } });
    await prisma.$disconnect();
    return NextResponse.json({ message: "Firewall rule deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
