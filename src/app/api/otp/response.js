import { NextResponse } from "next/server";

/** Maps a thrown `httpError` from @/lib/otp into a JSON response. */
export function errorResponse(error, fallback = "Server error") {
  if (Number.isInteger(error?.status)) {
    const body = { error: error.message || fallback };
    if (error.data && typeof error.data === "object") {
      Object.assign(body, error.data);
    }
    return NextResponse.json(body, { status: error.status });
  }

  console.error("[otp] unexpected error", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
