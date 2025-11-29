import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { getGridFSBucket } from '@/lib/mongodb';
import { getProfileByUserId, updateProfile } from '@/lib/models/Profile';
import {
  clearAuthCookie,
  getAuthFromCookies,
  refreshAuthToken,
  setAuthCookie,
  shouldRefreshToken,
} from '@/lib/jwt';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export async function POST(request: Request) {
  try {
    const auth = getAuthFromCookies();

    if (!auth?.user?.id) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      clearAuthCookie(response);
      return response;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported. Please upload JPEG, PNG, or WebP' },
        { status: 400 }
      );
    }

    const bucket = await getGridFSBucket('avatars');

    // Delete old avatar if exists
    const profile = await getProfileByUserId(auth.user.id);
    if (profile?.avatarUrl) {
      // Extract ID from URL /api/avatars/<id>
      const match = profile.avatarUrl.match(/\/api\/avatars\/([a-f0-9]{24})/);
      if (match && match[1]) {
        try {
          await bucket.delete(new ObjectId(match[1]));
        } catch (err) {
          console.log('Old avatar not found or already deleted');
        }
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        userId: auth.user.id,
        uploadDate: new Date(),
        contentType: file.type,
      },
    });

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    const avatarUrl = `/api/avatars/${uploadStream.id.toString()}`;

    await updateProfile(auth.user.id, {
      avatarUrl: avatarUrl,
    });

    const response = NextResponse.json(
      {
        message: 'Avatar uploaded successfully',
        avatarUrl: avatarUrl,
      },
      { status: 200 }
    );

    if (shouldRefreshToken(auth.payload)) {
      const refreshed = refreshAuthToken(auth.payload);
      setAuthCookie(response, refreshed);
    }

    return response;
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

