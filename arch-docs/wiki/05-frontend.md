# Frontend Architecture

## Design System

### Color Palette

The site uses a **dark theme** with accent gradients:

| Role | Color | Tailwind Class |
|------|-------|---------------|
| Background | Pure black | `bg-black` |
| Card background | Dark gray | `bg-gray-800`, `bg-gray-900` |
| Primary text | White | `text-white` |
| Secondary text | Light gray | `text-gray-300`, `text-gray-400` |
| Primary accent | Indigo | `indigo-500`, `indigo-700` |
| Gradient start | Blue | `blue-400`, `blue-500` |
| Gradient end | Purple | `purple-500`, `purple-600` |
| Success | Green | `green-500` |
| Error | Red | `red-500` |

### Typography

Two Google Fonts loaded in the root layout via `next/font/google`:

- **Montserrat** (`--font-montserrat`) - Primary UI font for all text
- **Space Grotesk** (`--font-space`) - Accent font for specific headlines

Applied via Tailwind: `font-montserrat` and `font-space`.

### Animations

**Framer Motion** is the primary animation library:
- Entrance animations: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`
- Scroll-triggered: `whileInView` with `viewport={{ once: true }}`
- Hover effects: `whileHover={{ scale: 1.05 }}`
- Staggered children with incremental `delay`

**CSS Animations** (defined in `globals.css` and `tailwind.config.ts`):
- `fadeIn` - 1s opacity transition with staggered variants (0.25s, 0.5s, 0.75s delays)
- `pulse-grow-shrink` - Infinite scale pulse (1 → 1.1 → 1) for the floating CTA button

### Responsive Breakpoints

Standard Tailwind breakpoints:
- Mobile first (default)
- `sm:` (640px) - Two-column layouts
- `md:` (768px) - Navigation changes
- `lg:` (1024px) - Three/four-column grids

## Component Architecture

### Layout Chain

```
layout.tsx (Root)
  ├── AuthProvider (wraps all children)
  ├── GoogleAnalytics (production only)
  ├── InitialLoadActiveUsers (production only)
  └── {children} (page content)
```

There are no nested layouts - every page shares the same root layout.

### Component Categories

#### Navigation (`components/nav/`)

**TopNavBar** - Fixed header present on all pages
- Transparent background that becomes solid on scroll (50px threshold)
- Dynamic content based on auth state:
  - Unauthenticated: Login + Register buttons
  - Authenticated: User dropdown with profile/members links + sign out
- Uses `useAuth()` hook for state

#### Authentication (`components/auth/`)

**AuthProvider** - React Context wrapping the entire app
- Initializes by checking `GET /api/auth/session` on mount
- Provides `useAuth()` hook with `{ user, status, login, register, logout, refreshSession }`

**AuthForm** - Shared login/signup form
- Props: `type: 'login' | 'signup'`, `onSubmit` callback
- Conditionally renders name field and password confirmation for signup
- Shows password requirements checklist during signup
- Password visibility toggle

#### Profile Management (`components/profile/`)

**ProfileForm** - Main profile editing form
- Social links grid (6 fields)
- Rich text background editor with character counter (5000 max)
- Seeking status checkboxes
- Public profile toggle
- Avatar upload integration

**AvatarUpload** - Circular avatar picker
- Props: `avatarUrl?`, `onFileSelect`, `onDelete?`
- Preview, 5MB limit, JPG/PNG/WebP

**ResumeUpload** - Drag-and-drop file upload
- Props: `resumeId?`, `onFileSelect`, `onDelete`
- 10MB limit, PDF/DOC/DOCX
- Three states: empty, selected (unsaved), uploaded (with view/delete)

**RichTextEditor** - Quill wrapper (dynamically imported to avoid SSR)
- Props: `value`, `onChange`, `maxLength`
- Toolbar: headers, bold/italic/underline/strike, lists, links, clear

#### Members (`components/members/`)

**MemberCard** - Card for member directory grid
- Avatar with initial fallback
- Name, seeking badges with icons, truncated bio (150 chars)
- Links to `/members/{userId}`
- Hover border animation (gray → blue)

#### Utility Components

**WaitlistButton** - Fixed floating CTA (bottom-right)
- Auto-hides on scroll, pulse animation
- Scrolls to `#contact` section on click

**Loading** - Centered spinner with emoji
**FaqList** - Accordion using `@headlessui/react` Disclosure
**IphoneMock / MacbookMock** - Device frame overlays for video content

## Landing Page Sections

The home page is composed of section components in `src/sections/`. Each is a self-contained, full-width block.

| Section | Purpose | Key Features |
|---------|---------|-------------|
| **HeroSection** | Main landing hero | Gradient headline, stats (1700+ members), social links, CTA to survey |
| **AboutSection** | Founder introduction | Two-column: founder photo + story, social badges |
| **ServiceSection** | Service offerings | 4-column grid, 8 service cards with icons |
| **ProjectSection** | Community projects | 3-column grid with pagination (6/page) |
| **ContactSection** | Waitlist form | Name/email form → Airtable, success state |
| **RoadmapSection** | Feature roadmap timeline | Vertical timeline with status dots (complete/in-progress/planned) |
| **SuggestionSection** | Feature request board | Upvote system, tabs (active/complete), suggestion form |
| **VideoSection** | YouTube video carousel | Horizontal scroll of embedded videos |
| **FooterSection** | Newsletter signup | Email input → Brevo subscription |

Note: The current home page (`page.tsx`) only renders `TopNavBar` + `HeroSection`. The other sections exist but are not wired into the current route (they were part of the `v1.page.tsx` layout).

## Client-Side Utilities

### API Client (`utils/client.ts`)
A simple class with methods for:
- `contactFormSubmit(body)` - POST to `/api/contact`
- `subscribeToNewsletter(body)` - POST to `/api/subscribe`

### Format Utilities (`utils/format.ts`)
- `truncate(str, n)` - Truncate string to n characters with ellipsis
- `formatDate(timestamp)` - Format date from timestamp

### RSS Utilities (`utils/rss.ts`)
- `rssParser(url)` - Parse RSS feed
- `rssToJson(url, excerptLength)` - Convert feed to JSON with image extraction
- `extractImagesToJson(html)` - Pull image URLs from HTML strings

### Filter Utilities (`utils/filter.ts`)
- `findByProperty(items, name, value)` - Find item in array by property value
