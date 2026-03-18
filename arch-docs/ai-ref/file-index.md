# File Index

Every source file with its purpose and key exports.

## Configuration
| File | Purpose | Key Exports |
|------|---------|-------------|
| `next.config.mjs` | Next.js + PWA config | default export (withPWA wrapped config) |
| `tailwind.config.ts` | Tailwind customization | `config` (fonts, animations, gradients) |
| `tsconfig.json` | TypeScript config | path alias `@/*` → `./src/*` |
| `postcss.config.js` | PostCSS pipeline | tailwindcss + autoprefixer |
| `.eslintrc.json` | ESLint rules | extends `next/core-web-vitals` |
| `.prettierrc` | Prettier config | tailwind class sorting plugin |

## App Config (`src/config/`)
| File | Purpose | Key Exports |
|------|---------|-------------|
| `app.ts` | App constants | `NODE_ENV`, `GA_ID`, `MEDIUM_RSS_URL`, `socialIcons[]` |
| `bot.ts` | Chat bot config | `botConfig` (id, theme, prompts) |
| `static.ts` | Static asset URLs | `HERO_GIF` |

## Types (`src/types/`)
| File | Purpose | Key Exports |
|------|---------|-------------|
| `index.ts` | All type definitions | `User`, `AuthUser`, `UserProfile`, `Contact`, `Blog`, `ResumeMetadata` |

## Library (`src/lib/`)
| File | Purpose | Key Exports |
|------|---------|-------------|
| `mongodb.ts` | DB connection + GridFS | `getDb()`, `getGridFSBucket(name)` |
| `jwt.ts` | JWT lifecycle | `signAuthToken()`, `verifyAuthToken()`, `setAuthCookie()`, `clearAuthCookie()`, `getAuthFromCookies()`, `getAuthFromRequest()` |
| `auth.ts` | Validation + hashing | `validatePassword()`, `validateEmail()`, `validateUrl()`, `hashPassword()`, `verifyPassword()` |
| `initDb.ts` | Index creation | `initializeDatabase()` |
| `models/User.ts` | User CRUD | `createUser()`, `getUserByEmail()`, `getUserById()` |
| `models/Profile.ts` | Profile CRUD | `createProfile()`, `getProfileByUserId()`, `updateProfile()`, `deleteProfile()` |

## Utilities (`src/utils/`)
| File | Purpose | Key Exports |
|------|---------|-------------|
| `client.ts` | API client class | `apiClient` instance with `contactFormSubmit()`, `subscribeToNewsletter()` |
| `rss.ts` | RSS parsing | `rssParser()`, `rssToJson()`, `extractImagesToJson()` |
| `format.ts` | String formatting | `truncate()`, `formatDate()` |
| `filter.ts` | Array filtering | `findByProperty()` |

## Middleware
| File | Purpose |
|------|---------|
| `src/middleware.ts` | Protects `/profile/*` routes, JWT verification via `jose`, token refresh |

## Pages (`src/app/`)
| File | Route | Rendering | Auth |
|------|-------|-----------|------|
| `page.tsx` | `/` | Client | No |
| `login/page.tsx` | `/login` | Client | No |
| `signup/page.tsx` | `/signup` | Client | No |
| `profile/page.tsx` | `/profile` | Client | Yes |
| `profile/edit/page.tsx` | `/profile/edit` | Client | Yes |
| `members/page.tsx` | `/members` | Client | No |
| `members/[id]/page.tsx` | `/members/:id` | Server | No |
| `socials/page.tsx` | `/socials` | Client | No |
| `offline/page.tsx` | `/offline` | Client | No |
| `not-found.tsx` | 404 | Client | No |
| `global-error.tsx` | 500 | Client | No |
| `layout.tsx` | Root layout | Server | No |

## API Routes (`src/app/api/`)
| File | Method | Route | Auth |
|------|--------|-------|------|
| `auth/register/route.ts` | POST | `/api/auth/register` | No |
| `auth/login/route.ts` | POST | `/api/auth/login` | No |
| `auth/logout/route.ts` | POST | `/api/auth/logout` | No |
| `auth/session/route.ts` | GET | `/api/auth/session` | Cookie |
| `users/profile/route.ts` | GET, POST | `/api/users/profile` | Cookie |
| `users/signup/route.ts` | POST | `/api/users/signup` | No (alias) |
| `members/route.ts` | GET | `/api/members` | No |
| `avatars/upload/route.ts` | POST | `/api/avatars/upload` | Cookie |
| `avatars/[id]/route.ts` | GET | `/api/avatars/:id` | No |
| `resumes/upload/route.ts` | POST | `/api/resumes/upload` | Cookie |
| `resumes/[id]/route.ts` | GET, DELETE | `/api/resumes/:id` | Cookie |
| `contact/route.ts` | POST | `/api/contact` | No |
| `subscribe/route.ts` | POST | `/api/subscribe` | No |
| `utils/airtable.ts` | - | Helper module | - |
| `utils/brevo.ts` | - | Helper module | - |

## Components (`src/components/`)
| File | Type | Purpose |
|------|------|---------|
| `auth/AuthProvider.tsx` | Context Provider | Global auth state, `useAuth()` hook |
| `auth/AuthForm.tsx` | Client Component | Reusable login/signup form |
| `nav/TopNavBar.tsx` | Client Component | Fixed header navigation |
| `profile/ProfileForm.tsx` | Client Component | Profile editing form |
| `profile/AvatarUpload.tsx` | Client Component | Avatar file picker |
| `profile/ResumeUpload.tsx` | Client Component | Resume drag-drop upload |
| `profile/RichTextEditor.tsx` | Client Component | Quill wrapper (dynamic import) |
| `members/MemberCard.tsx` | Component | Member directory card |
| `buttons/WaitlistButton.tsx` | Client Component | Floating CTA button |
| `lists/FaqList.tsx` | Component | Headless UI accordion |
| `loaders/Loading.tsx` | Component | Centered spinner |
| `mocks/IphoneMock.tsx` | Component | iPhone device frame |
| `mocks/MacbookMock.tsx` | Component | Macbook device frame |
| `users/InitialLoadActiveUsers.tsx` | Client Component | GA event on mount |

## Sections (`src/sections/`)
| File | Purpose | Active on Home |
|------|---------|---------------|
| `HeroSection.tsx` | Landing hero with stats and CTAs | Yes |
| `AboutSection.tsx` | Founder intro with photo | No |
| `ServiceSection.tsx` | 8 service cards grid | No |
| `ProjectSection.tsx` | Community projects with pagination | No |
| `ContactSection.tsx` | Waitlist form → Airtable | No |
| `RoadmapSection.tsx` | Feature timeline with statuses | No |
| `SuggestionSection.tsx` | Feature request board with upvotes | No |
| `VideoSection.tsx` | YouTube video carousel | No |
| `FooterSection.tsx` | Newsletter signup → Brevo | No |

## Static Assets (`public/`)
| File | Purpose |
|------|---------|
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker (generated) |
| `pe-logo.png` | Brand logo |
| `images/og-image.png` | OpenGraph social share image |
| `images/ryan_egg.png` | Founder photo |
| `images/iphone-mock.png` | Device frame overlay |
| `images/logo-bg.png` | Logo background |

## Styles
| File | Purpose |
|------|---------|
| `src/app/globals.css` | Tailwind directives, theme vars, animations, scrollbar, blog prose |
| `src/app/styles.css` | Additional fade-in animation definitions |
