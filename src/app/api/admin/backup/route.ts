import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";
import { db } from '@/lib/db';
import { appConfig } from "@/lib/config/app.config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
    }

    const backupDir = `${appConfig.projectRoot}/backups`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = "backup-" + timestamp + ".dump";

    const dbUrl = process.env.DATABASE_URL || "";
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!match) {
      return NextResponse.json({ error: "Invalid DATABASE_URL" }, { status: 500 });
    }

    const user = match[1];
    const pass = match[2];
    const host = match[3];
    const port = match[4];
    const database = match[5];
    const filepath = backupDir + "/" + filename;

    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    await execAsync("PGPASSWORD=" + pass + " pg_dump -h " + host + " -p " + port + " -U " + user + " -F c -b -f " + filepath + " " + database, { timeout: 120000 });

    const fs = await import("fs/promises");
    const stats = await fs.stat(filepath);
    
    await db.databaseBackup.create({
      data: { filePath: filepath, fileSize: stats.size, type: "full", status: "completed", tablesIncluded: "[]" }
    });
    return NextResponse.json({ 
      message: "Backup created successfully", filePath: filepath, fileSize: stats.size,
      sizeFormatted: (stats.size / 1024 / 1024).toFixed(2) + " MB"
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
