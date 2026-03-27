import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession, ADMIN_COOKIE } from '@/lib/session';
import db from '@/lib/db';

// GET admin: trả về TẤT CẢ câu hỏi (kể cả inactive), không shuffle
export async function GET() {
  const cookieStore = await cookies();
  if (!validateSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const all = db.prepare(`SELECT * FROM questions ORDER BY sortOrder, id`).all() as any[];
  return NextResponse.json({
    success: true,
    data: all.map(q => ({ ...q, options: JSON.parse(q.options) }))
  });
}
