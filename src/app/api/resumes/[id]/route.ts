import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { getGridFSBucket } from '@/lib/mongodb';
import { getProfileByUserId, updateProfile } from '@/lib/models/Profile';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify the resume belongs to the user
    const profile = await getProfileByUserId(session.user.id);
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
    return new Response(buffer, {
      headers: {
        'Content-Type': (file.metadata as any)?.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${file.filename}"`,
        'Content-Length': file.length.toString(),
      },
    });
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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify the resume belongs to the user
    const profile = await getProfileByUserId(session.user.id);
    if (!profile || profile.resumeId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const bucket = await getGridFSBucket();

    // Delete file from GridFS
    await bucket.delete(new ObjectId(id));

    // Remove resume reference from profile
    await updateProfile(session.user.id, {
      resumeId: undefined,
    });

    return NextResponse.json(
      { message: 'Resume deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
  }
}
