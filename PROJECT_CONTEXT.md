# PROJECT CONTEXT

## Project Overview
**YDSG - Kiểm Tra Sắc Giác** (Color Blindness Test) is a Next.js web application designed to administer automated Ishihara color blindness tests. It ensures the integrity of health check records by recording the user's face and screen during the test to prevent cheating. It features a real-time QR scanner for patient data entry, an automated testing interface with a virtual keyboard, and an administrative dashboard for result review and system configuration.

## Tech Stack
- **Framework**: Next.js 16.2 (App Router, Turbopack)
- **Frontend**: React 19.2, Tailwind CSS v4, Framer Motion, Lucide React, @zxing/browser (QR scanning)
- **Backend**: Next.js API Routes (using httpOnly cookies for authentication)
- **Database**: SQLite (via `better-sqlite3`)
- **Language**: TypeScript
- **Runtime (production)**: Node 20+ (required by Next.js 16)

## Key Features
1. **Real-time QR Scanner (`/`)**: Real webcam-based QR decoding (using `@zxing/browser`). Automatically parses patient data from codes formatted as `Date-CCCD`.
2. **Automated Ishihara Test (`/test`)**: Administers the color blindness test using standard Ishihara plates with an enlarged layout (v3).
3. **Two-step Consent Flow**: Staff cấp quyền screen-share trước → đưa máy cho bệnh nhân đọc cam kết & xác nhận → vào bài test (không còn popup browser ở giữa).
4. **Virtual Numeric Keyboard**: Patients answer by typing numbers via an on-screen virtual keyboard (numbers 1-9) or selecting "No number visible," ensuring consistency.
5. **Anti-Cheat Monitoring**: Records the user's camera (Picture-in-Picture overlay) and screen during the test, securely uploading the video at the end.
6. **Admin Dashboard (`/admin`)**: A comprehensive interface to view all test records, filter by date, search, and detect duplicate patient records (highlighted in red).
7. **Alerts Dashboard (`/alerts`)**: Dedicated view for failed tests (< 4/8 score) with detailed timestamps (QR Date, Start Time).
8. **System Configuration (`/config`)**: Admin-only page (secured with httpOnly cookies) to manage questions (CRUD), upload plate images, and set the number of questions per test.

## Project Structure
- `src/app/`: Next.js App Router root containing all pages.
  - `src/app/page.tsx`: Patient check-in with QR scanner.
  - `src/app/test/`: Route for the automated test with virtual keyboard logic.
  - `src/app/admin/`: Admin dashboard for all records.
  - `src/app/alerts/`: Alerts dashboard for failed records.
  - `src/app/config/`: Admin configuration for questions and system settings.
  - `src/app/api/`: API endpoints.
    - `src/app/api/auth/`: Secure login/session management.
    - `src/app/api/questions/`: Question CRUD and image upload.
    - `src/app/api/config/`: System configuration settings.
    - `src/app/api/tests/`: Endpoints to get/submit test records.
    - `src/app/api/upload/`: Video upload endpoint (writes to `VIDEO_DIR`, inserts test record).
    - `src/app/api/videos/[filename]/`: Streams uploaded videos from `VIDEO_DIR` (Turbopack does not serve runtime-added files in `public/`, so videos are served via this API route).
- `src/lib/`: Reusable library functions.
  - `db.ts`: SQLite database initialization and automatic migrations. Reads path from `DB_PATH` env var (fallback: `database.sqlite` at repo root).
  - `session.ts`: Server-side session management (tokens).
- `src/components/`: Reusable React components (e.g., `Header.tsx`).
- `scripts/Launch-YDSG.ps1`: Kiosk launcher for Windows clinic PCs (Chrome `--kiosk --app=URL`).
- `docs/DEPLOY-VPS-CLOUDFLARE.md`: Reusable VPS + Cloudflare Tunnel + Access deployment guide.
- `.env.example`: Template for production env vars.

## Environment Variables
| Var | Default | Purpose |
|---|---|---|
| `DB_PATH` | `<repo>/database.sqlite` | SQLite file location. On VPS set to a path outside the repo so `git pull` doesn't touch it. |
| `VIDEO_DIR` | `<repo>/public/uploads/videos` | Where uploaded videos are stored. On VPS keep outside the repo. |
| `ADMIN_USERNAME` | `admin` | Admin login username. |
| `ADMIN_PASSWORD` | `310516` | Admin login password. **MUST be changed for production.** |
| `PORT` | `3000` | Next.js port. |

## Setup & Run

### Local development
1. `npm install`
2. `npm run dev`
3. Access at `http://localhost:3000`. Admin credentials: `admin` / `310516`.

### Production deployment
See [docs/DEPLOY-VPS-CLOUDFLARE.md](docs/DEPLOY-VPS-CLOUDFLARE.md) for step-by-step VPS + Cloudflare Tunnel + Access setup.

**Production status (as of 2026-04-29):**
- Deployed at `https://kiemtramumau.ydsgchatbot.io.vn`
- Behind Cloudflare Access (email allowlist + One-time PIN, 7-day session)
- VPS: Ubuntu 24.04, Node 20 via nvm, PM2 process `ydsg-mumau`
- Data dirs (outside repo): `~/ydsg-data/db.sqlite`, `~/ydsg-data/videos/`
- Sharing same Cloudflare Tunnel as the chatbot project (different hostname)

### Update production
```bash
ssh deploy@VPS
cd ~/ydsg-mumau
git pull origin master      # branch is master, NOT main
rm -rf .next dist
nvm exec 20 npm ci
nvm exec 20 npm run build
pm2 restart ydsg-mumau
```

⚠️ **Important constraints (Next.js 16 + Turbopack):**
- Symlinks in `public/` pointing outside the project root cause build to fail. Don't use them.
- Files added to `public/` after `next build` are NOT served — Turbopack snapshots `public/` at build time. Use the `/api/videos/[filename]` route pattern for any runtime-uploaded content.
- `pm2 restart` does NOT update env vars. To change env (e.g., admin password), `pm2 delete` then `pm2 start --update-env` again.
