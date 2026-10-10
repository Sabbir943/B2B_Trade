import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { can, homeFor, isStaff, roleLabel, ROLES } from "./permissions";
import { requiresStaff2fa, staff2faFreshInDb } from "./staff-2fa";

/**
 * Server-only session + permission helpers.
 * Every guarded layout, page and server action goes through these — checks in
 * the UI are cosmetic, this is the enforcement point.
 */

export async function getSessionContext() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { session: null, user: null, role: ROLES.VISITOR };
  }

  const user = session.user;
  // Users created before the role field existed default to Company Member.
  const role = user.role || ROLES.COMPANY_MEMBER;

  return {
    session,
    user,
    role,
    roleLabel: roleLabel(role),
    tier: user.tier || "free",
    // Staff sessions are re-checked against the DB 2FA stamp in the gates
    // below (requirePermission / requireRole) — not cached on the context.
    staffRole: requiresStaff2fa(role),
  };
}

/** Requires a signed-in user; otherwise sends them to sign-in with a return path. */
export async function requireAuth(nextPath) {
  const context = await getSessionContext();
  if (!context.session) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/sign-in${next}`);
  }
  return context;
}

/**
 * The server-side permission gate.
 * Returns the session context when the role holds `permission`, otherwise
 * redirects: unauthenticated → /sign-in, wrong role → that role's home area.
 *
 * Staff and Super-Admin sessions additionally require a fresh 2FA stamp
 * (checked against the user document); missing/stale → /secure-admin-login.
 */
export async function requirePermission(permission, nextPath) {
  const context = await requireAuth(nextPath);

  if (context.staffRole && !(await staff2faFreshInDb(context.user.email))) {
    redirect("/secure-admin-login");
  }

  if (!can(context.role, permission)) {
    redirect(homeFor(context.role));
  }

  return context;
}

/** Convenience for layouts guarding an entire area. */
export async function requireRole(roles, nextPath) {
  const context = await requireAuth(nextPath);
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (context.staffRole && !(await staff2faFreshInDb(context.user.email))) {
    redirect("/secure-admin-login");
  }

  if (!allowed.includes(context.role) && context.role !== ROLES.SUPER_ADMIN) {
    redirect(homeFor(context.role));
  }

  return context;
}

/** True when the account can hold staff-area permissions. */
export { isStaff };
