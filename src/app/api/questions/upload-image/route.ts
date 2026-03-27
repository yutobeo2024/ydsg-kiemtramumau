import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession, ADMIN_COOKIE } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (!validateSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    if (!file) return NextResponse.json({ error: 'Không có file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `question-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'images');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ success: true, url: `/images/${filename}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
