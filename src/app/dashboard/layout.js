import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import BrandLogo from "@/components/brand-logo";
import { requireRole } from "@/lib/session";
import { WORKSPACE_ROLES } from "@/lib/permissions";

export const metadata = { title: "Dashboard" };

function ShellFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
      <BrandLogo />
      <p className="text-sm text-slate-500">Loading your dashboard…</p>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}

async function DashboardShell({ children }) {
  const { user, role, tier } = await requireRole(WORKSPACE_ROLES, "/dashboard");

  return (
    <AppShell
      variant="member"
      role={role}
      tier={tier}
      user={{ name: user.name }}
    >
      {children}
    </AppShell>
  );
}
