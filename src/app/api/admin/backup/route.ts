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
    const host = match[3];
    const port = match[4];
    const database = match[5];
    const filepath = backupDir + "/" + filename;

    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    // Use environment variable for password instead of command-line argument
    // This prevents password from being visible in `ps aux`
    const backupEnv: Record<string, string> = {
      PGHOST: host,
      PGPORT: port,
      PGUSER: user,
      PGPASSWORD: match[2],
      PGDATABASE: database,
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
    };
    
    await execAsync(`pg_dump -Fc -f ${filepath}`, {
      timeout: 120000,
      env: backupEnv as any,
    });
    
    const fs = await import("fs/promises");
    await fs.mkdir(backupDir, { recursive: true });
    const stats = await fs.stat(filepath);
    
    await db.databaseBackup.create({
      data: { filePath: filepath, fileSize: stats.size, type: "full", status: "completed", tablesIncluded: "[]" }
    });
    return NextResponse.json({ 
      message: "Backup created successfully", filePath: filepath, fileSize: stats.size,
      sizeFormatted: (stats.size / 1024 / 1024).toFixed(2) + " MB"
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Backup creation failed" }, { status: 500 });
  }
}
