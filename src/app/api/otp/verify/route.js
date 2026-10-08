import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { errorResponse } from "../response";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = await verifyOtp({
      email: body?.email,
      code: body?.code,
    });
    return NextResponse.json(payload);
  } catch (error) {
    return errorResponse(error, "Could not verify the code. Try again.");
  }
}
