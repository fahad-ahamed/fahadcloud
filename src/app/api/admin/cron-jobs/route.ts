import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";
import { db } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobs = await db.cronJob.findMany({ orderBy: { createdAt: "desc" } });
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

    const job = await db.cronJob.create({ data: { name, schedule, command, timeout: timeout || 300 } });
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

    await db.cronJob.delete({ where: { id } });
    return NextResponse.json({ message: "Cron job deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
