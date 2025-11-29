import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { PROFILES_COLLECTION } from "@/lib/models/Profile";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const seeking = searchParams.get("seeking");
    const location = searchParams.get("location");
    const random = searchParams.get("random") === "true";

    const db = await getDb();
    const collection = db.collection(PROFILES_COLLECTION);

    const query: any = { isPublic: true };

    if (seeking) {
      query.seeking = seeking;
    }

    if (location) {
      // Simple case-insensitive search in background for location
      query.background = { $regex: location, $options: "i" };
    }

    let pipeline: any[] = [{ $match: query }];

    // Lookup user details (name)
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    });

    pipeline.push({ $unwind: "$user" });

    // Project necessary fields
    pipeline.push({
      $project: {
        _id: 1,
        userId: 1,
        name: "$user.name",
        avatarUrl: 1,
        seeking: 1,
        background: 1,
        links: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    // Randomization or Pagination
    if (random) {
      pipeline.push({ $sample: { size: limit } });
    } else {
      pipeline.push({ $sort: { updatedAt: -1 } });
      pipeline.push({ $skip: (page - 1) * limit });
      pipeline.push({ $limit: limit });
    }

    const members = await collection.aggregate(pipeline).toArray();

    // Get total count for pagination (only if not random)
    let total = 0;
    if (!random) {
      const countResult = await collection.countDocuments(query);
      total = countResult;
    }

    return NextResponse.json({
      members: members.map((m) => ({
        ...m,
        _id: m._id.toString(),
        userId: m.userId.toString(),
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      pagination: random
        ? null
        : {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
    });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}

