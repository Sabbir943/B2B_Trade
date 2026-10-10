import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Fast unauthenticated gate.
 *
 * - /dashboard/* → member sign-in with a return path.
 * - /admin/* and /console/* → the standard member sign-in, with NO staff
 *   hints. The staff entry point is the hidden /secure-admin-login URL that
 *   only staff already know; the public site never links to it.
 *
 * Real role + 2FA checks run server-side in each layout/page
 * (src/lib/session.js) — the cookie test here is only a UX shortcut.
 */
export function proxy(request) {
  const sessionCookie = getSessionCookie(request);
  const { pathname, search } = request.nextUrl;

  if (!sessionCookie) {
    // Staff areas: bounce to the member sign-in without naming the endpoint.
    if (pathname.startsWith("/admin") || pathname.startsWith("/console")) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    const next = encodeURIComponent(`${pathname}${search || ""}`);
    return NextResponse.redirect(new URL(`/sign-in?next=${next}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/console/:path*"],
};
