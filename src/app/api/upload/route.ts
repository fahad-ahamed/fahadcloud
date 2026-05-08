import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'text/html', 'text/css', 'text/javascript', 'text/plain',
  'application/javascript',
  'application/json',
  'application/zip',
  'font/woff', 'font/woff2', 'font/ttf', 'font/otf',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/ogg',
];

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(ip, 'file_upload');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many upload requests' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const directory = formData.get('directory') as string || '';
    const hostingEnvId = formData.get('hostingEnvId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Check user storage limit
    const user = await db.user.findUnique({ where: { id: currentUser.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.storageUsed + file.size > user.storageLimit) {
      return NextResponse.json(
        { error: 'Storage limit exceeded. Please free up space or upgrade your plan.' },
        { status: 400 }
      );
    }

    // Sanitize directory path
    const sanitizedDir = directory.replace(/\.\./g, '').replace(/\/\//g, '/');
    const baseDir = `/home/fahad/hosting/${currentUser.userId}`;
    const fullDir = path.join(baseDir, sanitizedDir);

    // Ensure directory exists
    await mkdir(fullDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(fullDir, file.name);
    await writeFile(filePath, buffer);

    // Update user storage usage
    await db.user.update({
      where: { id: currentUser.userId },
      data: { storageUsed: { increment: file.size } },
    });

    // Create file entry in database
    const relativePath = path.join(sanitizedDir, file.name);
    const fileEntry = await db.fileEntry.create({
      data: {
        userId: currentUser.userId,
        hostingEnvId: hostingEnvId || null,
        name: file.name,
        path: relativePath,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        isPublic: false,
        isDirectory: false,
      },
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: {
        id: fileEntry.id,
        name: fileEntry.name,
        path: fileEntry.path,
        size: fileEntry.size,
        mimeType: fileEntry.mimeType,
        createdAt: fileEntry.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
