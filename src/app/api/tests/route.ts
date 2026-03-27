import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Lấy toàn bộ danh sách kết quả (Sắp xếp mới nhất lên đầu)
    const stmt = db.prepare(`SELECT * FROM tests ORDER BY createdAt DESC`);
    const rows = stmt.all();
    
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("Lỗi lấy dữ liệu Database:", error);
    return NextResponse.json({ error: 'Lỗi server nội bộ: ' + error.message }, { status: 500 });
  }
}
