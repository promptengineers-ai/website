# Frontend Architecture

## Design System

### Color Palette

The site uses a **dark theme** with accent gradients:

| Role            | Color      | Tailwind Class                   |
| --------------- | ---------- | -------------------------------- |
| Background      | Pure black | `bg-black`                       |
| Card background | Dark gray  | `bg-gray-800`, `bg-gray-900`     |
| Primary text    | White      | `text-white`                     |
| Secondary text  | Light gray | `text-gray-300`, `text-gray-400` |
| Primary accent  | Indigo     | `indigo-500`, `indigo-700`       |
| Gradient start  | Blue       | `blue-400`, `blue-500`           |
| Gradient end    | Purple     | `purple-500`, `purple-600`       |
| Success         | Green      | `green-500`                      |
| Error           | Red        | `red-500`                        |

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

| Section               | Purpose                  | Key Features                                                          |
| --------------------- | ------------------------ | --------------------------------------------------------------------- |
| **HeroSection**       | Main landing hero        | Gradient headline, stats (1700+ members), social links, CTA to survey |
| **AboutSection**      | Founder introduction     | Two-column: founder photo + story, social badges                      |
| **ServiceSection**    | Service offerings        | 4-column grid, 8 service cards with icons                             |
| **ProjectSection**    | Community projects       | 3-column grid with pagination (6/page)                                |
| **ContactSection**    | Waitlist form            | Name/email form → Airtable, success state                             |
| **RoadmapSection**    | Feature roadmap timeline | Vertical timeline with status dots (complete/in-progress/planned)     |
| **SuggestionSection** | Feature request board    | Upvote system, tabs (active/complete), suggestion form                |
| **VideoSection**      | YouTube video carousel   | Horizontal scroll of embedded videos                                  |
| **FooterSection**     | Newsletter signup        | Email input → Brevo subscription                                      |

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

---

## Component registry

Props, dependencies, and behavior for every component.

### Context Providers

#### `AuthProvider`

- **File:** `src/components/auth/AuthProvider.tsx`
- **Type:** Context Provider (client component)
- **Props:** `{ children: ReactNode }`
- **Provides:** `AuthContextType { user, status, login, register, logout, refreshSession }`
- **Hook:** `useAuth()`
- **Init behavior:** Calls `GET /api/auth/session` on mount
- **Dependencies:** None (top-level provider in layout.tsx)

---

### Navigation

#### `TopNavBar`

- **File:** `src/components/nav/TopNavBar.tsx`
- **Type:** Client component
- **Props:** None
- **Consumes:** `useAuth()` for user/status
- **Behavior:**
  - Fixed position header
  - Transparent → solid background on scroll (50px threshold)
  - Shows Login/Register when unauthenticated
  - Shows user dropdown when authenticated
- **Dependencies:** `framer-motion`, `react-icons`, `AuthProvider`

---

### Auth Components

#### `AuthForm`

- **File:** `src/components/auth/AuthForm.tsx`
- **Type:** Client component
- **Props:** `{ type: 'login' | 'signup', onSubmit: (email, password, name?) => Promise<void> }`
- **Behavior:**
  - Renders name field only for signup
  - Password confirmation only for signup
  - Password visibility toggle
  - Password requirements checklist (signup)
  - Error message display
  - Forgot password → LinkedIn link
- **Dependencies:** `react-icons`

---

### Profile Components

#### `ProfileForm`

- **File:** `src/components/profile/ProfileForm.tsx`
- **Type:** Client component
- **Props:** `{ profile?: UserProfile, onSubmit: (data) => Promise<void> }`
- **Behavior:**
  - 6 social link URL inputs
  - Rich text editor for background (5000 char limit)
  - Seeking checkboxes (work, hiring, networking, other)
  - Public profile toggle
  - Avatar upload integration
- **Dependencies:** `AvatarUpload`, `RichTextEditor`

#### `AvatarUpload`

- **File:** `src/components/profile/AvatarUpload.tsx`
- **Type:** Client component
- **Props:** `{ avatarUrl?: string, onFileSelect: (file: File) => void, onDelete?: () => void }`
- **Constraints:** 5MB max, JPG/PNG/WebP
- **Dependencies:** None

#### `ResumeUpload`

