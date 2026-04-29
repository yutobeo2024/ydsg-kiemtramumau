import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// ── Bảng tests ──────────────────────────────────────────────────────────
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
const migrations = [
  `ALTER TABLE tests ADD COLUMN cccd TEXT`,
  `ALTER TABLE tests ADD COLUMN examDate TEXT`,
  `ALTER TABLE tests ADD COLUMN startTime TEXT`,
];
for (const sql of migrations) {
  try { db.exec(sql); } catch { /* đã tồn tại */ }
}

// ── Bảng questions ───────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT NOT NULL,
    options TEXT NOT NULL,
    correct TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    sortOrder INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── Bảng config ──────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

// Seed config mặc định
db.prepare(`INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)`).run('question_count', '8');

// Seed questions nếu bảng trống
const questionCount = (db.prepare(`SELECT COUNT(*) as cnt FROM questions`).get() as any).cnt;
if (questionCount === 0) {
  const seedData = [
    { image: '/images/tam-so-1.jpg',  correct: '12',             options: ['12','21','Không thấy số','7'] },
    { image: '/images/tam-so-2.jpg',  correct: '8',              options: ['8','3','Không thấy số','5'] },
    { image: '/images/tam-so-3.jpg',  correct: '29',             options: ['29','70','Không thấy số','24'] },
    { image: '/images/tam-so-4.jpg',  correct: '5',              options: ['5','2','Không thấy số','8'] },
    { image: '/images/tam-so-5.jpg',  correct: '3',              options: ['3','5','Không thấy số','8'] },
    { image: '/images/tam-so-6.jpg',  correct: '15',             options: ['15','17','Không thấy số','12'] },
    { image: '/images/tam-so-7.jpg',  correct: '74',             options: ['74','21','Không thấy số','47'] },
    { image: '/images/tam-so-8.jpg',  correct: '6',              options: ['6','2','Không thấy số','9'] },
    { image: '/images/tam-so-9.jpg',  correct: '45',             options: ['45','4','Không thấy số','54'] },
    { image: '/images/tam-so-10.jpg', correct: '5',              options: ['5','3','Không thấy số','2'] },
    { image: '/images/tam-so-11.jpg', correct: '7',              options: ['7','1','Không thấy số','4'] },
    { image: '/images/tam-so-12.jpg', correct: '16',             options: ['16','1','Không thấy số','61'] },
    { image: '/images/tam-so-13.jpg', correct: '73',             options: ['73','13','Không thấy số','37'] },
    { image: '/images/tam-so-14.jpg', correct: 'Không thấy số', options: ['Không thấy số','5','3','2'] },
    { image: '/images/tam-so-15.jpg', correct: 'Không thấy số', options: ['Không thấy số','45','15','35'] },
    { image: '/images/tam-so-16.jpg', correct: '26',             options: ['26','6 rõ 2 mờ','2 rõ 6 mờ','Không thấy số'] },
    { image: '/images/tam-so-17.jpg', correct: '42',             options: ['42','2 rõ 4 mờ','4 rõ 2 mờ','Không thấy số'] },
  ];
  const insertQ = db.prepare(`INSERT INTO questions (image, options, correct, active, sortOrder) VALUES (?, ?, ?, 1, ?)`);
  seedData.forEach((q, i) => insertQ.run(q.image, JSON.stringify(q.options), q.correct, i));
}

export default db;
