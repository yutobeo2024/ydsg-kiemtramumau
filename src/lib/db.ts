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
    score INTEGER,
    passed INTEGER,
    videoUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
