# Data Layer

## Database: MongoDB

The application uses the native MongoDB Node.js driver (not Mongoose). Connection management lives in `src/lib/mongodb.ts`.

### Connection Management

```typescript
// Singleton pattern: reuse connection across hot reloads in development
const globalWithMongo = global as typeof globalThis & { _mongoClient?: MongoClient };
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

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `email` | string | **Unique index** |
| `passwordHash` | string | bcrypt hash |
| `name` | string | Display name |
| `emailVerified` | boolean | Always `false` (not implemented) |
| `createdAt` | Date | Set on creation |
| `updatedAt` | Date | Updated on modification |

#### `profiles`
Stores member profile data, linked to users.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `userId` | ObjectId | **Unique index**, references `users._id` |
| `links.linkedin` | string? | URL |
| `links.github` | string? | URL |
| `links.twitter` | string? | URL |
| `links.portfolio` | string? | URL |
| `links.meetup` | string? | URL |
| `links.other` | string? | URL |
| `background` | string | Markdown/HTML bio (max 5000 chars) |
| `seeking` | string[] or string | `"work"`, `"hiring"`, `"networking"`, `"other"` |
| `resumeId` | ObjectId? | References GridFS `resumes` bucket |
| `isPublic` | boolean? | Controls visibility in member directory |
| `avatarUrl` | string? | Path like `/api/avatars/{id}` |
| `createdAt` | Date | |
| `updatedAt` | Date | |

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

| Bucket | Purpose | Max Size | Allowed Types |
|--------|---------|----------|---------------|
| `avatars` | Profile photos | 5 MB | JPEG, PNG, WebP |
| `resumes` | Resume documents | 10 MB | PDF, DOC, DOCX |

### Upload Flow

```typescript
const bucket = getGridFSBucket('avatars');
const uploadStream = bucket.openUploadStream(filename, {
  contentType: file.type,
  metadata: { userId, originalName: file.name }
});
// Write buffer to stream, get back fileId
```

### Download Flow

```typescript
const bucket = getGridFSBucket('avatars');
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
  links: { linkedin?, github?, twitter?, portfolio?, meetup?, other? };
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
