# PROJECT CONTEXT

## Project Overview
**YDSG - Kiểm Tra Sắc Giác** (Color Blindness Test) is a Next.js web application designed to administer automated Ishihara color blindness tests. It ensures the integrity of health check records by recording the user's face and screen during the test to prevent cheating. It features a real-time QR scanner for patient data entry, an automated testing interface with a virtual keyboard, and an administrative dashboard for result review and system configuration.

## Tech Stack
- **Framework**: Next.js 16.2 (App Router)
- **Frontend**: React 19.2, Tailwind CSS v4, Framer Motion, Lucide React, @zxing/browser (QR scanning)
- **Backend**: Next.js API Routes (using httpOnly cookies for authentication)
- **Database**: SQLite (via `better-sqlite3`)
- **Language**: TypeScript

## Key Features
1. **Real-time QR Scanner (`/`)**: Real webcam-based QR decoding (using `@zxing/browser`). Automatically parses patient data from codes formatted as `Date-CCCD`.
2. **Automated Ishihara Test (`/test`)**: Administers the color blindness test using standard Ishihara plates with an enlarged layout (v3).
3. **Virtual Numeric Keyboard**: Patients answer by typing numbers via an on-screen virtual keyboard (numbers 1-9) or selecting "No number visible," ensuring consistency.
4. **Anti-Cheat Monitoring**: Records the user's camera (Picture-in-Picture overlay) and screen during the test, securely uploading the video at the end.
5. **Admin Dashboard (`/admin`)**: A comprehensive interface to view all test records, filter by date, search, and detect duplicate patient records (highlighted in red).
6. **Alerts Dashboard (`/alerts`)**: Dedicated view for failed tests (< 4/8 score) with detailed timestamps (QR Date, Start Time).
7. **System Configuration (`/config`)**: Admin-only page (secured with httpOnly cookies) to manage questions (CRUD), upload plate images, and set the number of questions per test.

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
- `src/lib/`: Reusable library functions.
  - `db.ts`: SQLite database initialization and automatic migrations.
  - `session.ts`: Server-side session management (tokens).
- `src/components/`: Reusable React components (e.g., `Header.tsx`).
- `database.sqlite`: Local database created at the project root.

## Setup & Run Instructions
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Access at `http://localhost:3000`. Admin credentials: `admin` / `310516`.
