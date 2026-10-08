import { admin } from "@/lib/catalog";
import { Badge, Button } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { ROLE_MATRIX } from "@/lib/permissions";
import RoleAssignForm from "@/components/role-assign-form";

export const metadata = { title: "Roles & access" };

export default async function AdminRolesPage() {
  await requirePermission("admin.roles");
  const stats = [
    { label: "Staff accounts", value: "32", hint: "Across 5 roles" },
    { label: "MFA coverage", value: "84%", hint: "Target 100%" },
    { label: "Pending invites", value: "3", hint: "Expire in 5 days" },
    { label: "Access reviews", value: "2", hint: "Due this month" },
  ];

  const permissions = ROLE_MATRIX;

  return (
    <>
      <WorkspaceHeader
        title="Roles & access"
        description="Staff permissions with least-privilege defaults. Sensitive roles require MFA and quarterly access review."
        actions={
          <>
            <Button variant="outline" size="sm">
              Access review
            </Button>
            <Button variant="navy" size="sm">
              Invite staff
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Roles">
        <DataTable
          columns={[
            { key: "role", label: "Role", emphasis: true },
            { key: "members", label: "Staff" },
            { key: "scope", label: "Scope" },
            { key: "mfa", label: "MFA", pill: true },
          ]}
          rows={admin.roles}
        />
      </Section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-6">
          <p className="flex items-center gap-2 text-sm font-bold text-primary">
            <ShieldIcon className="h-4 w-4 text-secondary" />
            Permission matrix
          </p>
          <div className="mt-4 space-y-3">
            {permissions.map(([role, scope]) => (
              <div
                key={role}
                className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <Badge tone="navy" className="shrink-0 sm:w-40">
                  {role}
                </Badge>
                <p className="text-[13px] leading-6 text-slate-600">{scope}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <p className="label-xs">Security posture</p>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-6 text-slate-600">
              <li className="flex justify-between gap-3">
                <span>MFA on privileged roles</span>
                <span className="font-semibold text-success">Enforced</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Session length (staff)</span>
                <span className="font-semibold text-ink">8 hours</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>IP allowlist (console)</span>
                <span className="font-semibold text-amber-600">Partial</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Last access review</span>
                <span className="font-semibold text-ink">12 Sep 2026</span>
              </li>
            </ul>
            <Button variant="navy" size="sm" className="mt-4 w-full">
              Complete IP allowlist
            </Button>
          </div>

          <div className="panel p-5">
            <p className="label-xs">Assign a role</p>
            <p className="mt-1 text-[13px] leading-6 text-slate-600">
              Staff roles are assigned by the Super Admin. Role edits write an
              immutable audit entry (actor, target, from → to); a second Super
              Admin cannot be created while one exists.
            </p>
            <div className="mt-4">
              <RoleAssignForm />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Permission matrix mirrors the enforced server rules in{" "}
        <span className="font-semibold">src/lib/permissions.js</span>; staff
        counts shown are sample figures.
      </p>
    </>
  );
}
