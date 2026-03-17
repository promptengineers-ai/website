# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser/PWA)                   │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Landing  │  │   Auth   │  │ Profile  │  │ Members │ │
│  │  Sections │  │  Forms   │  │  Mgmt    │  │   Dir   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│         │              │            │            │        │
│  ┌──────────────────────────────────────────────────┐   │
│  │              AuthProvider (Context API)            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────┘
                              │ HTTP (fetch)
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Next.js Server (Vercel)                 │
│                                                           │
│  ┌──────────┐  ┌──────────────────────────────────────┐ │
│  │Middleware │  │            API Routes                 │ │
│  │(JWT check)│  │  /auth  /users  /members  /files    │ │
│  └──────────┘  └──────────────────────────────────────┘ │
│         │              │                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              lib/ (Business Logic)                 │   │
│  │   models/User.ts  models/Profile.ts  jwt.ts       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ┌─────────┐   ┌──────────┐   ┌──────────┐
         │ MongoDB  │   │ Airtable │   │  Brevo   │
         │ + GridFS │   │  (CRM)   │   │ (Email)  │
         └─────────┘   └──────────┘   └──────────┘
```

## Application Layers

### 1. Presentation Layer (`components/`, `sections/`)

The UI is split into two categories:

- **Sections** - Full-width landing page blocks (Hero, About, Services, etc.). These are self-contained units that compose the marketing/landing experience. Each section manages its own data and animations.

- **Components** - Reusable UI pieces organized by domain (auth, profile, members, nav). These are composed into pages and sections.

All styling is Tailwind utility classes. No CSS modules, no styled-components. Framer Motion handles entrance/scroll animations.

### 2. Page/Routing Layer (`app/`)

Next.js App Router with a mix of:
- **Server Components** - Member detail page (`members/[id]`), root layout
- **Client Components** - Everything interactive (forms, auth-dependent views, animated sections)

The middleware intercepts requests to `/profile/*` to enforce authentication before the page renders.

### 3. API Layer (`app/api/`)

RESTful API routes handling:
- Authentication (register, login, logout, session refresh)
- Profile CRUD with validation
- File uploads/downloads via GridFS
- Contact form and newsletter forwarding to external services

Each route handler directly imports from `lib/` for business logic. There is no service layer abstraction - route handlers call model functions directly.

### 4. Business Logic Layer (`lib/`)

- **models/** - CRUD operations against MongoDB collections. Not an ORM - just functions wrapping `collection.findOne()`, `collection.insertOne()`, etc.
- **jwt.ts** - Token lifecycle management (sign, verify, cookie set/clear, auto-refresh)
- **auth.ts** - Password hashing, input validation
- **mongodb.ts** - Connection pool management and GridFS bucket initialization

### 5. Data Layer (MongoDB)

Three storage mechanisms:
- **`users` collection** - Authentication credentials
- **`profiles` collection** - Member profile data (links, bio, seeking status)
- **GridFS buckets** - Binary file storage for avatars and resumes

## Data Flow Patterns

### Authentication Flow

```
Browser                    API                      MongoDB
  │                         │                          │
  ├─POST /api/auth/login───▶│                          │
  │  {email, password}      ├─getUserByEmail()────────▶│
  │                         │◀─────── user doc ────────┤
  │                         ├─bcrypt.compare()         │
  │                         ├─signAuthToken(payload)   │
  │◀─Set-Cookie: auth-token─┤                          │
  │  + JSON {user}          │                          │
```

### Protected Page Load

```
Browser                  Middleware               API              MongoDB
  │                         │                      │                  │
  ├─GET /profile───────────▶│                      │                  │
  │                         ├─verifyToken(cookie)  │                  │
  │                         ├─(valid? continue)    │                  │
  │◀────── page HTML ───────┤                      │                  │
  │                         │                      │                  │
  ├─GET /api/users/profile──┼─────────────────────▶│                  │
  │                         │                      ├─getProfileByUserId()─▶│
  │                         │                      │◀─── profile doc ─┤
  │◀──── JSON {profile} ───┼──────────────────────┤                  │
```

### File Upload Flow

```
Browser                       API                    GridFS
  │                            │                       │
  ├─POST /api/avatars/upload──▶│                       │
  │  (FormData: file)          ├─getAuthFromRequest()  │
  │                            ├─validate(size, type)  │
  │                            ├─openUploadStream()───▶│
  │                            │   pipe(fileBuffer)    │
  │                            │◀─── fileId ──────────┤
  │                            ├─updateProfile(        │
  │                            │  avatarUrl: /api/     │
  │                            │  avatars/{fileId})    │
  │◀──── JSON {avatarUrl} ────┤                       │
```

## State Management

The app uses a lightweight approach to state:

- **Global state**: Only auth status, managed via React Context (`AuthProvider`)
- **Page state**: Local `useState` hooks for forms, pagination, filters, UI toggles
- **Server state**: No React Query or SWR - plain `fetch` in `useEffect` hooks
- **No client-side caching**: Each page load re-fetches its data

## Security Model

- JWT tokens stored in HTTP-only, SameSite=Lax cookies (not accessible to JS)
- Middleware checks auth before rendering protected pages
- API routes independently verify tokens (defense in depth)
- Passwords hashed with bcrypt (12 rounds)
- HTML content sanitized with DOMPurify before rendering
- File uploads validated for type and size
- URLs validated for http/https protocol
- Resume downloads restricted to the owning user

## Performance Considerations

- MongoDB connection pooling (max 10 connections) with global singleton in dev
- GridFS streaming for file delivery (no loading entire file into memory)
- PWA with aggressive caching and offline fallback
- Next.js image optimization for external images (Medium CDN, GitHub avatars)
- Dynamic imports for React Quill (avoids SSR issues and reduces initial bundle)
- Google Fonts with `display: swap` for fast text rendering
