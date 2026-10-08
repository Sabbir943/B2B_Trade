import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let database = "down";
  try {
    await db.command({ ping: 1 });
    database = "up";
  } catch {
    // Reported below; a health check must still answer.
  }

  return NextResponse.json({
    ok: true,
    service: "alliedone-web",
    database,
  });
}
