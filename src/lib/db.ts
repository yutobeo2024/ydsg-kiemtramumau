import Database from 'better-sqlite3';
import path from 'path';

// Lưu database.sqlite vào ngay thư mục gốc của Next.js (webapp)
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Khởi tạo bảng nếu chưa có
db.exec(`
  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticketId TEXT,
    fullName TEXT,
    dob TEXT,
    cccd TEXT,
    examDate TEXT,
    startTime TEXT,
    score INTEGER,
    passed INTEGER,
    videoUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: thêm cột mới nếu database cũ chưa có
// SQLite không hỗ trợ "ADD COLUMN IF NOT EXISTS" nên dùng try/catch
const migrations = [
  `ALTER TABLE tests ADD COLUMN cccd TEXT`,
  `ALTER TABLE tests ADD COLUMN examDate TEXT`,
  `ALTER TABLE tests ADD COLUMN startTime TEXT`,
];
for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch {
    // Cột đã tồn tại, bỏ qua
  }
}

export default db;
