# LMS Project — 3 Repos

This project is split into three independent repos/apps, matching how you'd deploy them separately:

1. **lms-backend/** — Node.js/Express/MongoDB REST API (port 5000)
2. **lms-frontend/** — Student-facing site, Next.js + Tailwind (port 3000)
3. **lms-admin/** — Admin/instructor panel, Next.js + Tailwind (port 3001)

## Quick start (local)
```bash
# 1. Backend
cd lms-backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET
npm install
npm run dev

# 2. Frontend (new terminal)
cd lms-frontend
cp .env.local.example .env.local
npm install
npm run dev

# 3. Admin (new terminal)
cd lms-admin
cp .env.local.example .env.local
npm install
npm run dev
```

Then create your first user via `/register` on the frontend as an "instructor", or register then manually set a user's role to `admin` directly in MongoDB (`db.users.updateOne({email:"you@x.com"},{$set:{role:"admin"}})`), then log into the admin panel.

## What's covered
Auth (JWT, roles: student/instructor/admin), course/module/lesson CRUD, enrollment + progress tracking, quiz creation & auto-grading, admin user management.

## What's intentionally NOT built (needs your decisions/keys)
- Payment integration (Stripe/Razorpay)
- Video hosting/streaming (Mux, Cloudflare Stream, or your own S3 + player)
- Certificate PDF generation
- Email notifications
- File/image upload to cloud storage (multer is installed in backend but not wired to S3/R2)
- Lesson video player + quiz-taking UI on the frontend
- Deployment configs (Vercel/Docker) — happy to add these once you pick a host

Each repo has its own README with API/page details.
