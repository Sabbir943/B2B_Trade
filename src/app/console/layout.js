import AppShell from "@/components/app-shell";
import { requireRole } from "@/lib/session";
import { ROLES } from "@/lib/permissions";

// Super-Admin-only area. The role + 2FA check is awaited at the top of the
// layout (no Suspense), so the entire segment blocks server-side until
// authorized — nothing leaks to an unauthorized visitor.
export const instant = false;

export const metadata = { title: "Super-Admin Console" };

export default async function ConsoleLayout({ children }) {
  const { user, role } = await requireRole([ROLES.SUPER_ADMIN], "/console");

  return (
    <AppShell
      variant="console"
      role={role}
      user={{ name: user.name }}
      notice="Super-Admin console — revenue, pricing, Sourcing Desk and audit rows are live data. Access is restricted to the single Super Admin account."
    >
      {children}
    </AppShell>
  );
}
