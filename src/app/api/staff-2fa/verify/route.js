import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyStaffLoginCode } from "@/lib/staff-2fa";
import { errorResponse } from "../../otp/response";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const payload = await verifyStaffLoginCode({
      email: session.user.email,
      role: session.user.role || "company_member",
      code: body?.code,
    });
    return NextResponse.json(payload);
  } catch (error) {
    return errorResponse(error, "Could not verify the code. Try again.");
  }
}
