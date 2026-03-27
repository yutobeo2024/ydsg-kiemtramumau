# PROJECT CONTEXT

## Project Overview
**YDSG - Kiểm Tra Sắc Giác** (Color Blindness Test) is a Next.js web application designed to administer automated Ishihara color blindness tests. It ensures the integrity of health check records by recording the user's face and screen during the test to prevent cheating. It features a patient check-in portal, an automated testing interface, and an administrative dashboard to manage and review test results.

## Tech Stack
- **Framework**: Next.js 16.2 (App Router)
- **Frontend**: React 19.2, Tailwind CSS v4, Framer Motion (for animations), Lucide React (for icons)
- **Backend**: Next.js API Routes
- **Database**: SQLite (via `better-sqlite3`)
- **Language**: TypeScript

## Key Features
1. **Patient Check-in Portal (`/`)**: Form for patients to enter their details (Name, DOB, Ticket ID) before starting the test. Supports a simulated QR Code scanning feature.
2. **Automated Ishihara Test (`/test`)**: Administers the color blindness test using standard Ishihara plates.
3. **Anti-Cheat Monitoring**: Records the user's camera (Picture-in-Picture) and screen during the test to prevent cheating, securely uploading the video file at the end of the test.
4. **Admin Dashboard (`/admin`)**: A comprehensive interface to view all test records, filter by date, search queries, view test scores/results (Pass/Rối loạn), and play/download the associated monitoring videos.

## Project Structure
- `src/app/`: Next.js App Router root containing all pages.
  - `src/app/page.tsx`: Patient check-in page.
  - `src/app/test/`: Route for the actual Ishihara test application and video recording logic.
  - `src/app/admin/`: Admin dashboard to view submission records.
  - `src/app/api/`: API endpoints.
    - `src/app/api/tests/`: Endpoints to get/submit test records.
    - `src/app/api/upload/`: Endpoints to handle video file uploads.
- `src/data/`: Static data (e.g., Ishihara plates options and questions configuration in `questions.ts`).
- `src/lib/`: Reusable library functions (e.g., `db.ts` for SQLite database connection initialization).
- `src/components/`: Reusable React components (e.g., `Header.tsx`).
- `public/`: Static assets (includes Ishihara test images in `/images/`).
- `database.sqlite`: The local database storing test results (created automatically at the project root).

## Setup & Run Instructions
1. Install dependencies: `npm install`
2. Run the development server: `npm run dev`
3. Open `http://localhost:3000` with your browser to see the result.
