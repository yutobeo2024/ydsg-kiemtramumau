import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import db from '@/lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const file = formData.get('video') as Blob | null;
    const ticketId = formData.get('ticketId') as string || `YDSG-${Math.floor(Math.random() * 900000)}`;
    const fullName = formData.get('fullName') as string || "Chưa nhập tên";
    const dob = formData.get('dob') as string;
    const scoreVal = parseInt(formData.get('score') as string || '0', 10);
    const passed = scoreVal >= 4 ? 1 : 0;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy File Video đính kèm' }, { status: 400 });
    }

    // 1. Lưu file Video vào ổ đĩa ảo VPS (mình đưa vào public/uploads)
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    await fs.mkdir(uploadDir, { recursive: true });

    const safeFilename = `${ticketId}-${Date.now()}.webm`;
    const filePath = path.join(uploadDir, safeFilename);

    await fs.writeFile(filePath, buffer);

    const videoUrl = `/uploads/videos/${safeFilename}`;

    // 2. Chèn thông tin vào Database SQLite
    const stmt = db.prepare(`
      INSERT INTO tests (ticketId, fullName, dob, score, passed, videoUrl)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(ticketId, fullName, dob, scoreVal, passed, videoUrl);

    return NextResponse.json({ success: true, videoUrl });
  } catch (error: any) {
    console.error("Upload Endpoint Error:", error);
    return NextResponse.json({ error: 'Lỗi server nội bộ: ' + error.message }, { status: 500 });
  }
}
