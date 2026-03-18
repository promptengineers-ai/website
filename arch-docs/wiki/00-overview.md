# Project Overview

## What Is This?

**Prompt Engineers AI** is a community website for an AI-focused developer group based in Dallas/Plano, TX with 1,700+ members. The site serves as:

- A public landing page to attract new members
- A member directory for networking
- A profile management system with resume/avatar uploads
- A waitlist/contact collection tool
- A PWA for mobile-friendly access

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.4 (App Router) |
| Language | TypeScript 5 |
| UI | React 18, Tailwind CSS 3.4.1 |
| Animation | Framer Motion 12.4.7 |
| Database | MongoDB (via native driver, not Mongoose) |
| File Storage | MongoDB GridFS (avatars, resumes) |
| Auth | JWT (jsonwebtoken + jose) with HTTP-only cookies |
| Password Hashing | bcryptjs (12 salt rounds) |
| Rich Text | React Quill |
| Email Marketing | Brevo (Sendinblue) |
| Contact Storage | Airtable |
| Analytics | Google Analytics 4 |
| Content Feed | Medium RSS via rss-parser |
| PWA | @ducanh2912/next-pwa with Workbox |
| Fonts | Google Fonts (Montserrat, Space Grotesk) |
| Icons | React Icons |
| Deployment | Vercel (inferred from config) |

## Quick Start

```bash
# Install dependencies
yarn install

# Set environment variables (see arch-docs/ai-ref/env-config.md)
cp .env.example .env.local

# Run development server
yarn dev
```

### Required Environment Variables

```env
MONGO_DB_URI=<mongodb_connection_string>
NEXTAUTH_SECRET=<jwt_secret_base64_32_bytes>
```

### Optional Environment Variables

```env
AIRTABLE_API_KEY=<airtable_api_key>
BREVO_API_KEY=<brevo_email_service_key>
NEXT_PUBLIC_GA_ID=<google_analytics_id>
NEXT_PUBLIC_NODE_ENV=production
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API route handlers
│   │   ├── auth/           # Login, register, logout, session
│   │   ├── avatars/        # Avatar upload & retrieval (GridFS)
│   │   ├── contact/        # Contact form → Airtable
│   │   ├── members/        # Public member directory
│   │   ├── resumes/        # Resume upload & retrieval (GridFS)
│   │   ├── subscribe/      # Newsletter → Brevo
│   │   ├── users/          # Profile CRUD, signup alias
│   │   └── utils/          # Airtable & Brevo helper modules
│   ├── login/              # Login page
│   ├── signup/             # Registration page
│   ├── profile/            # Profile view & edit (protected)
│   ├── members/            # Member directory & detail pages
│   ├── socials/            # Social media links page
│   ├── offline/            # PWA offline fallback
│   ├── layout.tsx          # Root layout (fonts, auth, GA)
│   └── page.tsx            # Home page
├── components/             # Reusable UI components
│   ├── auth/               # AuthProvider, AuthForm
│   ├── buttons/            # WaitlistButton
│   ├── lists/              # FaqList
│   ├── loaders/            # Loading spinner
│   ├── members/            # MemberCard
│   ├── mocks/              # Device mockup frames
│   ├── nav/                # TopNavBar
│   ├── profile/            # AvatarUpload, ResumeUpload, ProfileForm, RichTextEditor
│   └── users/              # InitialLoadActiveUsers (GA event)
├── sections/               # Landing page section components
│   ├── HeroSection.tsx
│   ├── AboutSection.tsx
│   ├── ServiceSection.tsx
│   ├── ProjectSection.tsx
│   ├── ContactSection.tsx
│   ├── RoadmapSection.tsx
│   ├── SuggestionSection.tsx
│   ├── VideoSection.tsx
│   └── FooterSection.tsx
├── lib/                    # Server-side business logic
│   ├── models/             # User.ts, Profile.ts (MongoDB CRUD)
│   ├── mongodb.ts          # Connection pooling & GridFS
│   ├── jwt.ts              # JWT sign/verify/cookie management
│   ├── auth.ts             # Password validation & hashing
│   └── initDb.ts           # Database index creation
├── config/                 # App configuration
│   ├── app.ts              # GA ID, social links, RSS URL
│   ├── bot.ts              # Chat bot config
│   └── static.ts           # Static asset URLs
├── types/                  # TypeScript type definitions
│   └── index.ts
├── utils/                  # Client-side utilities
│   ├── client.ts           # API client class
│   ├── rss.ts              # RSS feed parser
│   ├── format.ts           # String formatting
│   └── filter.ts           # Array filtering
├── middleware.ts            # Route protection (JWT verification)
└── globals.css             # Global styles + Tailwind
```

## Key Design Decisions

1. **No ORM** - Uses the native MongoDB driver directly for simplicity and control
2. **GridFS over S3** - File storage in MongoDB avoids external storage service setup
3. **Dual JWT libraries** - `jose` for middleware (Edge Runtime compatible), `jsonwebtoken` for API routes (Node runtime)
4. **Context API over Redux** - Simple auth state doesn't warrant a state management library
5. **No traditional CMS** - Content is hardcoded in React components; blog content pulled from Medium RSS
6. **PWA-first** - Offline support and installable app for mobile community members
