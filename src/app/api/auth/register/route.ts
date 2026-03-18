import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Password registration is deprecated. Use magic link at /login." },
    { status: 410 },
  );
}
