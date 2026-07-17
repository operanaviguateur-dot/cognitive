# Cognitive Chronicle

Plateforme d'intelligence éditoriale alimentée par l'IA — **React + Vercel, sans aucune dépendance Base44**.

## Stack

- **Frontend** : React 18 + Vite
- **Backend** : Vercel Serverless Functions (`api/`)
- **Base de données** : PostgreSQL (Neon) via `lib/repositories/`
- **Auth** : JWT dans des cookies HttpOnly
- **IA** : Proxy `/api/ai/invoke-llm` → Groq / OpenAI / OpenRouter

## Prérequis

1. Une base de données PostgreSQL (ex. [Neon](https://neon.tech))
2. Node.js 18+
3. Un compte Vercel connecté à ce dépôt GitHub

## Installation locale

```bash
git clone https://github.com/operanaviguateur-dot/cognitive.git
cd cognitive
npm install
```

## Configuration

Copiez `.env.example` en `.env.local` et remplissez vos valeurs :

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=votre-secret-jwt-32-caractères-minimum
APP_URL=http://localhost:5173
GOOGLE_CLIENT_ID=...         # optionnel — Google OAuth
GOOGLE_CLIENT_SECRET=...     # optionnel
SMTP_HOST=...                # optionnel — emails OTP
SMTP_USER=...
SMTP_PASS=...
AI_API_KEY=...               # Groq / OpenAI / OpenRouter
```

## Initialiser la base de données

```bash
# Exécuter le schéma SQL sur votre base Neon (une seule fois)
psql $DATABASE_URL -f schema.sql
```

## Lancer en développement

```bash
npm run dev:full
# → API server sur http://localhost:3001
# → Frontend Vite sur http://localhost:5173
```

## Structure du projet

```
api/
  auth/[action].js      # login, register, me, logout, OTP, Google OAuth
  articles.js           # GET list + POST create
  articles/[id].js      # GET + PUT + DELETE
  categories.js
  categories/[id].js
  comments.js
  comments/[id].js
  ai/invoke-llm.js      # proxy IA

lib/
  db.js                 # connexion PostgreSQL
  auth/                 # JWT + middleware
  repositories/         # accès base de données

services/
  aiService.js          # abstraction LLM multi-provider

src/
  api/client.js         # client fetch (remplace Base44 SDK)
  lib/AuthContext.jsx   # contexte d'authentification
  pages/               # Home, ArticlePage, Login, Register, admin/*
  components/          # Navbar, CommentsSection, SynthesisBar, ...

schema.sql              # schéma PostgreSQL complet
vercel.json             # config routage Vercel
```

## Déploiement Vercel

Chaque push sur `main` déclenche automatiquement un redéploiement.

Configurez vos variables d'environnement dans le dashboard Vercel :
**Settings → Environment Variables**

## Notes importantes

- Ne jamais utiliser `globalThis.__B44_DB__` ou le SDK Base44
- Tous les appels API passent par `src/api/client.js`
- Les routes admin sont protégées par JWT + vérification de rôle
