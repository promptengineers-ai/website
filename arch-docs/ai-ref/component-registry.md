# Component Registry

Props, dependencies, and behavior for every component.

## Context Providers

### `AuthProvider`
- **File:** `src/components/auth/AuthProvider.tsx`
- **Type:** Context Provider (client component)
- **Props:** `{ children: ReactNode }`
- **Provides:** `AuthContextType { user, status, login, register, logout, refreshSession }`
- **Hook:** `useAuth()`
- **Init behavior:** Calls `GET /api/auth/session` on mount
- **Dependencies:** None (top-level provider in layout.tsx)

---

## Navigation

### `TopNavBar`
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

## Auth Components

### `AuthForm`
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

## Profile Components

### `ProfileForm`
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

### `AvatarUpload`
- **File:** `src/components/profile/AvatarUpload.tsx`
- **Type:** Client component
- **Props:** `{ avatarUrl?: string, onFileSelect: (file: File) => void, onDelete?: () => void }`
- **Constraints:** 5MB max, JPG/PNG/WebP
- **Dependencies:** None

### `ResumeUpload`
- **File:** `src/components/profile/ResumeUpload.tsx`
- **Type:** Client component
- **Props:** `{ resumeId?: string, onFileSelect: (file: File) => void, onDelete: () => void }`
- **Constraints:** 10MB max, PDF/DOC/DOCX
- **States:** empty → selected (preview) → uploaded (view/delete buttons)
- **Dependencies:** `react-icons`

### `RichTextEditor`
- **File:** `src/components/profile/RichTextEditor.tsx`
- **Type:** Client component (dynamically imported, no SSR)
- **Props:** `{ value: string, onChange: (value: string) => void, maxLength?: number }`
- **Toolbar:** Headers, bold, italic, underline, strike, lists, links, clear
- **Dependencies:** `react-quill` (dynamic import)

---

## Member Components

### `MemberCard`
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

## Utility Components

### `WaitlistButton`
- **File:** `src/components/buttons/WaitlistButton.tsx`
- **Type:** Client component
- **Props:** None
- **Behavior:** Fixed bottom-right, pulse animation, scrolls to #contact, auto-hides on scroll

### `Loading`
- **File:** `src/components/loaders/Loading.tsx`
- **Type:** Component
- **Props:** None
- **Renders:** Centered spinner emoji, full viewport height

### `FaqList`
- **File:** `src/components/lists/FaqList.tsx`
- **Type:** Component
- **Props:** None (data hardcoded inside)
- **Dependencies:** `@headlessui/react` Disclosure

### `IphoneMock`
- **File:** `src/components/mocks/IphoneMock.tsx`
- **Props:** Video source URL
- **Renders:** iPhone frame with embedded video

### `MacbookMock`
- **File:** `src/components/mocks/MacbookMock.tsx`
- **Props:** Video source URL
- **Renders:** Macbook frame with embedded video

### `InitialLoadActiveUsers`
- **File:** `src/components/users/InitialLoadActiveUsers.tsx`
- **Type:** Client component
- **Props:** None
- **Behavior:** Fires GA event on mount, renders null
- **Used in:** layout.tsx (production only)

---

## Section Components (`src/sections/`)

All are client components with Framer Motion animations. None accept props - data is hardcoded or fetched internally.

| Component | Key Data | API Calls | Notes |
|-----------|----------|-----------|-------|
| `HeroSection` | Stats, social links | None | Gradient text, staggered animation |
| `AboutSection` | Founder info | None | Two-column, photo + story |
| `ServiceSection` | 8 service cards | None | 4-column grid |
| `ProjectSection` | 3 projects | None | Paginated (6/page) |
| `ContactSection` | None | POST `/api/contact` | Waitlist form with success state |
| `RoadmapSection` | Timeline items | None | Status dots, expandable cards |
| `SuggestionSection` | Feature list | None | Upvote system, local state only |
| `VideoSection` | YouTube URLs | None | Horizontal scroll carousel |
| `FooterSection` | None | POST `/api/subscribe` | Newsletter email input |

---

## Component Tree (Home Page)

```
layout.tsx
  └── AuthProvider
        └── page.tsx (/)
              ├── TopNavBar
              │     └── useAuth()
              └── HeroSection
```

## Component Tree (Profile Edit)

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

## Component Tree (Members)

```
layout.tsx
  └── AuthProvider
        └── members/page.tsx
              ├── TopNavBar
              └── MemberCard[] (mapped from API response)
```
