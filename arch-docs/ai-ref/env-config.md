# Environment & Configuration Reference

## Environment Variables

### Required
| Variable | Scope | Used In | Purpose |
|----------|-------|---------|---------|
| `MONGO_DB_URI` | Server | `src/lib/mongodb.ts` | MongoDB connection string |
| `NEXTAUTH_SECRET` | Server | `src/lib/jwt.ts`, `src/middleware.ts` | JWT signing secret (32 bytes, base64) |

### Optional
| Variable | Scope | Used In | Purpose |
|----------|-------|---------|---------|
| `AIRTABLE_API_KEY` | Server | `src/app/api/utils/airtable.ts` | Airtable REST API bearer token |
| `BREVO_API_KEY` | Server | `src/app/api/utils/brevo.ts` | Brevo email service API key |
| `NEXT_PUBLIC_GA_ID` | Client | `src/config/app.ts`, `src/app/layout.tsx` | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_NODE_ENV` | Client | `src/config/app.ts` | Controls GA and analytics loading |

### Access Patterns
- Server-only vars: `process.env.VAR_NAME` in API routes and lib/
- Client vars: Must be prefixed with `NEXT_PUBLIC_` and accessed via `process.env.NEXT_PUBLIC_*`
- `NEXT_PUBLIC_NODE_ENV` gates production-only features (GA, active user tracking)

---

## App Configuration (`src/config/`)

### `app.ts`
```typescript
NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV
GA_ID = process.env.NEXT_PUBLIC_GA_ID
MEDIUM_RSS_URL = "https://medium.com/feed/@ryaneggz"

socialIcons = [
  { name: "Slack", url: "https://join.slack.com/...", icon: FaSlack },
  { name: "Meetup", url: "https://www.meetup.com/...", icon: SiMeetup },
  { name: "GitHub", url: "https://github.com/promptengineers-ai", icon: FaGithub }
]
```

### `bot.ts`
```typescript
botConfig = {
  id: "65ed45874745d458cbf57254",
  name: "PromptEngineers AI",
  theme: { primaryColor: "#000", secondaryColor: "#1a1a2e", ... },
  welcomeMessage: "Hi, I'm the Prompt Engineers AI assistant...",
  starterPrompts: ["What is Prompt Engineers AI?", ...]
}
```
Not currently rendered in any page.

### `static.ts`
```typescript
HERO_GIF = "https://media.giphy.com/..."
```

---

## JWT Configuration (in `src/lib/jwt.ts`)

| Setting | Value |
|---------|-------|
| Algorithm | HS256 |
| Token expiry | 30 days |
| Refresh threshold | 7 days remaining |
| Cookie name | `auth-token` |
| Cookie httpOnly | true |
| Cookie sameSite | lax |
| Cookie secure | true (production only) |
| Cookie path | / |

---

## MongoDB Configuration (in `src/lib/mongodb.ts`)

| Setting | Value |
|---------|-------|
| Max pool size | 10 |
| Server selection timeout | 5000ms |
| Socket timeout | 45000ms |
| Dev connection caching | globalThis singleton |

---

## Password Validation (in `src/lib/auth.ts`)

| Rule | Regex/Value |
|------|-------------|
| Min length | 8 characters |
| Uppercase | `/[A-Z]/` |
| Lowercase | `/[a-z]/` |
| Digit | `/[0-9]/` |
| Hash algorithm | bcrypt |
| Salt rounds | 12 |

---

## File Upload Limits

| Type | Max Size | Allowed MIME Types |
|------|----------|-------------------|
| Avatar | 5 MB | `image/jpeg`, `image/png`, `image/webp` |
| Resume | 10 MB | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |

---

## Next.js Configuration (`next.config.mjs`)

| Setting | Value |
|---------|-------|
| React strict mode | true |
| SWC minification | true |
| Image domains | `cdn-images-1.medium.com`, `avatars.githubusercontent.com` |
| PWA cacheOnFrontEndNav | true |
| PWA aggressive caching | true |
| PWA reload on online | true |
| PWA offline fallback | `/offline` |

---

## Tailwind Custom Extensions (`tailwind.config.ts`)

| Extension | Details |
|-----------|---------|
| Font: montserrat | `var(--font-montserrat)` |
| Font: space | `var(--font-space)` |
| Animation: fadeIn | 1s ease-in-out opacity |
| Animation: pulse-grow-shrink | 2s infinite scale 1→1.1→1 |
| Transition delays | 500ms, 1000ms |

---

## External Service Endpoints

| Service | Endpoint | Auth Method |
|---------|----------|-------------|
| Airtable | `https://api.airtable.com/v0/app6sU4AprV9uZze6/Contacts` | Bearer token |
| Brevo | `https://api.brevo.com/v3/contacts` | `api-key` header |
| Google Analytics | gtag.js injection | Measurement ID |
| Medium RSS | `https://medium.com/feed/@ryaneggz` | None (public) |

---

## Feature Flags (Implicit)

| Feature | Gate | Default |
|---------|------|---------|
| Google Analytics | `NEXT_PUBLIC_NODE_ENV === 'production' && GA_ID` | Off |
| Active user tracking | `NEXT_PUBLIC_NODE_ENV === 'production'` | Off |
| Contact form | `AIRTABLE_API_KEY` present | Off |
| Newsletter | `BREVO_API_KEY` present | Off |
| Secure cookies | Production environment | Off (dev) |
