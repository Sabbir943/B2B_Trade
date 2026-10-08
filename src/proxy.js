import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Fast unauthenticated gate; real role checks run server-side in each
  // layout/page (src/lib/session.js).
  matcher: ["/dashboard", "/admin", "/console"],
};
