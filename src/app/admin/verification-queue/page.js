import { admin } from "@/lib/catalog";
import { Badge, Button } from "@/components/ui";
import { CheckIcon, ShieldIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getStaffStatuses } from "@/lib/audit";
import { decideVerificationCase } from "@/lib/actions";
import { RowActions } from "@/components/staff-actions";

export const metadata = { title: "Verification queue" };

export default async function AdminVerificationQueuePage() {
  await requirePermission("admin.verification_queue");
  const statuses = await getStaffStatuses("verification_case");
  const rows = admin.queue.map((item) => ({
    ...item,
    status: statuses[item.id]?.status ?? "Open",
  }));
  const stats = [
    { label: "Open cases", value: "24", hint: "4 older than 48 hrs" },
    { label: "Median review", value: "9 hrs", hint: "Target 24 hrs" },
    { label: "Audits scheduled", value: "6", hint: "This week" },
    { label: "Rejections (30d)", value: "11", hint: "Mostly missing licences" },
  ];

  const checklist = [
    "Registration documents match the registry extract",
    "Trade licence is current and category-appropriate",
    "Bank letter is on letterhead with a verifiable contact",
    "Certificates cover the products actually listed",
    "Factory address confirmed before scheduling an audit",
  ];

  return (
    <>
      <WorkspaceHeader
        title="Verification queue"
        description="Cases ordered by age and risk. Approving a case publishes the badge immediately across search and listings."
        actions={
          <>
            <Button variant="outline" size="sm">
              Assign cases
            </Button>
            <Button variant="navy" size="sm">
              Next case
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Queue">
        <DataTable
          columns={[
            { key: "id", label: "Case", emphasis: true },
            { key: "company", label: "Company" },
            { key: "type", label: "Check" },
            { key: "submitted", label: "Submitted" },
            { key: "age", label: "Age" },
            { key: "risk", label: "Risk", pill: true },
            { key: "status", label: "Status", pill: true },
            {
              key: "actions",
              label: "Decision",
              render: (row) => (
                <RowActions
                  id={row.id}
                  onAction={decideVerificationCase}
                  actions={[
                    { label: "Approve", value: "Approved" },
                    { label: "Request visit", value: "Visit requested" },
                    { label: "Reject", value: "Rejected", tone: "danger" },
                  ]}
                />
              ),
            },
          ]}
          rows={rows}
        />
      </Section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-6">
          <p className="flex items-center gap-2 text-sm font-bold text-primary">
            <ShieldIcon className="h-4 w-4 text-secondary" />
            Review standard
          </p>
          <ul className="mt-3 space-y-2.5">
            {checklist.map((item) => (
              <li key={item} className="flex gap-2.5 text-[13px] leading-6 text-slate-600">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/12 text-success">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <p className="label-xs">By check type</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                ["Company", "11"],
                ["Documents", "9"],
                ["Factory", "4"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-surface p-3 text-center">
                  <p className="font-display text-xl font-bold text-primary">{value}</p>
                  <p className="text-[12px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <p className="label-xs">Escalation rule</p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              High-risk cases route to a Super Admin automatically after 24
              hours and cannot be approved by the assigning officer alone.
            </p>
            <Badge tone="amber" className="mt-3">
              Dual approval required
            </Badge>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Sample queue rows — but every decision is enforced server-side and
        written to the audit log with actor, role and case ID.
      </p>
    </>
  );
}
