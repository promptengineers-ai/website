# Routing & Navigation

## Route Map

### Public Pages

| Route | File | Rendering | Description |
|-------|------|-----------|-------------|
| `/` | `app/page.tsx` | Client | Home page (TopNavBar + HeroSection) |
| `/login` | `app/login/page.tsx` | Client | Login form with redirect support |
| `/signup` | `app/signup/page.tsx` | Client | Registration form |
| `/members` | `app/members/page.tsx` | Client | Paginated member directory with search/filter |
| `/members/[id]` | `app/members/[id]/page.tsx` | **Server** | Public member profile (SSR) |
| `/socials` | `app/socials/page.tsx` | Client | Social media links directory |
| `/offline` | `app/offline/page.tsx` | Client | PWA offline fallback |

### Protected Pages

| Route | File | Rendering | Description |
|-------|------|-----------|-------------|
| `/profile` | `app/profile/page.tsx` | Client | User's own profile view |
| `/profile/edit` | `app/profile/edit/page.tsx` | Client | Profile editing form |

### Error Pages

| Route | File | Description |
|-------|------|-------------|
| `*` (404) | `app/not-found.tsx` | Custom 404 with link to home |
| `*` (500) | `app/global-error.tsx` | Error boundary with reset button |

## Middleware

**File:** `src/middleware.ts`

Protects all routes matching `/profile/:path*`.

**Flow:**
1. Extract `auth-token` cookie from request
2. Verify JWT using `jose` library (Edge Runtime compatible)
3. If invalid/missing → redirect to `/login?from={requestedPath}`
4. If valid and token expires in < 7 days → refresh token (set new cookie)
5. If valid → pass through to page

## Navigation Component

**TopNavBar** (`src/components/nav/TopNavBar.tsx`) is rendered on every page via individual page imports (not via the layout).

### Navigation Links

**Unauthenticated users see:**
- Logo/brand → `/` (home)
- Login button → `/login`
- Register button → `/signup`

**Authenticated users see:**
- Logo/brand → `/` (home)
- User dropdown menu:
  - My Profile → `/profile`
  - Edit Profile → `/profile/edit`
  - Members → `/members`
  - Sign Out → calls `logout()` → redirects to `/`

### Scroll Behavior

The navbar changes appearance based on scroll position:
- **Top of page:** Transparent background
- **After 50px scroll:** Solid `bg-black/80` with `backdrop-blur-lg`

## Dynamic Routes

### `/members/[id]`

The only dynamic page route. This is a **server component** that:
1. Validates that `id` is a valid MongoDB ObjectId
2. Fetches profile via `getProfileByUserId(id)`
3. Checks `profile.isPublic === true`
4. Fetches user name via `getUserById(profile.userId)`
5. Returns `notFound()` if profile doesn't exist, isn't public, or ID is invalid
6. Renders full public profile with avatar, links, background, resume

## Page Data Fetching Patterns

### Server Component (members/[id])
```typescript
// Direct database access - no API call needed
const profile = await getProfileByUserId(id);
const user = await getUserById(profile.userId);
```

### Client Components (all others)
```typescript
// Fetch in useEffect on mount
useEffect(() => {
  fetch('/api/users/profile')
    .then(res => res.json())
    .then(data => setProfile(data.profile));
}, []);
```

No React Query, SWR, or other data fetching libraries. Plain `fetch` with `useState`/`useEffect`.

## Post-Login Redirect

When middleware redirects to `/login`, it includes `?from={originalPath}`:

```typescript
// middleware.ts
const loginUrl = new URL('/login', request.url);
loginUrl.searchParams.set('from', request.nextUrl.pathname);
return NextResponse.redirect(loginUrl);
```

The login page reads this param and redirects back after successful authentication:

```typescript
// login/page.tsx
const from = searchParams.get('from') || '/profile';
router.push(from);
```

## PWA Offline Fallback

Configured in `next.config.mjs`:
```javascript
fallbacks: { document: "/offline" }
```

When the user is offline and navigates to a page not in the service worker cache, they see `/offline` - a simple page encouraging them to reconnect.
