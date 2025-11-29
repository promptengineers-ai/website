import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getGridFSBucket } from "@/lib/mongodb";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid avatar ID" },
        { status: 400 }
      );
    }

    const bucket = await getGridFSBucket("avatars");
    const id = new ObjectId(params.id);

    // Check if file exists
    const files = await bucket.find({ _id: id }).toArray();
    if (files.length === 0) {
      return NextResponse.json(
        { error: "Avatar not found" },
        { status: 404 }
      );
    }

    const file = files[0];
    const stream = bucket.openDownloadStream(id);
    
    // We need to return a ReadableStream for Next.js
    const readableStream = new ReadableStream({
        start(controller) {
            stream.on('data', (chunk) => controller.enqueue(chunk));
            stream.on('end', () => controller.close());
            stream.on('error', (err) => controller.error(err));
        }
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": (file.metadata?.contentType as string) || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Avatar fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch avatar" },
      { status: 500 }
    );
  }
}

