# Project Manifest

## Identity
- **Name:** Prompt Engineers AI Community Website
- **Type:** Next.js 14.2.4 full-stack web application
- **Router:** App Router (not Pages Router)
- **Language:** TypeScript 5
- **Package Manager:** Yarn
- **Node Runtime:** Required for API routes (not edge-only)
- **Path Alias:** `@/*` → `./src/*`

## Constraints
- No ORM (native MongoDB driver)
- No state management library (Context API only)
- No data fetching library (plain fetch + useEffect)
- No CSS modules or styled-components (Tailwind only)
- No email verification flow (field exists but unused)
- Dual JWT libraries: `jose` (Edge/middleware), `jsonwebtoken` (Node/API routes)
- React Quill requires dynamic import (no SSR)
- `seeking` field accepts both `string` and `string[]` (backward compat)

## Critical Paths
- Auth cookie name: `auth-token`
- JWT secret env var: `NEXTAUTH_SECRET`
- DB connection env var: `MONGO_DB_URI`
- Protected route matcher: `/profile/:path*`
- GridFS buckets: `avatars`, `resumes`
- Airtable base: `app6sU4AprV9uZze6`, table: `Contacts`
- Brevo list ID: `6`
- Medium RSS: `https://medium.com/feed/@ryaneggz`

## Runtime Behavior
- JWT expiry: 30 days
- JWT refresh threshold: 7 days remaining
- bcrypt salt rounds: 12
- MongoDB pool: max 10 connections
- Avatar max: 5MB (JPEG/PNG/WebP)
- Resume max: 10MB (PDF/DOC/DOCX)
- Background text max: 5000 chars
- Members page size: 20
- Password: min 8 chars, 1 upper, 1 lower, 1 digit

## Build
```
yarn dev    # development server
yarn build  # production build
yarn start  # production server
yarn lint   # eslint
```
