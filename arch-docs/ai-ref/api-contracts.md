# API Contracts

Structured reference for all API endpoints.

---

## AUTH

### `POST /api/auth/register`
- **Auth:** None
- **Body:** `{ email: string, password: string, name: string }`
- **Validation:** email regex, password (8+ chars, 1 upper, 1 lower, 1 digit), email uniqueness
- **Side effects:** Creates user doc, creates empty profile doc, sets `auth-token` cookie
- **Success (201):** `{ user: { id, email, name } }`
- **Errors:** 400 (validation), 409 (duplicate email), 500

### `POST /api/auth/login`
- **Auth:** None
- **Body:** `{ email: string, password: string }`
- **Side effects:** Sets `auth-token` cookie (30d, httpOnly, sameSite=lax, secure in prod)
- **Success (200):** `{ user: { id, email, name } }`
- **Errors:** 401 (bad credentials), 500

### `POST /api/auth/logout`
- **Auth:** None
- **Body:** None
- **Side effects:** Clears `auth-token` cookie (maxAge=0)
- **Success (200):** `{ success: true }`

### `GET /api/auth/session`
- **Auth:** Cookie (`auth-token`)
- **Side effects:** Refreshes token if < 7 days remaining
- **Success (200):** `{ user: { id, email, name } }`
- **No auth (401):** `{ user: null }`

---

## PROFILES

### `GET /api/users/profile`
- **Auth:** Cookie
- **Success (200):** `{ profile: UserProfile }`
- **No profile (404):** `{ error: "Profile not found" }`
- **No auth (401):** `{ error: "Unauthorized" }`

### `POST /api/users/profile`
- **Auth:** Cookie
- **Body:** `{ links?: {...}, background?: string, seeking?: string[], isPublic?: boolean }`
- **Validation:** URLs must be http/https, background max 5000 chars, seeking in ["work","hiring","networking","other"]
- **Behavior:** Creates profile if none exists, updates if exists
- **Success (200/201):** `{ profile: UserProfile }`
- **Errors:** 400 (validation), 401, 500

### `POST /api/users/signup`
- **Alias:** Re-exports `/api/auth/register` handler

---

## MEMBERS

### `GET /api/members`
- **Auth:** None
- **Query params:**
  - `page` (number, default 1)
  - `limit` (number, default 20)
  - `seeking` (string, filter by seeking value)
  - `location` (string, regex search in background field)
  - `random` (boolean, return random sample instead of paginated)
- **Success (200):**
```json
{
  "members": [{ "_id", "userId", "name", "avatarUrl", "seeking", "background" }],
  "pagination": { "page", "limit", "total", "hasMore" }
}
```
- **Pipeline:** profiles (isPublic:true) → $lookup users → filter → paginate

---

## FILES

### `POST /api/avatars/upload`
- **Auth:** Cookie
- **Content-Type:** multipart/form-data
- **Field:** `file` (JPEG/PNG/WebP, max 5MB)
- **Side effects:** Stores in GridFS `avatars` bucket, updates profile.avatarUrl, deletes old avatar
- **Success (200):** `{ avatarUrl: "/api/avatars/{id}" }`

### `GET /api/avatars/[id]`
- **Auth:** None (public)
- **Response:** Image binary stream
- **Headers:** Content-Type, Cache-Control

### `POST /api/resumes/upload`
- **Auth:** Cookie
- **Content-Type:** multipart/form-data
- **Field:** `file` (PDF/DOC/DOCX, max 10MB)
- **Side effects:** Stores in GridFS `resumes` bucket, updates profile.resumeId, deletes old resume
- **Success (200):** `{ resumeId: "{id}" }`

### `GET /api/resumes/[id]`
- **Auth:** Cookie (must own the resume)
- **Response:** File binary stream
- **Headers:** Content-Type, Content-Disposition

### `DELETE /api/resumes/[id]`
- **Auth:** Cookie (must own the resume)
- **Side effects:** Deletes from GridFS, clears profile.resumeId
- **Success (200):** `{ success: true }`

---

## EXTERNAL INTEGRATIONS

### `POST /api/contact`
- **Auth:** None
- **Body:** `{ name: string, email: string }`
- **Side effects:** Creates record in Airtable (base: app6sU4AprV9uZze6, table: Contacts)
- **Success (200):** `{ message: "Contact form submitted" }`

### `POST /api/subscribe`
- **Auth:** None
- **Body:** `{ email: string }`
- **Side effects:** Creates/updates contact in Brevo (list ID: 6)
- **Success (200):** `{ message: "Subscribed successfully" }`
