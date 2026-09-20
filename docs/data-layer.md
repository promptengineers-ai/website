# Data Layer

## Database: MongoDB

The application uses the native MongoDB Node.js driver (not Mongoose). Connection management lives in `src/lib/mongodb.ts`.

### Connection Management

```typescript
// Singleton pattern: reuse connection across hot reloads in development
const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
};
```

Key settings:

- **Pool size**: 10 connections max
- **Server selection timeout**: 5 seconds
- **Socket timeout**: 45 seconds
- **Development**: Cached on `globalThis` to survive HMR
- **Production**: New client per cold start (Vercel serverless)

### Collections

#### `users`

Stores authentication credentials.

| Field           | Type     | Notes                            |
| --------------- | -------- | -------------------------------- |
| `_id`           | ObjectId | Auto-generated                   |
| `email`         | string   | **Unique index**                 |
| `passwordHash`  | string   | bcrypt hash                      |
| `name`          | string   | Display name                     |
| `emailVerified` | boolean  | Always `false` (not implemented) |
| `createdAt`     | Date     | Set on creation                  |
| `updatedAt`     | Date     | Updated on modification          |

#### `profiles`

Stores member profile data, linked to users.

| Field             | Type               | Notes                                           |
| ----------------- | ------------------ | ----------------------------------------------- |
| `_id`             | ObjectId           | Auto-generated                                  |
| `userId`          | ObjectId           | **Unique index**, references `users._id`        |
| `links.linkedin`  | string?            | URL                                             |
| `links.github`    | string?            | URL                                             |
| `links.twitter`   | string?            | URL                                             |
| `links.portfolio` | string?            | URL                                             |
| `links.meetup`    | string?            | URL                                             |
| `links.other`     | string?            | URL                                             |
| `background`      | string             | Markdown/HTML bio (max 5000 chars)              |
| `seeking`         | string[] or string | `"work"`, `"hiring"`, `"networking"`, `"other"` |
| `resumeId`        | ObjectId?          | References GridFS `resumes` bucket              |
| `isPublic`        | boolean?           | Controls visibility in member directory         |
| `avatarUrl`       | string?            | Path like `/api/avatars/{id}`                   |
| `createdAt`       | Date               |                                                 |
| `updatedAt`       | Date               |                                                 |

### Model Functions

**User model** (`src/lib/models/User.ts`):

- `createUser(email, passwordHash, name)` - Insert with timestamps
- `getUserByEmail(email)` - Lookup for login
- `getUserById(id)` - Lookup by ObjectId

**Profile model** (`src/lib/models/Profile.ts`):

- `createProfile(profileData)` - Insert with timestamps
- `getProfileByUserId(userId)` - Find profile for a user
- `updateProfile(userId, updates)` - Partial update with `$set`
- `deleteProfile(userId)` - Remove profile document

These are plain functions, not classes. They get a collection reference via `getDb()` on each call.

## File Storage: GridFS

MongoDB GridFS is used for binary file storage (avatars and resumes). This avoids the need for S3 or another external storage service.

### How GridFS Works

GridFS splits files into 255KB chunks stored across two collections per bucket:

- `{bucket}.files` - File metadata (filename, contentType, size, uploadDate)
- `{bucket}.chunks` - Binary data chunks

### Buckets

Two GridFS buckets are configured in `src/lib/mongodb.ts`:

| Bucket    | Purpose          | Max Size | Allowed Types   |
| --------- | ---------------- | -------- | --------------- |
| `avatars` | Profile photos   | 5 MB     | JPEG, PNG, WebP |
| `resumes` | Resume documents | 10 MB    | PDF, DOC, DOCX  |

### Upload Flow

```typescript
const bucket = getGridFSBucket("avatars");
const uploadStream = bucket.openUploadStream(filename, {
  contentType: file.type,
  metadata: { userId, originalName: file.name },
});
// Write buffer to stream, get back fileId
```

### Download Flow

```typescript
const bucket = getGridFSBucket("avatars");
const downloadStream = bucket.openDownloadStream(new ObjectId(id));
// Stream response with appropriate Content-Type header
```

Avatars are publicly accessible (`GET /api/avatars/[id]` - no auth required).
Resumes are private (`GET /api/resumes/[id]` - user must own the resume).

