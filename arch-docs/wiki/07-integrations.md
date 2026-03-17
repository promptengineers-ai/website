# External Integrations

## Airtable

**Purpose:** Stores contact form submissions and waitlist signups.

**Configuration:**
- Base ID: `app6sU4AprV9uZze6`
- Table: `Contacts`
- Auth: Bearer token via `AIRTABLE_API_KEY` env var
- Integration file: `src/app/api/utils/airtable.ts`

**Usage:**
- `POST /api/contact` → Creates a record in the Contacts table
- Fields mapped: Name, Email (Phone and Message fields exist but are hidden in the UI)

**API call pattern:**
```typescript
fetch(`https://api.airtable.com/v0/${baseId}/Contacts`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ fields: { Name: name, Email: email } })
});
```

---

## Brevo (Sendinblue)

**Purpose:** Email marketing and newsletter subscription management.

**Configuration:**
- Endpoint: `https://api.brevo.com/v3/contacts`
- List ID: `6`
- Auth: `api-key` header via `BREVO_API_KEY` env var
- Integration file: `src/app/api/utils/brevo.ts`

**Usage:**
- `POST /api/subscribe` → Creates or updates a contact in Brevo with list assignment

**API call pattern:**
```typescript
fetch('https://api.brevo.com/v3/contacts', {
  method: 'POST',
  headers: {
    'api-key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: email,
    listIds: [6],
    updateEnabled: true
  })
});
```

---

## Google Analytics 4

**Purpose:** Page view and event tracking.

**Configuration:**
- Measurement ID: `NEXT_PUBLIC_GA_ID` env var
- Integration: `@next/third-parties` package
- Loaded in: `src/app/layout.tsx` (production only)

**Custom Events:**
- `InitialLoadActiveUsers` component fires a GA event on page load to track active users

**Conditional loading:**
```typescript
// layout.tsx
{process.env.NEXT_PUBLIC_NODE_ENV === 'production' && GA_ID && (
  <GoogleAnalytics gaId={GA_ID} />
)}
```

---

## Medium RSS Feed

**Purpose:** Pull blog content from the founder's Medium account for display on the site.

**Configuration:**
- Feed URL: `https://medium.com/feed/@ryaneggz`
- Libraries: `rss-parser`, `rss-to-json`
- Utility file: `src/utils/rss.ts`

**Functions:**
- `rssParser(url)` - Parses RSS XML into structured objects
- `rssToJson(url, excerptLength)` - Converts feed to JSON with image extraction
- `extractImagesToJson(html)` - Pulls image URLs from HTML content using `htmlparser2`

**Note:** The RSS utilities exist but blog content display is not currently active on the main home page route.

---

## Chat Bot (Prompt Engineers Bot)

**Purpose:** Embeddable AI chat widget (external service).

**Configuration file:** `src/config/bot.ts`
```typescript
{
  id: "65ed45874745d458cbf57254",
  name: "PromptEngineers AI",
  theme: { /* dark theme colors */ },
  welcomeMessage: "Hi, I'm the Prompt Engineers AI assistant...",
  starterPrompts: ["What is Prompt Engineers AI?", ...]
}
```

**Note:** The bot configuration exists but is not currently rendered in any page component. This appears to be pre-configured for future integration.

---

## Integration Architecture

```
                  ┌──────────────────┐
                  │   Contact Form   │
                  │  (ContactSection)│
                  └────────┬─────────┘
                           │ POST /api/contact
                           ▼
                  ┌──────────────────┐
                  │    Airtable      │
                  │  Contacts Table  │
                  └──────────────────┘

                  ┌──────────────────┐
                  │ Newsletter Form  │
                  │ (FooterSection)  │
                  └────────┬─────────┘
                           │ POST /api/subscribe
                           ▼
                  ┌──────────────────┐
                  │      Brevo       │
                  │  Contact List 6  │
                  └──────────────────┘

                  ┌──────────────────┐
                  │   Page Load      │
                  │  (layout.tsx)    │
                  └────────┬─────────┘
                           │ Script injection
                           ▼
                  ┌──────────────────┐
                  │  Google Analytics│
                  │    GA4 Tag       │
                  └──────────────────┘

                  ┌──────────────────┐
                  │  Medium Blog     │
                  │  RSS Feed        │
                  └────────┬─────────┘
                           │ rss-parser
                           ▼
                  ┌──────────────────┐
                  │  Blog Sections   │
                  │  (not active)    │
                  └──────────────────┘
```

## Environment Variables for Integrations

| Variable | Service | Required | Scope |
|----------|---------|----------|-------|
| `AIRTABLE_API_KEY` | Airtable | No | Server |
| `BREVO_API_KEY` | Brevo | No | Server |
| `NEXT_PUBLIC_GA_ID` | Google Analytics | No | Client |
| `MONGO_DB_URI` | MongoDB | **Yes** | Server |
| `NEXTAUTH_SECRET` | JWT signing | **Yes** | Server |

All external integrations gracefully degrade - the site functions without Airtable/Brevo/GA keys, just without those features.
