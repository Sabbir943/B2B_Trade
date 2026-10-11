import { Badge } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { ROLE_MATRIX, ROLE_LABELS, ROLES } from "@/lib/permissions";
import { countUsersByRole, listUsers } from "@/lib/users";
import RoleAssignForm from "@/components/role-assign-form";
import StaffAccessManager from "@/components/staff-access-manager";

export const instant = false;

export const metadata = { title: "Roles & access" };

const STAFF_ROLE_KEYS = [
  ROLES.STAFF_VERIFIER,
  ROLES.STAFF_SUPPORT,
  ROLES.STAFF_CONTENT,
  ROLES.STAFF_SALES,
  ROLES.SUPER_ADMIN,
];

const SCOPES = Object.fromEntries(ROLE_MATRIX);

export default async function AdminRolesPage() {
  await requirePermission("admin.roles");
  const [roleCounts, users] = await Promise.all([countUsersByRole(), listUsers()]);

  const staffTotal = STAFF_ROLE_KEYS.reduce((sum, key) => sum + (roleCounts.get(key) || 0), 0);
  const superAdmins = users.filter((user) => user.role === ROLES.SUPER_ADMIN);
  const staffAccounts = users
    .filter((user) => STAFF_ROLE_KEYS.includes(user.role) && user.role !== ROLES.SUPER_ADMIN)
    .map((user) => ({
      email: user.email,
      name: user.name || user.email,
      role: user.role,
      extraPermissions: Array.isArray(user.extraPermissions) ? user.extraPermissions : [],
    }));

  const stats = [
    { label: "Staff accounts", value: String(staffTotal), hint: "Holding any staff role" },
    { label: "Super Admin", value: String(roleCounts.get(ROLES.SUPER_ADMIN) || 0), hint: "Exactly one allowed" },
    { label: "Company members", value: String(roleCounts.get(ROLES.COMPANY_MEMBER) || 0), hint: "Default role" },
    { label: "Verification partners", value: String(roleCounts.get(ROLES.VERIFICATION_PARTNER) || 0), hint: "Task-scoped access" },
  ];

  const rows = STAFF_ROLE_KEYS.map((key) => ({
    id: key,
    role: ROLE_LABELS[key],
    members: String(roleCounts.get(key) || 0),
    scope: SCOPES[key] || "—",
    holders:
      users
        .filter((user) => user.role === key)
        .map((user) => user.email)
        .join(", ") || "—",
  }));

  return (
    <>
      <WorkspaceHeader
        title="Roles & access"
        description="Staff permissions with least-privilege defaults. Counts below are live accounts in the user collection."
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Staff roles">
        <DataTable
          columns={[
            { key: "role", label: "Role", emphasis: true },
            { key: "members", label: "Accounts" },
            { key: "scope", label: "Scope" },
            { key: "holders", label: "Holders" },
          ]}
          rows={rows}
        />
      </Section>

      <Section className="mt-8" title="Staff accounts">
        <div className="panel p-5">
          <p className="text-[13px] leading-6 text-slate-600">
            Create a staff login, take away a staff login, or grant one account
            an extra permission. Every change is written to the audit log with
            your name and the reason.
          </p>
          <div className="mt-4">
            <StaffAccessManager initialStaff={staffAccounts} />
          </div>
        </div>
      </Section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-6">
          <p className="flex items-center gap-2 text-sm font-bold text-primary">
            <ShieldIcon className="h-4 w-4 text-secondary" />
            Permission matrix
          </p>
          <p className="mt-1 text-[13px] text-slate-500">
            Mirrors the enforced server rules in src/lib/permissions.js.
          </p>
          <div className="mt-4 space-y-3">
            {ROLE_MATRIX.map(([role, scope]) => (
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
            <p className="label-xs">Super Admin</p>
            {superAdmins.length ? (
              <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
                {superAdmins.map((user) => (
                  <li key={user.email} className="flex items-center justify-between gap-3">
                    <span className="truncate font-semibold text-ink">{user.email}</span>
                    <Badge tone="green">active</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                No Super Admin provisioned yet — assign one here or with{" "}
                <span className="font-mono text-[12px]">scripts/set-role.mjs</span>.
              </p>
            )}
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
    </>
  );
}
