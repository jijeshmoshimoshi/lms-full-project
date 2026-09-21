# LMS Admin Panel

Separate Next.js app for admins/instructors — runs on port 3001 so it can be deployed independently from the student frontend.

## Setup
1. `cp .env.local.example .env.local` and point at your backend
2. `npm install`
3. `npm run dev` — runs on http://localhost:3001

## Pages
- `/login` — admin/instructor login (rejects student accounts)
- `/` — overview stats
- `/courses` — create/list/delete courses
- `/users` — admin-only: view users, change roles, delete users

## Not included yet
- Module/lesson builder UI (API supports it — see backend README)
- Quiz builder UI
- Analytics/reports
- Bulk actions
