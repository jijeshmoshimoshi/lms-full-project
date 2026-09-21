# 🚀 Free Deployment Guide for SkillPulse LMS

This guide explains how to deploy the entire LMS stack (**Backend**, **Student Frontend**, **Admin Panel**, and **MongoDB**) **100% free** using standard cloud platforms.

---

## 🏗️ The 100% Free Deployment Architecture

| Component | Platform | Free Tier Benefits |
| :--- | :--- | :--- |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | 512 MB free cloud database forever (M0 Tier) |
| **Backend API** (`lms-backend`) | [Render.com](https://render.com) | Free Web Service (Node.js + WebSockets / Socket.io) |
| **Student App** (`lms-frontend`) | [Vercel](https://vercel.com) | Free Next.js hosting, global CDN, automated SSL |
| **Admin Panel** (`lms-admin`) | [Vercel](https://vercel.com) | Free Next.js hosting with instant builds |

---

## 📦 Step 1: Push Your Code to GitHub

Open a terminal in the root project directory (`c:\Users\jijesh\Downloads\lms-full-project`) and run:

```bash
# 1. Initialize Git in the project root
git init

# 2. Stage all files (node_modules and local .env files are automatically ignored)
git add .

# 3. Create initial commit
git commit -m "Initial commit: LMS Full Project with Sandbox and Ask Video"

# 4. Create a new repository on GitHub (e.g. lms-full-project) and push:
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/lms-full-project.git
git push -u origin main
```

---

## 🍃 Step 2: Create a Free MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up/log in.
2. Click **Create a Deployment** and choose the **M0 (Free)** tier.
3. Under **Security Quickstart**:
   * Create a **Database User** (e.g. username: `admin_lms`, password: `YourStrongPassword123!`). *Save these credentials!*
   * Under **IP Access List**, select **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Click **Connect** → **Drivers (Node.js)** and copy your connection string:
   ```text
   mongodb+srv://admin_lms:<password>@cluster0.xxxxx.mongodb.net/lms?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual password and ensure `/lms` is in the database name).*

---

## ⚙️ Step 3: Deploy Backend on Render.com (Free)

1. Go to [Render.com](https://render.com) and log in with your GitHub account.
2. Click **New +** → **Web Service**.
3. Select your GitHub repository (`lms-full-project`).
4. Configure the service settings:
   * **Name**: `skillpulse-backend`
   * **Region**: Choose closest to you (e.g., Singapore / Frankfurt / Oregon)
   * **Root Directory**: `lms-backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add the following:
   * `PORT`: `5000`
   * `NODE_ENV`: `production`
   * `MONGO_URI`: *Your MongoDB connection string from Step 2*
   * `JWT_SECRET`: `your_secure_random_jwt_secret_key_2026`
   * `JWT_EXPIRES_IN`: `7d`
   * `CLIENT_URL`: `http://localhost:3000` *(we will update this after deploying frontend)*
   * `ADMIN_URL`: `http://localhost:3001` *(we will update this after deploying admin)*
   * `GEMINI_API_KEY`: `your_gemini_api_key_here`
   * `RAZORPAY_KEY_ID`: `your_razorpay_key_id_here`
   * `RAZORPAY_KEY_SECRET`: `your_razorpay_key_secret_here`
   * `RAZORPAY_WEBHOOK_SECRET`: `your_webhook_secret_here`
6. Click **Deploy Web Service**.

7. Once deployed, Render will give you a public URL (e.g., `https://skillpulse-backend.onrender.com`). Save this URL!

---

## 💻 Step 4: Deploy Student Frontend on Vercel (Free)

1. Go to [Vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`lms-full-project`).
4. In the configuration screen:
   * **Project Name**: `skillpulse-frontend`
   * **Framework Preset**: `Next.js`
   * **Root Directory**: Click **Edit** and choose `lms-frontend`
5. Under **Environment Variables**, add:
   * `NEXT_PUBLIC_API_URL`: `https://skillpulse-backend.onrender.com/api` *(Your Render URL + `/api`)*
   * `NEXT_PUBLIC_SOCKET_URL`: `https://skillpulse-backend.onrender.com` *(Your Render URL)*
   * `NEXT_PUBLIC_RAZORPAY_KEY_ID`: `your_razorpay_key_id_here`
6. Click **Deploy**.

7. Vercel will build and give you a public URL (e.g., `https://skillpulse-frontend.vercel.app`).

---

## 🛠️ Step 5: Deploy Admin Panel on Vercel (Free)

1. On Vercel, click **Add New...** → **Project** again.
2. Select the same GitHub repository (`lms-full-project`).
3. In the configuration screen:
   * **Project Name**: `skillpulse-admin`
   * **Framework Preset**: `Next.js`
   * **Root Directory**: Click **Edit** and choose `lms-admin`
4. Under **Environment Variables**, add:
   * `NEXT_PUBLIC_API_URL`: `https://skillpulse-backend.onrender.com/api` *(Your Render URL + `/api`)*
   * `NEXT_PUBLIC_SOCKET_URL`: `https://skillpulse-backend.onrender.com` *(Your Render URL)*
5. Click **Deploy**.
6. Vercel will build and give you an admin public URL (e.g., `https://skillpulse-admin.vercel.app`).

---

## 🔄 Step 6: Link URLs on Render Backend

Go back to your [Render Dashboard](https://dashboard.render.com) → `skillpulse-backend` → **Environment**:
* Update `CLIENT_URL` to your Vercel frontend domain: `https://skillpulse-frontend.vercel.app`
* Update `ADMIN_URL` to your Vercel admin domain: `https://skillpulse-admin.vercel.app`
* Click **Save Changes** (Render will automatically redeploy with the updated origins).

---

## 👑 Step 7: Seed Initial Admin User & Demo Courses

To populate your new cloud MongoDB with initial courses, admin accounts, and demo data:
1. On your local machine, open `lms-backend/.env` and temporarily replace `MONGO_URI` with your MongoDB Atlas connection string.
2. Run the seed scripts in terminal:
   ```bash
   cd lms-backend
   node seedAdmin.js
   node seedMoreData.js
   node publishAllCourses.js
   ```
3. Your live deployment will immediately have all courses, lessons, quizzes, and the admin account ready!

---

## ✅ You're Live!
* **Student Portal**: `https://skillpulse-frontend.vercel.app`
* **Admin Studio**: `https://skillpulse-admin.vercel.app`
* **API Health Check**: `https://skillpulse-backend.onrender.com/api/health`