- **File:** `src/components/profile/ResumeUpload.tsx`
- **Type:** Client component
- **Props:** `{ resumeId?: string, onFileSelect: (file: File) => void, onDelete: () => void }`
- **Constraints:** 10MB max, PDF/DOC/DOCX
- **States:** empty → selected (preview) → uploaded (view/delete buttons)
- **Dependencies:** `react-icons`

#### `RichTextEditor`

- **File:** `src/components/profile/RichTextEditor.tsx`
- **Type:** Client component (dynamically imported, no SSR)
- **Props:** `{ value: string, onChange: (value: string) => void, maxLength?: number }`
- **Toolbar:** Headers, bold, italic, underline, strike, lists, links, clear
- **Dependencies:** `react-quill` (dynamic import)

---

### Member Components

#### `MemberCard`

- **File:** `src/components/members/MemberCard.tsx`
- **Type:** Component
- **Props:** `{ member: { _id, userId, name, avatarUrl?, seeking, background } }`
- **Behavior:**
  - Avatar with initial fallback
  - Seeking badges with icons
  - Truncated bio (150 chars, HTML stripped)
  - Links to `/members/{userId}`
  - Blue border on hover
- **Dependencies:** `react-icons`, `next/link`

---

### Utility Components

#### `WaitlistButton`

- **File:** `src/components/buttons/WaitlistButton.tsx`
- **Type:** Client component
- **Props:** None
- **Behavior:** Fixed bottom-right, pulse animation, scrolls to #contact, auto-hides on scroll

#### `Loading`

- **File:** `src/components/loaders/Loading.tsx`
- **Type:** Component
- **Props:** None
- **Renders:** Centered spinner emoji, full viewport height

#### `FaqList`

- **File:** `src/components/lists/FaqList.tsx`
- **Type:** Component
- **Props:** None (data hardcoded inside)
- **Dependencies:** `@headlessui/react` Disclosure

#### `IphoneMock`

- **File:** `src/components/mocks/IphoneMock.tsx`
- **Props:** Video source URL
- **Renders:** iPhone frame with embedded video

#### `MacbookMock`

- **File:** `src/components/mocks/MacbookMock.tsx`
- **Props:** Video source URL
- **Renders:** Macbook frame with embedded video

#### `InitialLoadActiveUsers`

- **File:** `src/components/users/InitialLoadActiveUsers.tsx`
- **Type:** Client component
- **Props:** None
- **Behavior:** Fires GA event on mount, renders null
- **Used in:** layout.tsx (production only)

---

### Section Components (`src/sections/`)

All are client components with Framer Motion animations. None accept props - data is hardcoded or fetched internally.

| Component           | Key Data            | API Calls             | Notes                              |
| ------------------- | ------------------- | --------------------- | ---------------------------------- |
| `HeroSection`       | Stats, social links | None                  | Gradient text, staggered animation |
| `AboutSection`      | Founder info        | None                  | Two-column, photo + story          |
| `ServiceSection`    | 8 service cards     | None                  | 4-column grid                      |
| `ProjectSection`    | 3 projects          | None                  | Paginated (6/page)                 |
| `ContactSection`    | None                | POST `/api/contact`   | Waitlist form with success state   |
| `RoadmapSection`    | Timeline items      | None                  | Status dots, expandable cards      |
| `SuggestionSection` | Feature list        | None                  | Upvote system, local state only    |
| `VideoSection`      | YouTube URLs        | None                  | Horizontal scroll carousel         |
| `FooterSection`     | None                | POST `/api/subscribe` | Newsletter email input             |

---

### Component Tree (Home Page)

```
layout.tsx
  └── AuthProvider
        └── page.tsx (/)
              ├── TopNavBar
              │     └── useAuth()
              └── HeroSection
```

### Component Tree (Profile Edit)

```
layout.tsx
  └── AuthProvider
        └── profile/edit/page.tsx
              ├── TopNavBar
              ├── ProfileForm
              │     ├── AvatarUpload
              │     └── RichTextEditor (dynamic)
              └── ResumeUpload
```

### Component Tree (Members)

```
layout.tsx
  └── AuthProvider
        └── members/page.tsx
              ├── TopNavBar
              └── MemberCard[] (mapped from API response)
```
