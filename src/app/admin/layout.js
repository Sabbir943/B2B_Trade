import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import BrandLogo from "@/components/brand-logo";
import { requireRole } from "@/lib/session";
import { STAFF_ROLES } from "@/lib/permissions";

export const metadata = { title: "Staff Admin" };

function ShellFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
      <BrandLogo />
      <p className="text-sm text-slate-500">Loading admin workspace…</p>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }) {
  const { user, role } = await requireRole(STAFF_ROLES, "/admin");

  return (
    <AppShell
      variant="admin"
      role={role}
      user={{ name: user.name }}
      notice="Staff admin preview — members, queues and moderation rows are sample data. Every staff action here is checked on the server and written to the audit log."
    >
      {children}
    </AppShell>
  );
}
