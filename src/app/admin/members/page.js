import { getPricingSettings } from "@/lib/membership";
import { Badge, Button, EmptyState } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader, Pill } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { listUsers } from "@/lib/users";
import { getProfiles } from "@/lib/profile";
import { formatDate } from "@/lib/refs";
import TrialGrantForm from "@/components/trial-grant-form";
import MemberRowActions from "@/components/member-row-actions";
import { ROLE_LABELS, ROLES } from "@/lib/permissions";

export const instant = false;

export const metadata = { title: "Members" };

const PAID_TIERS = new Set(["silver", "gold", "platinum"]);

export default async function AdminMembersPage() {
  await requirePermission("admin.members");
  const [settings, users] = await Promise.all([getPricingSettings(), listUsers()]);

  const emails = users.map((user) => user.email);
  const profiles = await getProfiles(emails);
  const profileMap = profiles instanceof Map ? profiles : new Map();

  const verified = users.filter((user) => user.emailVerified).length;
  const paid = users.filter((user) => PAID_TIERS.has(user.tier)).length;
  const staff = users.filter((user) =>
    ["staff_verifier", "staff_support", "staff_content", "staff_sales", "super_admin"].includes(
      user.role,
    ),
  ).length;

  const stats = [
    { label: "Total accounts", value: String(users.length), hint: "Auth user collection" },
    { label: "Email verified", value: String(verified), hint: `${users.length - verified} unverified` },
    { label: "Paid tiers", value: String(paid), hint: "Silver / Gold / Platinum" },
    { label: "Staff accounts", value: String(staff), hint: "Across admin + console" },
  ];

  const rows = users.map((user) => ({
    id: user.email,
    company: profileMap.get(user.email)?.legalName || user.name || "—",
    plan: user.tier || "free",
    role: ROLE_LABELS[user.role] || user.role || "Company Member",
    country: profileMap.get(user.email)?.country || "—",
    joined: formatDate(user.createdAt),
    status: user.suspendedAt
      ? "suspended"
      : user.emailVerified
        ? "active"
        : "pending",
    suspendReason: user.suspendedReason || "",
    member: {
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      suspended: Boolean(user.suspendedAt),
      locked: user.role === ROLES.SUPER_ADMIN,
    },
  }));

  return (
    <>
      <WorkspaceHeader
        title="Members"
        description="Every account on the platform — plan, role and lifecycle status. Suspension always requires a reason."
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Account directory">
        {rows.length ? (
          <DataTable
            columns={[
              { key: "id", label: "Email", emphasis: true },
              { key: "company", label: "Company" },
              { key: "plan", label: "Plan" },
              { key: "role", label: "Role" },
              { key: "country", label: "Country" },
              { key: "joined", label: "Joined" },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <span className="flex flex-col gap-1">
                    <Pill>{row.status}</Pill>
                    {row.suspendReason ? (
                      <span className="max-w-[180px] text-[11px] leading-4 text-slate-500">
                        {row.suspendReason}
                      </span>
                    ) : null}
                  </span>
                ),
              },
              {
                key: "member",
                label: "Actions",
                render: (row) => <MemberRowActions {...row.member} />,
              },
            ]}
            rows={rows}
          />
        ) : (
          <EmptyState
            title="No accounts yet"
            text="Accounts appear here the moment members sign up."
          />
        )}
      </Section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <p className="font-display text-base font-bold text-primary">Silver trials</p>
          <p className="mt-1 text-[13px] leading-6 text-slate-600">
            {settings.trials.silverTrialMonths}-month free Silver trial for selected{" "}
            {settings.trials.eligibleCountry} suppliers. Trials never consume a founding
            spot.
          </p>
          <div className="mt-4">
            <TrialGrantForm
              months={settings.trials.silverTrialMonths}
              country={settings.trials.eligibleCountry}
            />
          </div>
        </div>

        <div className="panel p-5">
          <p className="font-display text-base font-bold text-primary">Role changes</p>
          <p className="mt-1 text-[13px] leading-6 text-slate-600">
            Staff roles are assigned from Roles &amp; access — every change writes an
            immutable audit entry. Only one Super Admin can exist at a time.
          </p>
          <Button href="/admin/roles" variant="outline" size="sm" className="mt-3">
            Open roles
          </Button>
        </div>
      </div>
    </>
  );
}
