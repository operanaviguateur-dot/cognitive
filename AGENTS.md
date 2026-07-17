# AGENTS.md

## Project Context

This is a standalone React + Vercel application — **fully independent, no Base44 dependency**.

## Architecture

- **Frontend**: React (Vite) — `src/`
- **Backend**: Vercel Serverless Functions — `api/`
- **Database**: PostgreSQL (Neon) via `lib/repositories/`
- **Auth**: JWT in HttpOnly cookies
- **AI**: Proxy via `/api/ai/invoke-llm` → configured LLM provider

## Key Files

- `src/api/client.js`: frontend API client (fetch-based, replaces Base44 SDK)
- `src/lib/AuthContext.jsx`: authentication context
- `api/auth/[action].js`: all auth routes (login, register, me, logout, OTP, OAuth)
- `api/articles.js` / `api/articles/[id].js`: articles CRUD
- `api/categories.js` / `api/categories/[id].js`: categories CRUD
- `api/comments.js` / `api/comments/[id].js`: comments CRUD
- `api/ai/invoke-llm.js`: AI proxy
- `lib/repositories/`: database access layer
- `lib/auth/`: JWT and middleware
- `services/aiService.js`: LLM provider abstraction
- `schema.sql`: PostgreSQL schema
- `.env.local`: local environment variables (never commit)
- `vercel.json`: Vercel routing config

## Run Locally

```bash
npm install
npm run dev:full   # starts API server (port 3001) + Vite frontend (port 5173)
```

## Environment Variables Required

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
APP_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=...         # optional, for Google OAuth
GOOGLE_CLIENT_SECRET=...     # optional
SMTP_HOST=...                # optional, for OTP emails
SMTP_USER=...
SMTP_PASS=...
AI_API_KEY=...               # Groq / OpenAI / OpenRouter key
```

## Working Notes

- Do NOT use Base44 SDK, `base44Client.js`, or `globalThis.__B44_DB__`
- All API calls go through `src/api/client.js` (`apiGet`, `apiPost`, `apiPut`, `apiDelete`, `apiAI`)
- Admin routes are protected by JWT + role check in middleware
- The Vercel deployment is triggered automatically on push to `main`
