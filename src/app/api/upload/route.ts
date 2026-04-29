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
    const cccd = formData.get('cccd') as string || '';
    const examDate = formData.get('examDate') as string || '';
    const startTime = formData.get('startTime') as string || '';
    const scoreVal = parseInt(formData.get('score') as string || '0', 10);
    const passed = scoreVal >= 4 ? 1 : 0;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy File Video đính kèm' }, { status: 400 });
    }

    // 1. Lưu file Video. Mặc định trong public/uploads/videos.
    // Trên VPS, set VIDEO_DIR=/var/lib/ydsg/videos và symlink vào public/uploads/videos.
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = process.env.VIDEO_DIR || path.join(process.cwd(), 'public', 'uploads', 'videos');
    await fs.mkdir(uploadDir, { recursive: true });

    // Chỉ giữ A-Z a-z 0-9 _ -. Các ký tự khác (khoảng trắng, dấu phẩy, unicode...) → '_'
    // để filename match regex của /api/videos/[filename] khi serve lại.
    const safeId = ticketId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80) || 'video';
    const safeFilename = `${safeId}-${Date.now()}.webm`;
    const filePath = path.join(uploadDir, safeFilename);

    await fs.writeFile(filePath, buffer);

    const videoUrl = `/api/videos/${safeFilename}`;

    // 2. Chèn thông tin vào Database SQLite
    const stmt = db.prepare(`
      INSERT INTO tests (ticketId, fullName, dob, cccd, examDate, startTime, score, passed, videoUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(ticketId, fullName, dob, cccd, examDate, startTime, scoreVal, passed, videoUrl);

    return NextResponse.json({ success: true, videoUrl });
  } catch (error: any) {
    console.error("Upload Endpoint Error:", error);
    return NextResponse.json({ error: 'Lỗi server nội bộ: ' + error.message }, { status: 500 });
  }
}
