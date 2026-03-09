# AI Sales Agent

A futuristic dark-themed AI sales agent web app that generates 10 qualified leads and personalized cold emails for any business type and location.

## Features

- Enter a business type and location (e.g., "plumbers in Houston, TX")
- AI generates 10 realistic prospects with company names, contact info, and emails
- Personalized cold email written for each lead (subject + body) using GPT-5.1
- One-click copy for individual emails, subjects, bodies, or all 10 emails at once
- Expandable email cards to view each personalized outreach message
- Quick-start example searches for faster testing

## Design

- Pure black background with futuristic sci-fi aesthetic
- Indigo/purple glowing accents and animated elements
- Space Grotesk / Oxanium fonts for display headings
- Animated grid background, scan line, and glow orbs
- Staggered card animations on lead generation
- Loading state with progressive step indicators

## Gmail OAuth (Google Login)
- Users connect their own Gmail via Google OAuth (not a shared account)
- The Gmail connector integration was dismissed — using GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET secrets instead
- OAuth flow: GET /api/auth/google → Google → /api/auth/google/callback → session stored
- Redirect URI must be set in Google Cloud Console: https://<domain>/api/auth/google/callback
- Sessions stored in memory (memorystore) with SESSION_SECRET
- Once connected, "Send All via Gmail" button sends all 10 emails from the user's own Gmail account

## Architecture

- **Frontend**: React + TypeScript + Wouter + TanStack Query
- **Backend**: Express.js
- **AI**: OpenAI GPT-5.1 via Replit AI Integrations (no API key needed)
- **Styling**: Tailwind CSS + custom animations + Shadcn UI components

## API Endpoints

- `POST /api/generate-leads` — Accepts `{ businessType, location }`, returns 10 leads with personalized cold emails

## File Structure

- `client/src/pages/dashboard.tsx` — Main dashboard page with search form and lead cards
- `server/routes.ts` — API routes with OpenAI integration
- `shared/schema.ts` — Zod schemas for type safety
- `tailwind.config.ts` — Custom animations (glow-pulse, fade-up, shimmer, scan-line, etc.)
- `client/src/main.tsx` — Forces dark mode globally
