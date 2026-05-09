import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireSuperAdmin, authErrorResponse, getClientIp } from '@/lib/middleware';
import { adminLogRepository } from '@/lib/repositories';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = '/home/fahad/fahadcloud';

// Safety: directories that should NEVER be deleted or modified carelessly
const PROTECTED_PATHS = [
  '/home/fahad/fahadcloud/db/fahadcloud.db',
  '/home/fahad/fahadcloud/db/fahadcloud.db-journal',
];

function safePath(inputPath: string): string {
  // Resolve and ensure the path is within the project
  const resolved = path.resolve(PROJECT_ROOT, inputPath);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error('Access denied: path outside project directory');
  }
  return resolved;
}

function getFileTree(dirPath: string, depth: number = 0, maxDepth: number = 2): any {
  const items: any[] = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      // Skip node_modules at depth > 0 and .next/cache
      if (entry.name === 'node_modules' && depth > 0) continue;
      if (entry.name === '.cache') continue;
      
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(PROJECT_ROOT, fullPath);
      
      if (entry.isDirectory()) {
        const item: any = {
          name: entry.name,
          path: relativePath,
          type: 'directory',
        };
        if (depth < maxDepth) {
          item.children = getFileTree(fullPath, depth + 1, maxDepth);
        }
        items.push(item);
      } else {
        try {
          const stat = fs.statSync(fullPath);
          items.push({
            name: entry.name,
            path: relativePath,
            type: 'file',
            size: stat.size,
            modified: stat.mtime.toISOString(),
            extension: path.extname(entry.name),
          });
        } catch {
          items.push({ name: entry.name, path: relativePath, type: 'file', error: 'Cannot read' });
        }
      }
    }
  } catch {}
  return items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// GET /api/admin/files?path=&action=list|read|tree
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'tree';
    const filePath = searchParams.get('path') || '';

    const resolvedPath = safePath(filePath || '');

    if (action === 'tree') {
      const tree = getFileTree(PROJECT_ROOT, 0, 3);
      return NextResponse.json({ tree, root: PROJECT_ROOT });
    }

    if (action === 'list') {
      if (!fs.existsSync(resolvedPath)) {
        return NextResponse.json({ error: 'Path does not exist' }, { status: 404 });
      }
      const stat = fs.statSync(resolvedPath);
      if (!stat.isDirectory()) {
        return NextResponse.json({ error: 'Path is not a directory' }, { status: 400 });
      }
      const items = getFileTree(resolvedPath, 0, 1);
      return NextResponse.json({ items, path: filePath });
    }

    if (action === 'read') {
      if (!fs.existsSync(resolvedPath)) {
        return NextResponse.json({ error: 'File does not exist' }, { status: 404 });
      }
      const stat = fs.statSync(resolvedPath);
      if (stat.isDirectory()) {
        return NextResponse.json({ error: 'Path is a directory, not a file' }, { status: 400 });
      }
      // Limit file size to 1MB
      if (stat.size > 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 1MB)', size: stat.size }, { status: 400 });
      }
      const content = fs.readFileSync(resolvedPath, 'utf-8');
      return NextResponse.json({
        content,
        path: filePath,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        extension: path.extname(resolvedPath),
      });
    }

    if (action === 'download') {
      if (!fs.existsSync(resolvedPath)) {
        return NextResponse.json({ error: 'File does not exist' }, { status: 404 });
      }
      const stat = fs.statSync(resolvedPath);
      if (stat.isDirectory()) {
        return NextResponse.json({ error: 'Cannot download directory' }, { status: 400 });
      }
      const buffer = fs.readFileSync(resolvedPath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${path.basename(resolvedPath)}"`,
          'Content-Length': stat.size.toString(),
        },
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/files - Create file/folder, Write file
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { action, path: filePath, content, type } = body;

    if (!filePath) return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    const resolvedPath = safePath(filePath);

    const ip = getClientIp(request);

    if (action === 'create_file') {
      if (fs.existsSync(resolvedPath)) {
        return NextResponse.json({ error: 'File already exists' }, { status: 400 });
      }
      // Ensure parent directory exists
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
      fs.writeFileSync(resolvedPath, content || '', 'utf-8');
      await adminLogRepository.logAction({
        adminId: auth.user!.userId, action: 'file_created', targetType: 'file',
        targetId: filePath, details: JSON.stringify({ path: filePath, type: 'file' }), ipAddress: ip,
      });
      return NextResponse.json({ message: 'File created successfully', path: filePath });
    }

    if (action === 'create_folder') {
      if (fs.existsSync(resolvedPath)) {
        return NextResponse.json({ error: 'Folder already exists' }, { status: 400 });
      }
      fs.mkdirSync(resolvedPath, { recursive: true });
      await adminLogRepository.logAction({
        adminId: auth.user!.userId, action: 'folder_created', targetType: 'file',
        targetId: filePath, details: JSON.stringify({ path: filePath, type: 'folder' }), ipAddress: ip,
      });
      return NextResponse.json({ message: 'Folder created successfully', path: filePath });
    }

    if (action === 'write') {
      // Check protected paths
      if (PROTECTED_PATHS.includes(resolvedPath)) {
        return NextResponse.json({ error: 'This file is protected and cannot be modified through the admin panel' }, { status: 403 });
      }
      // Ensure parent directory exists
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
      // Create backup before writing
      if (fs.existsSync(resolvedPath)) {
        const backupPath = resolvedPath + '.backup.' + Date.now();
        fs.copyFileSync(resolvedPath, backupPath);
      }
      fs.writeFileSync(resolvedPath, content || '', 'utf-8');
      await adminLogRepository.logAction({
        adminId: auth.user!.userId, action: 'file_updated', targetType: 'file',
        targetId: filePath, details: JSON.stringify({ path: filePath, size: (content || '').length }), ipAddress: ip,
      });
      return NextResponse.json({ message: 'File saved successfully', path: filePath });
    }

    if (action === 'rename') {
      const { newPath } = body;
      if (!newPath) return NextResponse.json({ error: 'New path is required' }, { status: 400 });
      const resolvedNewPath = safePath(newPath);
      if (!fs.existsSync(resolvedPath)) {
        return NextResponse.json({ error: 'Source does not exist' }, { status: 404 });
      }
      if (fs.existsSync(resolvedNewPath)) {
        return NextResponse.json({ error: 'Destination already exists' }, { status: 400 });
      }
      fs.mkdirSync(path.dirname(resolvedNewPath), { recursive: true });
      fs.renameSync(resolvedPath, resolvedNewPath);
      await adminLogRepository.logAction({
        adminId: auth.user!.userId, action: 'file_renamed', targetType: 'file',
        targetId: filePath, details: JSON.stringify({ from: filePath, to: newPath }), ipAddress: ip,
      });
      return NextResponse.json({ message: 'Renamed successfully', path: newPath });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/files?path=xxx
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');

    if (!filePath) return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    const resolvedPath = safePath(filePath);

    // Protect critical paths
    if (PROTECTED_PATHS.includes(resolvedPath)) {
      return NextResponse.json({ error: 'This file is protected and cannot be deleted' }, { status: 403 });
    }

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'Path does not exist' }, { status: 404 });
    }

    const stat = fs.statSync(resolvedPath);
    const ip = getClientIp(request);

    // Create backup before deleting
    const backupDir = '/home/fahad/fahadcloud/.admin-backups';
    fs.mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `${path.basename(resolvedPath)}.${Date.now()}.bak`);
    
    try {
      if (stat.isDirectory()) {
        // Backup directory (simple - just log it)
        await adminLogRepository.logAction({
          adminId: auth.user!.userId, action: 'folder_deleted', targetType: 'file',
          targetId: filePath, details: JSON.stringify({ path: filePath, wasDirectory: true }), ipAddress: ip,
        });
        fs.rmSync(resolvedPath, { recursive: true, force: true });
      } else {
        fs.copyFileSync(resolvedPath, backupPath);
        await adminLogRepository.logAction({
          adminId: auth.user!.userId, action: 'file_deleted', targetType: 'file',
          targetId: filePath, details: JSON.stringify({ path: filePath, backup: backupPath }), ipAddress: ip,
        });
        fs.unlinkSync(resolvedPath);
      }
    } catch (e: any) {
      return NextResponse.json({ error: `Failed to delete: ${e.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Deleted successfully', path: filePath });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
