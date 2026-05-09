import { ActivityLog } from '@/lib/activity-logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { readdir, stat, unlink, rm } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const directory = searchParams.get('directory') || '';
    const hostingEnvId = searchParams.get('hostingEnvId');

    const where: any = { userId: currentUser.userId };
    if (hostingEnvId) where.hostingEnvId = hostingEnvId;
    if (directory) {
      where.path = { startsWith: directory };
    }

    const fileEntries = await db.fileEntry.findMany({
      where,
      orderBy: [{ isDirectory: 'desc' }, { name: 'asc' }],
    });

    // Also try to list from actual filesystem
    const baseDir = `/home/fahad/hosting/${currentUser.userId}`;
    const listDir = path.join(baseDir, directory.replace(/\.\./g, ''));
    let fileSystemEntries: any[] = [];

    try {
      const entries = await readdir(listDir, { withFileTypes: true });
      fileSystemEntries = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(listDir, entry.name);
          try {
            const stats = await stat(fullPath);
            return {
              name: entry.name,
              isDirectory: entry.isDirectory(),
              size: stats.size,
              modifiedAt: stats.mtime,
              path: path.join(directory, entry.name),
            };
          } catch {
            return null;
          }
        })
      );
      fileSystemEntries = fileSystemEntries.filter(Boolean);
    } catch {
      // Directory may not exist yet
    }

    const user = await db.user.findUnique({
      where: { id: currentUser.userId },
      select: { storageUsed: true, storageLimit: true },
    });

    return NextResponse.json({
      files: fileEntries,
      fileSystemEntries,
      storage: {
        used: user?.storageUsed || 0,
        limit: user?.storageLimit || 0,
        percentage: user ? Math.round((user.storageUsed / user.storageLimit) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error('List storage error:', error);
    return NextResponse.json(
      { error: 'Failed to list storage files' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');
    const filePath = searchParams.get('path');

    if (!fileId && !filePath) {
      return NextResponse.json(
        { error: 'fileId or path parameter is required' },
        { status: 400 }
      );
    }

    // Find file entry in database
    let fileEntry = null;
    if (fileId) {
      fileEntry = await db.fileEntry.findFirst({
        where: { id: fileId, userId: currentUser.userId },
      });
    } else if (filePath) {
      fileEntry = await db.fileEntry.findFirst({
        where: { path: filePath, userId: currentUser.userId },
      });
    }

    // Delete from filesystem
    if (fileEntry) {
      const fullPath = `/home/fahad/hosting/${currentUser.userId}/${fileEntry.path}`;
      try {
        if (fileEntry.isDirectory) {
          await rm(fullPath, { recursive: true, force: true });
        } else {
          await unlink(fullPath);
        }
      } catch {
        // File might not exist on disk, continue with DB cleanup
      }

      // Update user storage usage
      await db.user.update({
        where: { id: currentUser.userId },
        data: { storageUsed: { decrement: fileEntry.size } },
      });

      // Delete from database
      await db.fileEntry.delete({ where: { id: fileEntry.id } });
    } else if (filePath) {
      // Delete directly from filesystem if not in DB
      const sanitizedPath = filePath.replace(/\.\./g, '');
      const fullPath = `/home/fahad/hosting/${currentUser.userId}/${sanitizedPath}`;
      try {
        const stats = await stat(fullPath);
        if (stats.isDirectory()) {
          await rm(fullPath, { recursive: true, force: true });
        } else {
          await unlink(fullPath);
          await db.user.update({
            where: { id: currentUser.userId },
            data: { storageUsed: { decrement: stats.size } },
          });
        }
      } catch {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Delete storage file error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
