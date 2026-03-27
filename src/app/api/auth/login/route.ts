import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession, ADMIN_COOKIE } from '@/lib/session';

// Credentials stored SERVER-SIDE ONLY — never bundled into client JS
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '310516';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = createSession();
      const cookieStore = await cookies();
      cookieStore.set(ADMIN_COOKIE, token, {
        httpOnly: true,           // Cannot be read by JS / F12 console
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60,     // 8 hours
        path: '/'
      });
      return NextResponse.json({ success: true });
    }
    // Generic error to avoid username enumeration
    return NextResponse.json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 400 });
  }
}
