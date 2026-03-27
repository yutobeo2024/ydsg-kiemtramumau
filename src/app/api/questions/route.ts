import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession, ADMIN_COOKIE } from '@/lib/session';
import db from '@/lib/db';

// GET: public – trả về câu hỏi active cho bài kiểm tra (random theo config)
export async function GET() {
  const count = parseInt((db.prepare(`SELECT value FROM config WHERE key='question_count'`).get() as any)?.value || '8');
  const all = db.prepare(`SELECT * FROM questions WHERE active=1 ORDER BY sortOrder`).all() as any[];
  // Shuffle
  const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, count);
  return NextResponse.json({
    success: true,
    data: shuffled.map(q => ({ ...q, options: JSON.parse(q.options) })),
    questionCount: count,
    total: all.length
  });
}

// POST: admin only – thêm câu hỏi mới
export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (!validateSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { image, options, correct } = await req.json();
    if (!image || !options || !correct || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'Thiếu thông tin câu hỏi' }, { status: 400 });
    }
    const maxOrder = (db.prepare(`SELECT MAX(sortOrder) as m FROM questions`).get() as any)?.m ?? 0;
    const result = db.prepare(`INSERT INTO questions (image, options, correct, active, sortOrder) VALUES (?, ?, ?, 1, ?)`)
      .run(image, JSON.stringify(options), correct, maxOrder + 1);
    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
