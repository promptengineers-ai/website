# Authentication System

## Overview

The app uses a custom JWT-based authentication system (no NextAuth/Auth.js). Tokens are stored in HTTP-only cookies and verified at two levels: middleware (for page protection) and API route handlers (for data protection).

## Architecture

```
┌────────────┐     ┌──────────────┐     ┌──────────────┐
│  AuthForm  │────▶│ AuthProvider  │────▶│  API Routes  │
│ (UI Input) │     │  (Context)   │     │  (/api/auth) │
└────────────┘     └──────────────┘     └──────┬───────┘
                          │                     │
                   Manages state:          Sets cookie:
                   - user object           - auth-token
                   - auth status           - httpOnly
                   - login/logout          - 30-day expiry
                          │                     │
                   ┌──────▼───────┐     ┌──────▼───────┐
                   │  Components  │     │  Middleware   │
                   │  (useAuth)   │     │  (JWT verify) │
                   └──────────────┘     └──────────────┘
```

## Token Lifecycle

### Creation
When a user logs in or registers, the API:
1. Validates credentials against MongoDB
2. Signs a JWT with `{ userId, email, name }` payload
3. Sets an `auth-token` cookie (HTTP-only, SameSite=Lax, Secure in prod)
4. Token expiry: **30 days**

### Verification
Two JWT libraries are used because Next.js middleware runs on Edge Runtime:
- **Middleware** (`src/middleware.ts`): Uses `jose` library (Edge-compatible)
- **API routes** (`src/lib/jwt.ts`): Uses `jsonwebtoken` (Node.js runtime)

Both use the same secret (`NEXTAUTH_SECRET`) and algorithm (HS256).

### Auto-Refresh
When a token has less than **7 days** remaining:
- Middleware refreshes it by setting a new cookie with fresh 30-day expiry
- The `/api/auth/session` endpoint also refreshes tokens
- This is transparent to the user

### Logout
- API clears the `auth-token` cookie by setting `maxAge: 0`
- AuthProvider resets context state to `unauthenticated`

## Password Requirements

Enforced in `src/lib/auth.ts`:
- Minimum 8 characters
- At least one uppercase letter (`/[A-Z]/`)
- At least one lowercase letter (`/[a-z]/`)
- At least one number (`/[0-9]/`)
- Hashed with bcryptjs, 12 salt rounds

## Protected Routes

Defined in `src/middleware.ts` via path matching:

```typescript
export const config = {
  matcher: ['/profile/:path*']
};
```

When an unauthenticated user hits a protected route:
1. Middleware reads `auth-token` cookie
2. If missing or invalid, redirects to `/login?from={originalPath}`
3. Login page can then redirect back after successful auth

## Client-Side Auth State

`AuthProvider` (`src/components/auth/AuthProvider.tsx`) wraps the entire app in the root layout.

### Context Shape
```typescript
interface AuthContextType {
  user: AuthUser | null;       // { id, email, name }
  status: AuthStatus;          // 'loading' | 'authenticated' | 'unauthenticated'
  login: (email, password) => Promise<void>;
  register: (email, password, name) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### Initialization
On mount, `AuthProvider` calls `GET /api/auth/session` to check for an existing valid token. This determines the initial auth state.

### Usage in Components
```typescript
const { user, status, login, logout } = useAuth();

if (status === 'loading') return <Loading />;
if (status === 'unauthenticated') return <Redirect to="/login" />;
```

## API Route Auth Pattern

Every protected API route follows this pattern:

```typescript
export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // auth.userId is now available
}
```

`getAuthFromRequest()` extracts and verifies the JWT from the request's cookies.

## Security Notes

- Cookies are `httpOnly` - JavaScript cannot read the token
- Cookies are `secure` in production (HTTPS only)
- `sameSite: 'lax'` prevents CSRF on cross-origin POST requests
- Tokens are not stored in localStorage or sessionStorage
- Password hashing uses 12 bcrypt rounds (intentionally slow for brute-force resistance)
- Email validation uses regex; no email verification flow is implemented (field exists but unused)
