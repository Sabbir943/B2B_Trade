import AppShell from "@/components/app-shell";
import { requireRole } from "@/lib/session";
import { STAFF_ROLES } from "@/lib/permissions";

// Staff-only area. The role + 2FA check is awaited at the top of the layout
// (no Suspense), so the entire segment blocks server-side until authorized —
// nothing (not even page metadata) is sent to an unauthorized visitor.
export const instant = false;

export const metadata = { title: "Staff Admin" };

export default async function AdminLayout({ children }) {
  const { user, role } = await requireRole(STAFF_ROLES, "/admin");

  return (
    <AppShell
      variant="admin"
      role={role}
      user={{ name: user.name }}
      notice="Staff admin — every table and count below is live data from the platform database. All staff actions are permission-checked on the server and written to the audit log."
    >
      {children}
    </AppShell>
  );
}
