# LMS Frontend (Student-facing)

Next.js 14 (App Router) + Tailwind CSS.

## Setup
1. `cp .env.local.example .env.local` and point `NEXT_PUBLIC_API_URL` at your backend
2. `npm install`
3. `npm run dev` — runs on http://localhost:3000

## Pages
- `/` — landing page
- `/courses` — course catalog
- `/courses/[slug]` — course detail, modules/lessons, enroll button
- `/login`, `/register` — auth
- `/dashboard` — enrolled courses + progress

## Not included yet
- Lesson video player page
- Quiz-taking UI
- Payment checkout flow
- Certificate download