### Cleanup

When a new avatar/resume is uploaded, the old one is deleted from GridFS to prevent orphaned files. The profile document is updated atomically with the new file reference.

## External Data Services

### Airtable (Contact Storage)

- Base ID: `app6sU4AprV9uZze6`
- Table: `Contacts`
- Used for: Contact form submissions and waitlist signups
- Integration: REST API with Bearer token auth

### Brevo (Email Marketing)

- Endpoint: `https://api.brevo.com/v3/contacts`
- List ID: `6`
- Used for: Newsletter subscriptions
- Integration: REST API with `api-key` header

### Medium RSS (Blog Content)

- Feed URL: `https://medium.com/feed/@ryaneggz`
- Parsed with `rss-parser` and `rss-to-json`
- Used in sections to display blog posts (though currently not actively rendered)

## Type Definitions

All types live in `src/types/index.ts`:

```typescript
interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface UserProfile {
  _id?: ObjectId;
  userId: ObjectId;
  links: { linkedin?; github?; twitter?; portfolio?; meetup?; other? };
  background: string;
  seeking: string | string[];
  resumeId?: ObjectId;
  isPublic?: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Contact {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}
```

---

## Type and schema reference

### MongoDB Collections

#### `users`

```typescript
{
  _id: ObjectId,                    // auto
  email: string,                    // unique index
  passwordHash: string,            // bcrypt, 12 rounds
  name: string,
  emailVerified: boolean,          // default false, unused
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `{ email: 1 }` (unique)
**CRUD:** `src/lib/models/User.ts`

#### `profiles`

```typescript
{
  _id: ObjectId,                    // auto
  userId: ObjectId,                 // unique index, FK → users._id
  links: {
    linkedin?: string,              // validated URL (http/https)
    github?: string,
    twitter?: string,
    portfolio?: string,
    meetup?: string,
    other?: string
  },
  background: string,              // markdown/HTML, max 5000 chars
  seeking: string | string[],      // "work" | "hiring" | "networking" | "other"
  resumeId?: ObjectId,             // FK → GridFS resumes bucket
  isPublic?: boolean,              // controls member directory visibility
  avatarUrl?: string,              // path: "/api/avatars/{gridfs_id}"
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `{ userId: 1 }` (unique)
**CRUD:** `src/lib/models/Profile.ts`
**Note:** `seeking` accepts both string and string[] for backward compatibility

#### GridFS: `avatars`

```typescript
// avatars.files
{
  _id: ObjectId,
  filename: string,
  contentType: "image/jpeg" | "image/png" | "image/webp",
  length: number,                   // max 5MB
  uploadDate: Date,
  metadata: {
    userId: string,
    originalName: string
  }
}
```

#### GridFS: `resumes`

```typescript
// resumes.files
{
  _id: ObjectId,
  filename: string,
  contentType: "application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  length: number,                   // max 10MB
  uploadDate: Date,
  metadata: {
    userId: string,
    originalName: string
  }
}
```

### TypeScript Types (`src/types/index.ts`)

```typescript
interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface UserProfile {
  _id?: ObjectId;
  userId: ObjectId;
  links: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
    meetup?: string;
    other?: string;
  };
  background: string;
  seeking: string | string[];
  resumeId?: ObjectId;
  isPublic?: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Contact {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

interface Blog {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  guid: string;
  categories: string[];
  isoDate: string;
}

interface ResumeMetadata {
  _id: ObjectId;
  filename: string;
  contentType: string;
  length: number;
  uploadDate: Date;
}
```

### JWT Token Payload

```typescript
{
  userId: string,     // users._id as string
  email: string,
  name: string,
  iat: number,        // issued at (unix timestamp)
  exp: number         // expires at (iat + 30 days)
}
```

### Auth Context State

```typescript
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### Aggregation: Members Query

The `/api/members` endpoint uses a MongoDB aggregation pipeline:

```
profiles (isPublic: true)
  → $lookup users (localField: userId, foreignField: _id)
  → $addFields { name: users[0].name }
  → $project (exclude sensitive fields)
  → $match (seeking filter, background text search)
  → $skip/$limit OR $sample (pagination or random)
```
