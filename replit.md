# Outleadr — AI Sales Agent

An AI-powered B2B sales tool that generates 10 qualified leads with personalized cold emails for any business type and location. Built with a Cluely/Linear.app aesthetic: light grey background, white cards, Inter font, dark pill buttons.

## Architecture

- **Frontend**: React + Vite + wouter routing + TanStack Query
- **Backend**: Express + TypeScript
- **Database**: PostgreSQL (Replit built-in) — users table
- **AI**: OpenAI GPT-5.1 via Replit AI Integrations
- **Email**: Gmail API via Google OAuth 2.0

## Routes

| Path | Description |
|------|-------------|
| `/` | Public landing page |
| `/signup` | Sign up with email + password |
| `/login` | Log in with email + password |
| `/app` | Protected dashboard — lead gen tool |

## Pages

- `client/src/pages/dashboard.tsx` — Public landing page (hero, social proof, how it works, features, testimonials, pricing, FAQ, footer). All CTAs link to /signup.
- `client/src/pages/signup.tsx` — Email + password signup form
- `client/src/pages/login.tsx` — Email + password login form
- `client/src/pages/app.tsx` — Protected lead generator. Requires session. Shows email in navbar + logout button.

## Key Files

- `shared/schema.ts` — Zod schemas: user, signup, login, leads, send results
- `server/routes.ts` — API routes: user auth (signup/login/logout/me), Google OAuth, generate-leads, send-emails
- `server/storage.ts` — PostgreSQL user CRUD (getUserById, getUserByEmail, createUser)
- `server/gmail.ts` — Gmail OAuth2 helpers
- `client/src/App.tsx` — Router: /, /signup, /login, /app

## Authentication

- Email + password with bcrypt hashing (10 salt rounds)
- Sessions via express-session + memorystore
- `requireAuth` middleware protects `/api/generate-leads` and `/api/send-emails`
- `/api/auth/me` — returns current user or 401
- `/app` frontend redirects to `/login` if not authenticated (via /api/auth/me check)

## Database

- Table: `users` (id SERIAL, email VARCHAR UNIQUE, password_hash VARCHAR, created_at TIMESTAMP)
- Raw pg client (not Drizzle ORM)

## Gmail OAuth

- Connect Gmail: GET `/api/auth/google` → Google OAuth → `/app?connected=true`
- Redirect URI must be configured in Google Cloud Console
- Emails sent directly from user's Gmail inbox via Gmail API

## Design Tokens

- Background: #F5F5F5, White: #ffffff, Ink: #0f0f0f
- Font: Inter, Borders: rgba(0,0,0,0.07)
- Pill buttons: border-radius 99px, dark background
- Logo: `attached_assets/outleadr_1773094917545.png`

## Environment Variables

- `SESSION_SECRET` — Express session secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Gmail OAuth
- `AI_INTEGRATIONS_OPENAI_API_KEY` / `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI via Replit
- `DATABASE_URL` — PostgreSQL connection string
