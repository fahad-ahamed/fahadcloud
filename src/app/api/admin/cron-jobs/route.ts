import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const jobs = await prisma.cronJob.findMany({ orderBy: { createdAt: "desc" } });
    await prisma.$disconnect();
    return NextResponse.json({ cronJobs: jobs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });

    const body = await request.json();
    const { name, schedule, command, timeout } = body;
    if (!name || !schedule || !command) return NextResponse.json({ error: "name, schedule, and command are required" }, { status: 400 });

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const job = await prisma.cronJob.create({ data: { name, schedule, command, timeout: timeout || 300 } });
    await prisma.$disconnect();
    return NextResponse.json({ cronJob: job, message: "Cron job created" });
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
    await prisma.cronJob.delete({ where: { id } });
    await prisma.$disconnect();
    return NextResponse.json({ message: "Cron job deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
