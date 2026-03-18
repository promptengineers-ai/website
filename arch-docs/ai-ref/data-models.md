# Data Models

## MongoDB Collections

### `users`
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

### `profiles`
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

### GridFS: `avatars`
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

### GridFS: `resumes`
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

## TypeScript Types (`src/types/index.ts`)

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

## JWT Token Payload

```typescript
{
  userId: string,     // users._id as string
  email: string,
  name: string,
  iat: number,        // issued at (unix timestamp)
  exp: number         // expires at (iat + 30 days)
}
```

## Auth Context State

```typescript
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

## Aggregation: Members Query

The `/api/members` endpoint uses a MongoDB aggregation pipeline:
```
profiles (isPublic: true)
  → $lookup users (localField: userId, foreignField: _id)
  → $addFields { name: users[0].name }
  → $project (exclude sensitive fields)
  → $match (seeking filter, background text search)
  → $skip/$limit OR $sample (pagination or random)
```
