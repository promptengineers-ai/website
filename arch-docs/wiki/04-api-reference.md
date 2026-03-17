# API Reference

All API routes live under `src/app/api/`. Every route uses Next.js App Router route handlers (`route.ts` files with exported HTTP method functions).

---

## Authentication

### POST `/api/auth/register`
Create a new user account and profile.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass1",
  "name": "Jane Doe"
}
```

**Validation:**
- Email must match basic regex format
- Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Email must not already exist

**Response (201):**
```json
{
  "user": { "id": "...", "email": "...", "name": "..." }
}
```
Sets `auth-token` cookie.

**Errors:** 400 (validation), 409 (email exists), 500

---

### POST `/api/auth/login`
Authenticate with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass1"
}
```

**Response (200):**
```json
{
  "user": { "id": "...", "email": "...", "name": "..." }
}
```
Sets `auth-token` cookie.

**Errors:** 401 (invalid credentials), 500

---

### POST `/api/auth/logout`
Clear the authentication cookie.

**Body:** None

**Response (200):**
```json
{ "success": true }
```
Clears `auth-token` cookie.

---

### GET `/api/auth/session`
Check current authentication status. Auto-refreshes token if near expiry.

**Auth:** Cookie required

**Response (200):**
```json
{
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

**Response (401):**
```json
{ "user": null }
```

---

## User Profiles

### GET `/api/users/profile`
Fetch the authenticated user's profile.

**Auth:** Required (cookie)

**Response (200):**
```json
{
  "profile": {
    "userId": "...",
    "links": { "linkedin": "...", "github": "..." },
    "background": "Markdown content...",
    "seeking": ["work", "networking"],
    "resumeId": "...",
    "isPublic": true,
    "avatarUrl": "/api/avatars/..."
  }
}
```

**Response (404):** Profile not found (user exists but hasn't created profile)

---

### POST `/api/users/profile`
Create or update the authenticated user's profile.

**Auth:** Required (cookie)

**Body:**
```json
{
  "links": {
    "linkedin": "https://linkedin.com/in/user",
    "github": "https://github.com/user"
  },
  "background": "I am a software engineer...",
  "seeking": ["work", "networking"],
  "isPublic": true
}
```

**Validation:**
- URLs must be http/https
- Background max 5000 characters
- Seeking values must be: `work`, `hiring`, `networking`, `other`

**Response (200):** Updated profile object
**Response (201):** Newly created profile object

---

## Members Directory

### GET `/api/members`
List public member profiles with pagination and filtering.

**Auth:** Not required

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `seeking` | string | - | Filter by seeking type |
| `location` | string | - | Search keyword in background text |
| `random` | boolean | false | Return random sample instead of paginated |

**Response (200):**
```json
{
  "members": [
    {
      "_id": "...",
      "userId": "...",
      "name": "Jane Doe",
      "avatarUrl": "/api/avatars/...",
      "seeking": ["work"],
      "background": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

Uses MongoDB aggregation pipeline with `$lookup` to join user names.

---

## File Uploads

### POST `/api/avatars/upload`
Upload a profile avatar image.

**Auth:** Required (cookie)
**Content-Type:** `multipart/form-data`

**Constraints:**
- Max size: 5 MB
- Allowed types: JPEG, PNG, WebP

**Response (200):**
```json
{
  "avatarUrl": "/api/avatars/507f1f77bcf86cd799439011"
}
```

Automatically deletes previous avatar if one exists.

---

### GET `/api/avatars/[id]`
Retrieve an avatar image by GridFS ID.

**Auth:** Not required (public)

**Response:** Image binary with appropriate `Content-Type` header and cache headers.

---

### POST `/api/resumes/upload`
Upload a resume document.

**Auth:** Required (cookie)
**Content-Type:** `multipart/form-data`

**Constraints:**
- Max size: 10 MB
- Allowed types: PDF, DOC, DOCX

**Response (200):**
```json
{
  "resumeId": "507f1f77bcf86cd799439011"
}
```

---

### GET `/api/resumes/[id]`
Download a resume by GridFS ID.

**Auth:** Required (must be the resume owner)

**Response:** File binary with appropriate `Content-Type` and `Content-Disposition` headers.

---

### DELETE `/api/resumes/[id]`
Delete a resume.

**Auth:** Required (must be the resume owner)

**Response (200):**
```json
{ "success": true }
```

---

## Contact & Newsletter

### POST `/api/contact`
Submit the waitlist/contact form.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Integration:** Forwards to Airtable Contacts table.

**Response (200):**
```json
{ "message": "Contact form submitted" }
```

---

### POST `/api/subscribe`
Subscribe to the newsletter.

**Body:**
```json
{
  "email": "jane@example.com"
}
```

**Integration:** Creates contact in Brevo (list ID 6).

**Response (200):**
```json
{ "message": "Subscribed successfully" }
```

---

## Utility Endpoints

### POST `/api/users/signup`
Alias for `/api/auth/register`. Re-exports the same handler.
