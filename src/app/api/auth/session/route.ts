import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession, destroySession, ADMIN_COOKIE } from '@/lib/session';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) destroySession(token);
  cookieStore.delete(ADMIN_COOKIE);
  return NextResponse.json({ success: true });
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const isAdmin = validateSession(token);
  return NextResponse.json({ isAdmin });
}
