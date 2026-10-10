import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendStaffLoginCode } from "@/lib/staff-2fa";
import { errorResponse } from "../../otp/response";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
    }
    const payload = await sendStaffLoginCode({
      email: session.user.email,
      role: session.user.role || "company_member",
    });
    return NextResponse.json(payload);
  } catch (error) {
    return errorResponse(error, "Could not send the login code. Try again.");
  }
}
