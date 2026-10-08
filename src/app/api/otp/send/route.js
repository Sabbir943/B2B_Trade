import { NextResponse } from "next/server";
import { sendOtp } from "@/lib/otp";
import { clientIp, errorResponse } from "../response";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = await sendOtp({
      email: body?.email,
      ip: clientIp(request),
    });
    return NextResponse.json(payload);
  } catch (error) {
    return errorResponse(error, "Could not send the code. Try again.");
  }
}
