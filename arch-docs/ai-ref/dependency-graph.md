# Dependency Graph

Module import relationships and data flow paths.

## Server-Side Import Chain

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

## Client-Side Import Chain

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

## Data Flow: Authentication

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

## Data Flow: Profile Update

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

## Data Flow: Member Discovery

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

## External Dependencies (npm)

### Runtime
| Package | Purpose | Used In |
|---------|---------|---------|
| `next` | Framework | Everywhere |
| `react` / `react-dom` | UI library | Everywhere |
| `mongodb` | Database driver | `lib/mongodb.ts` |
| `jsonwebtoken` | JWT (Node) | `lib/jwt.ts` |
| `jose` | JWT (Edge) | `middleware.ts` |
| `bcryptjs` | Password hashing | `lib/auth.ts` |
| `framer-motion` | Animations | Sections, TopNavBar |
| `react-quill` | Rich text editor | `RichTextEditor.tsx` |
| `react-markdown` | Markdown render | `profile/page.tsx` |
| `react-qr-code` | QR code generation | `profile/page.tsx` |
| `react-icons` | Icon library | Multiple components |
| `react-input-mask` | Input masking | `ProfileForm.tsx` |
| `isomorphic-dompurify` | HTML sanitization | Profile pages |
| `dompurify` | HTML sanitization | (peer dep) |
| `rss-parser` | RSS feed parsing | `utils/rss.ts` |
| `rss-to-json` | RSS conversion | `utils/rss.ts` |
| `htmlparser2` | HTML parsing | `utils/rss.ts` |
| `@headlessui/react` | Accessible UI | `FaqList.tsx` |
| `@next/third-parties` | GA integration | `layout.tsx` |
| `@ducanh2912/next-pwa` | PWA support | `next.config.mjs` |

### Dev
| Package | Purpose |
|---------|---------|
| `typescript` | Type checking |
| `tailwindcss` | Utility CSS |
| `postcss` / `autoprefixer` | CSS processing |
| `eslint` / `eslint-config-next` | Linting |
| `prettier` / `prettier-plugin-tailwindcss` | Formatting |
