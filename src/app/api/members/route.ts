import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { PROFILES_COLLECTION } from "@/lib/models/Profile";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const seeking = searchParams.get("seeking");
    const location = searchParams.get("location");
    const name = searchParams.get("name");
    const random = searchParams.get("random") === "true";

    const db = await getDb();
    const collection = db.collection(PROFILES_COLLECTION);

    const query: Record<string, unknown> = { isPublic: true };

    if (seeking) {
      query.seeking = seeking;
    }

    if (location) {
      const escapedLocation = location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.background = { $regex: escapedLocation, $options: "i" };
    }

    const pipeline: Record<string, unknown>[] = [{ $match: query }];

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
        email: "$user.email",
        avatarUrl: 1,
        seeking: 1,
        background: 1,
        links: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    // Name filter (applied after $project since name comes from $lookup)
    if (name) {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      pipeline.push({
        $match: { name: { $regex: escapedName, $options: "i" } },
      });
    }

    // Randomization or Pagination
    if (random) {
      pipeline.push({ $sample: { size: limit } });

      const members = await collection.aggregate(pipeline).toArray();

      return NextResponse.json({
        members: members.map((m) => ({
          ...m,
          _id: m._id.toString(),
          userId: m.userId.toString(),
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        })),
        pagination: null,
      });
    }

    // Use $facet to get both results and total in one query
    // (needed because name filter is post-lookup)
    pipeline.push({
      $facet: {
        results: [
          { $sort: { updatedAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ],
        total: [{ $count: "count" }],
      },
    });

    const [facetResult] = await collection.aggregate(pipeline).toArray();
    const members = facetResult?.results || [];
    const total = facetResult?.total?.[0]?.count || 0;

    return NextResponse.json({
      members: members.map((m: Record<string, unknown>) => ({
        ...m,
        _id: String(m._id),
        userId: String(m.userId),
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      pagination: {
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
