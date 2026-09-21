# LMS Backend

Node.js / Express / MongoDB REST API for the LMS platform.

## Setup
1. `cp .env.example .env` and fill in values
2. `npm install`
3. `npm run dev` (requires MongoDB running locally or a MONGO_URI to Atlas)

## API Overview
- `POST /api/auth/register` – register (student/instructor)
- `POST /api/auth/login` – login, returns JWT
- `GET /api/auth/me` – current user (auth required)
- `GET /api/courses` – list published courses (filters: category, level, search)
- `GET /api/courses/:slug` – course detail with modules/lessons
- `POST /api/courses` – create course (instructor/admin)
- `PUT/DELETE /api/courses/:id` – update/delete course (owner or admin)
- `POST /api/courses/:courseId/modules` – add module
- `POST /api/courses/modules/:moduleId/lessons` – add lesson
- `POST /api/enrollments` – enroll in a course
- `GET /api/enrollments/me` – my enrollments + progress
- `POST /api/enrollments/progress` – mark a lesson complete
- `POST /api/quizzes` – create quiz for a lesson (instructor/admin)
- `GET /api/quizzes/lesson/:lessonId` – get quiz (answers hidden)
- `POST /api/quizzes/:id/submit` – submit answers, get score
- `GET /api/users` – list users (admin)
- `PUT /api/users/:id/role` – change a user's role (admin)

## Not included yet (extend as needed)
- Payments (Stripe/Razorpay webhook handlers)
- Video upload/streaming integration (Mux/Cloudflare Stream)
- Certificate PDF generation
- Email notifications
- File upload storage (S3/R2) — multer is installed but not wired up
