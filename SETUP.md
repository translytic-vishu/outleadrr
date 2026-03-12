# OutLeadrr — Setup & Deployment Guide

> Full step-by-step guide to run OutLeadrr locally and deploy it as a professional SaaS.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Comes with Node |
| PostgreSQL | 14+ | [postgresql.org](https://www.postgresql.org) or use a cloud DB (see below) |

---

## 1. Install Dependencies

```bash
cd "Sales-Prospector (1)/Sales-Prospector"
npm install
```

---

## 2. Environment Variables

Create a `.env` file in the project root (same folder as `package.json`):

```env
# ── Database ────────────────────────────────────────────────────────
DATABASE_URL=postgresql://username:password@localhost:5432/outleadrr

# ── Google Places API (for real business data) ───────────────────────
GOOGLE_PLACES_API_KEY=AIza...

# ── Google OAuth 2.0 (for Gmail sending + Google sign-in) ────────────
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# ── OpenAI (for AI-written emails) ───────────────────────────────────
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# ── Session Security ──────────────────────────────────────────────────
SESSION_SECRET=your-random-secret-here

# ── Server ───────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
```

> **Generate a secure SESSION_SECRET:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 3. Get Your API Keys

### 3a. Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Library**
4. Search for and **enable** these APIs:
   - `Places API`
   - `Maps JavaScript API` (optional, for future map features)
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
7. Copy the key → set as `GOOGLE_PLACES_API_KEY`
8. **Restrict the key** (recommended): Under API restrictions, select "Places API" only

> **Cost note:** Google Places API has a free tier ($200/month credit). At ~$0.017/request, you get ~11,000 free searches/month.

---

### 3b. Google OAuth 2.0 Credentials (Gmail + Google Sign-In)

1. In [Google Cloud Console](https://console.cloud.google.com), go to **APIs & Services → Library**
2. Enable `Gmail API`
3. Go to **APIs & Services → OAuth consent screen**
   - Choose **External**
   - Fill in: App name (`OutLeadrr`), support email, developer email
   - Add scopes: `email`, `profile`, `openid`, `https://www.googleapis.com/auth/gmail.send`
   - Add your email to **Test users** (while in testing mode)
   - Save and continue
4. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `OutLeadrr`
   - **Authorized redirect URIs** — add:
     - `http://localhost:5000/api/auth/google/callback` (local dev)
     - `https://yourdomain.com/api/auth/google/callback` (production)
6. Copy the **Client ID** → set as `GOOGLE_CLIENT_ID`
7. Copy the **Client Secret** → set as `GOOGLE_CLIENT_SECRET`

---

### 3c. OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in → click your profile → **API Keys**
3. Click **Create new secret key**
4. Copy the key → set as `AI_INTEGRATIONS_OPENAI_API_KEY`
5. Leave `AI_INTEGRATIONS_OPENAI_BASE_URL` as `https://api.openai.com/v1`

> **Model note:** The app uses `gpt-5.1`. If unavailable in your account, change it to `gpt-4o` or `gpt-4-turbo` in `server/routes.ts` line ~217.

---

## 4. Database Setup

### Option A: Local PostgreSQL

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE outleadrr;"

# Set DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/outleadrr
```

### Option B: Neon.tech (Free Cloud PostgreSQL — Recommended)

1. Go to [neon.tech](https://neon.tech) → Create account → New project
2. Copy the connection string → set as `DATABASE_URL`

### Option C: Railway PostgreSQL

1. Create project at [railway.app](https://railway.app)
2. Add a PostgreSQL plugin
3. Copy `DATABASE_URL` from the Variables tab

---

### Run database migrations

```bash
npm run db:push
```

This creates the `users` table using Drizzle ORM.

---

## 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

The server and React frontend both run on port 5000 in development mode.

---

## 6. Deploy to Production

### Option A: Deploy on Replit (Easiest)

1. Open the project in Replit
2. Go to the **Secrets** tab (🔒 lock icon in sidebar)
3. Add all environment variables from the `.env` file above
4. Enable the **PostgreSQL** module (Database tab)
5. Run `npm run db:push` in the Shell
6. Click **Deploy** — Replit handles HTTPS and domain automatically
7. Update your Google OAuth redirect URI to your Replit URL:
   `https://yourproject.replit.app/api/auth/google/callback`

---

### Option B: Deploy on Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** plugin to the project
4. Go to **Variables** tab and add all env vars
5. Set the **Start command**: `node dist/index.cjs`
6. Set **Build command**: `npm run build`
7. Railway auto-deploys on every git push
8. Update Google OAuth redirect URI to your Railway domain

---

### Option C: Deploy on Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build command**: `npm run build`
   - **Start command**: `node dist/index.cjs`
   - **Environment**: Node 20
5. Add a **PostgreSQL** database from the Render dashboard
6. Add all environment variables in the **Environment** tab
7. Update Google OAuth redirect URI to your Render domain

---

## 7. Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GOOGLE_PLACES_API_KEY` | ✅ | For searching real businesses via Google Maps |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth app client secret |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | ✅ | OpenAI API key for email generation |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | ✅ | OpenAI base URL (`https://api.openai.com/v1`) |
| `SESSION_SECRET` | ✅ | Random string for session encryption (32+ chars) |
| `PORT` | ❌ | Server port (default: 5000) |
| `NODE_ENV` | ❌ | `development` or `production` |

---

## 8. Available Scripts

```bash
npm run dev      # Start development server (frontend + backend on port 5000)
npm run build    # Build for production (output: dist/)
npm run start    # Run production build
npm run check    # TypeScript type checking
npm run db:push  # Push database schema (creates/updates tables)
```

---

## 9. Troubleshooting

### "Google Places API key not configured"
→ Add `GOOGLE_PLACES_API_KEY` to your environment variables and restart the server.

### "No businesses found"
→ Try a more specific or more common business type (e.g., "restaurants" instead of "artisan sourdough bakeries"). The search uses Google Maps text search.

### Gmail OAuth not redirecting correctly
→ Make sure your redirect URI in Google Cloud Console exactly matches: `https://yourdomain.com/api/auth/google/callback` (no trailing slash).

### Emails landing in spam
→ This is a Gmail deliverability issue. Add an email signature, warm up your account, and start with small batches (5–10 emails/day).

### "Invalid email or password" on login
→ Make sure the email was registered with email/password (not Google OAuth). Google-created accounts don't have passwords.

### Database connection errors
→ Verify `DATABASE_URL` format: `postgresql://user:password@host:5432/dbname`
→ Check your PostgreSQL server is running and accessible.

### OpenAI model not found
→ The app uses `gpt-5.1`. If your account doesn't have access, change the model in `server/routes.ts` line ~217 to `gpt-4o`.

---

## 10. Project Structure

```
Sales-Prospector/
├── client/src/
│   ├── pages/
│   │   ├── dashboard.tsx   # Public landing page
│   │   ├── app.tsx         # Protected lead generator dashboard
│   │   ├── login.tsx       # Login page
│   │   └── signup.tsx      # Signup page
│   └── index.css           # Global styles
├── server/
│   ├── routes.ts           # All API endpoints
│   ├── places.ts           # Google Places API integration
│   ├── gmail.ts            # Google OAuth + Gmail API
│   └── storage.ts          # PostgreSQL user operations
├── shared/
│   └── schema.ts           # Shared TypeScript types + Zod schemas
├── SETUP.md                # This file
└── package.json
```

---

## 11. How the App Works

1. **User signs up** via email/password or Google OAuth
2. **User enters** a business type and city (e.g., "plumbers, Houston TX")
3. **Google Places API** returns up to 10 real businesses with name, address, phone, website, rating
4. **Each business is scored** (0–100) based on industry fit, size, reachability, and review health
5. **OpenAI GPT** generates a contact name, email address, and personalized cold email for each business
6. **User reviews** the leads, sorts/filters by score, and previews each email
7. **User connects Gmail** via Google OAuth
8. **Emails are sent** directly from the user's Gmail account via the Gmail API
9. **User can export** all leads as a CSV file for their CRM

---

Built with React + TypeScript + Express + PostgreSQL + Google APIs + OpenAI
