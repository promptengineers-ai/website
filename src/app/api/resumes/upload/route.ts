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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported. Please upload PDF, DOC, or DOCX' },
        { status: 400 }
      );
    }

    // Get GridFS bucket
    const bucket = await getGridFSBucket();

    // Delete old resume if exists
    const profile = await getProfileByUserId(auth.user.id);
    if (profile?.resumeId) {
      try {
        await bucket.delete(new ObjectId(profile.resumeId));
      } catch (err) {
        console.log('Old resume not found or already deleted');
      }
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create upload stream
    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        userId: auth.user.id,
        uploadDate: new Date(),
        contentType: file.type,
      },
    });

    // Write buffer to stream
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);

    // Wait for upload to complete
    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    // Update profile with new resume ID
    await updateProfile(auth.user.id, {
      resumeId: uploadStream.id.toString(),
    });

    const response = NextResponse.json(
      {
        message: 'Resume uploaded successfully',
        resumeId: uploadStream.id.toString(),
        filename: file.name,
        size: file.size,
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
    return NextResponse.json({ error: 'Failed to upload resume' }, { status: 500 });
  }
}
