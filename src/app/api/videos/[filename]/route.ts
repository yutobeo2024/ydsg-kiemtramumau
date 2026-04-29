import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Chống path traversal
  if (!/^[\w.\-]+\.(webm|mp4)$/i.test(filename) || filename.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const videoDir =
    process.env.VIDEO_DIR ||
    path.join(process.cwd(), 'public', 'uploads', 'videos');
  const filePath = path.join(videoDir, filename);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const buffer = await fs.readFile(filePath);

  return new Response(buffer as any, {
    status: 200,
    headers: {
      'Content-Type': filename.toLowerCase().endsWith('.mp4')
        ? 'video/mp4'
        : 'video/webm',
      'Content-Length': buffer.length.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=14400',
    },
  });
}
