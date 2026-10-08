import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import BrandLogo from "@/components/brand-logo";
import { requireRole } from "@/lib/session";
import { ROLES } from "@/lib/permissions";

export const metadata = { title: "Super-Admin Console" };

function ShellFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
      <BrandLogo />
      <p className="text-sm text-slate-500">Loading console…</p>
    </div>
  );
}

export default function ConsoleLayout({ children }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <ConsoleShell>{children}</ConsoleShell>
    </Suspense>
  );
}

async function ConsoleShell({ children }) {
  const { user, role } = await requireRole([ROLES.SUPER_ADMIN], "/console");

  return (
    <AppShell
      variant="console"
      role={role}
      user={{ name: user.name }}
      notice="Super-Admin console — revenue, pricing, Sourcing Desk and audit rows are sample data, but access to this console is restricted to the single Super Admin account."
    >
      {children}
    </AppShell>
  );
}
