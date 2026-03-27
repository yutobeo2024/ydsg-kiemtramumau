import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession, ADMIN_COOKIE } from '@/lib/session';
import db from '@/lib/db';

async function checkAdmin() {
  const cookieStore = await cookies();
  return validateSession(cookieStore.get(ADMIN_COOKIE)?.value);
}

// GET: lấy 1 câu hỏi theo id (admin)
export async function GET(_req: Request, ctx: RouteContext<'/api/questions/[id]'>) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const q = db.prepare(`SELECT * FROM questions WHERE id=?`).get(id) as any;
  if (!q) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  return NextResponse.json({ success: true, data: { ...q, options: JSON.parse(q.options) } });
}

// PUT: cập nhật câu hỏi (admin)
export async function PUT(req: Request, ctx: RouteContext<'/api/questions/[id]'>) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const { image, options, correct, active } = await req.json();
    db.prepare(`UPDATE questions SET image=?, options=?, correct=?, active=? WHERE id=?`)
      .run(image, JSON.stringify(options), correct, active ? 1 : 0, id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: xóa câu hỏi (admin)
export async function DELETE(_req: Request, ctx: RouteContext<'/api/questions/[id]'>) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  db.prepare(`DELETE FROM questions WHERE id=?`).run(id);
  return NextResponse.json({ success: true });
}
