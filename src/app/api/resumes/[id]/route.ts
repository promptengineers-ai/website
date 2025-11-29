import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getGridFSBucket } from '@/lib/mongodb';
import { getProfileByUserId, updateProfile } from '@/lib/models/Profile';
import {
  clearAuthCookie,
  getAuthFromCookies,
  refreshAuthToken,
  setAuthCookie,
  shouldRefreshToken,
} from '@/lib/jwt';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthFromCookies();

    if (!auth?.user?.id) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      clearAuthCookie(response);
      return response;
    }

    const { id } = params;

    // Verify the resume belongs to the user
    const profile = await getProfileByUserId(auth.user.id);
    if (!profile || profile.resumeId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const bucket = await getGridFSBucket();

    // Get file metadata
    const files = await bucket.find({ _id: new ObjectId(id) }).toArray();
    if (files.length === 0) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const file = files[0];

    // Create download stream
    const downloadStream = bucket.openDownloadStream(new ObjectId(id));

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return file as response
    const response = new NextResponse(buffer, {
      headers: {
        'Content-Type': (file.metadata as any)?.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${file.filename}"`,
        'Content-Length': file.length.toString(),
      },
    });

    if (shouldRefreshToken(auth.payload)) {
      const refreshed = refreshAuthToken(auth.payload);
      setAuthCookie(response, refreshed);
    }

    return response;
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download resume' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthFromCookies();

    if (!auth?.user?.id) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      clearAuthCookie(response);
      return response;
    }

    const { id } = params;

    // Verify the resume belongs to the user
    const profile = await getProfileByUserId(auth.user.id);
    if (!profile || profile.resumeId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const bucket = await getGridFSBucket();

    // Delete file from GridFS
    await bucket.delete(new ObjectId(id));

    // Remove resume reference from profile
    await updateProfile(auth.user.id, {
      resumeId: undefined,
    });

    const response = NextResponse.json(
      { message: 'Resume deleted successfully' },
      { status: 200 }
    );

    if (shouldRefreshToken(auth.payload)) {
      const refreshed = refreshAuthToken(auth.payload);
      setAuthCookie(response, refreshed);
    }

    return response;
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
  }
}
