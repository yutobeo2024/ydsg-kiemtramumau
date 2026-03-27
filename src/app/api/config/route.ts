import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession, ADMIN_COOKIE } from '@/lib/session';
import db from '@/lib/db';

// GET: public – lấy config (số câu hỏi)
export async function GET() {
  const count = (db.prepare(`SELECT value FROM config WHERE key='question_count'`).get() as any)?.value ?? '8';
  const totalQ = (db.prepare(`SELECT COUNT(*) as cnt FROM questions WHERE active=1`).get() as any)?.cnt ?? 0;
  return NextResponse.json({ success: true, questionCount: parseInt(count), totalActive: totalQ });
}

// PUT: admin only – cập nhật config
export async function PUT(req: Request) {
  const cookieStore = await cookies();
  if (!validateSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { questionCount } = await req.json();
  const n = Math.max(1, Math.min(50, parseInt(questionCount) || 8));
  db.prepare(`INSERT OR REPLACE INTO config (key, value) VALUES ('question_count', ?)`).run(String(n));
  return NextResponse.json({ success: true, questionCount: n });
}
