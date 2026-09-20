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

---

## Module dependency graph

Module import relationships and data flow paths.

### Server-Side Import Chain

```
API Route Handlers
  ├── src/lib/jwt.ts
  │     ├── jsonwebtoken
  │     └── next/headers (cookies)
  ├── src/lib/auth.ts
  │     └── bcryptjs
  ├── src/lib/mongodb.ts
  │     └── mongodb (MongoClient, GridFSBucket)
  ├── src/lib/models/User.ts
  │     ├── src/lib/mongodb.ts (getDb)
  │     ├── src/lib/auth.ts (hashPassword)
  │     └── src/types/index.ts (User)
  ├── src/lib/models/Profile.ts
  │     ├── src/lib/mongodb.ts (getDb)
  │     └── src/types/index.ts (UserProfile)
  └── src/app/api/utils/
        ├── airtable.ts (fetch → Airtable REST API)
        └── brevo.ts (fetch → Brevo REST API)

Middleware (Edge Runtime)
  └── jose (jwtVerify, SignJWT)
      NOTE: Cannot use jsonwebtoken in Edge Runtime
```

### Client-Side Import Chain

```
layout.tsx
  ├── next/font/google (Montserrat, Space_Grotesk)
  ├── @next/third-parties/google (GoogleAnalytics)
  └── src/components/auth/AuthProvider.tsx
        └── react (createContext, useContext, useState, useEffect)

TopNavBar.tsx
  ├── src/components/auth/AuthProvider.tsx (useAuth)
  ├── framer-motion (motion)
  ├── react-icons/fa
  ├── next/link
  └── next/image

AuthForm.tsx
  └── react-icons/fa (FaEye, FaEyeSlash)

ProfileForm.tsx
  ├── src/components/profile/AvatarUpload.tsx
  ├── src/components/profile/RichTextEditor.tsx (dynamic import)
  └── react-icons/fa

ResumeUpload.tsx
  └── react-icons/fa

MemberCard.tsx
  ├── next/link
  ├── next/image
  └── react-icons/fa

ContactSection.tsx
  ├── src/utils/client.ts (apiClient)
  └── framer-motion

FooterSection.tsx
  └── src/utils/client.ts (apiClient)

Members page (members/page.tsx)
  ├── src/components/members/MemberCard.tsx
  └── fetch → /api/members

Profile page (profile/page.tsx)
  ├── react-qr-code
  ├── react-markdown
  ├── isomorphic-dompurify
  └── fetch → /api/users/profile

Members detail (members/[id]/page.tsx) [SERVER COMPONENT]
  ├── src/lib/models/Profile.ts (direct DB access)
  ├── src/lib/models/User.ts (direct DB access)
  └── isomorphic-dompurify
```

### Data Flow: Authentication

```
AuthForm (UI)
  → AuthProvider.login(email, pw)
    → fetch POST /api/auth/login
      → getUserByEmail(email)          [User model → MongoDB]
      → verifyPassword(pw, hash)       [bcryptjs]
      → signAuthToken(payload)         [jsonwebtoken]
      → setAuthCookie(token)           [Set-Cookie header]
    ← { user: AuthUser }
  → setState({ user, status: 'authenticated' })
```

### Data Flow: Profile Update

```
ProfileForm (UI)
  → onSubmit(formData)
    → fetch POST /api/users/profile
      → getAuthFromRequest(req)        [jwt.ts → verify cookie]
      → validateUrl(links.*)           [auth.ts]
      → updateProfile(userId, data)    [Profile model → MongoDB]
    ← { profile: UserProfile }
  → router.push('/profile')

AvatarUpload (parallel)
  → onFileSelect(file)
    → fetch POST /api/avatars/upload (FormData)
      → getAuthFromRequest(req)
      → GridFS upload stream
      → updateProfile(userId, { avatarUrl })
    ← { avatarUrl }

ResumeUpload (parallel)
  → onFileSelect(file)
    → fetch POST /api/resumes/upload (FormData)
      → getAuthFromRequest(req)
      → GridFS upload stream
      → updateProfile(userId, { resumeId })
    ← { resumeId }
```

### Data Flow: Member Discovery

```
members/page.tsx
  → useEffect: fetch GET /api/members?page=1&limit=20
    → MongoDB aggregation:
        profiles { isPublic: true }
        $lookup → users (get name)
        $match (seeking, location filters)
        $skip/$limit
    ← { members[], pagination }
  → map members → MemberCard[]

MemberCard click → navigate to /members/{userId}

members/[id]/page.tsx (SERVER)
  → getProfileByUserId(id)            [direct MongoDB]
  → getUserById(profile.userId)        [direct MongoDB]
  → render full profile with DOMPurify sanitized HTML
```

### External Dependencies (npm)

#### Runtime

| Package                | Purpose            | Used In              |
| ---------------------- | ------------------ | -------------------- |
| `next`                 | Framework          | Everywhere           |
| `react` / `react-dom`  | UI library         | Everywhere           |
| `mongodb`              | Database driver    | `lib/mongodb.ts`     |
| `jsonwebtoken`         | JWT (Node)         | `lib/jwt.ts`         |
| `jose`                 | JWT (Edge)         | `middleware.ts`      |
| `bcryptjs`             | Password hashing   | `lib/auth.ts`        |
| `framer-motion`        | Animations         | Sections, TopNavBar  |
| `react-quill`          | Rich text editor   | `RichTextEditor.tsx` |
| `react-markdown`       | Markdown render    | `profile/page.tsx`   |
| `react-qr-code`        | QR code generation | `profile/page.tsx`   |
| `react-icons`          | Icon library       | Multiple components  |
| `react-input-mask`     | Input masking      | `ProfileForm.tsx`    |
| `isomorphic-dompurify` | HTML sanitization  | Profile pages        |
| `dompurify`            | HTML sanitization  | (peer dep)           |
| `rss-parser`           | RSS feed parsing   | `utils/rss.ts`       |
| `rss-to-json`          | RSS conversion     | `utils/rss.ts`       |
| `htmlparser2`          | HTML parsing       | `utils/rss.ts`       |
| `@headlessui/react`    | Accessible UI      | `FaqList.tsx`        |
| `@next/third-parties`  | GA integration     | `layout.tsx`         |
| `@ducanh2912/next-pwa` | PWA support        | `next.config.mjs`    |

#### Dev

| Package                                    | Purpose        |
| ------------------------------------------ | -------------- |
| `typescript`                               | Type checking  |
| `tailwindcss`                              | Utility CSS    |
| `postcss` / `autoprefixer`                 | CSS processing |
| `eslint` / `eslint-config-next`            | Linting        |
| `prettier` / `prettier-plugin-tailwindcss` | Formatting     |
