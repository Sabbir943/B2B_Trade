import { admin } from "@/lib/catalog";
import { Badge, Button } from "@/components/ui";
import { AlertIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Inquiries & disputes" };

export default async function AdminInquiriesPage() {
  await requirePermission("admin.inquiries");
  const stats = [
    { label: "Flagged (30d)", value: "27", hint: "6 open" },
    { label: "Escalated", value: "4", hint: "Awaiting officer" },
    { label: "Median resolution", value: "18 hrs", hint: "Target 24 hrs" },
    { label: "Off-platform attempts", value: "12", hint: "Auto-warned" },
  ];

  const playbook = [
    ["Pricing outside band", "Confirm quoted basis before contacting either party."],
    ["Off-platform payment", "Warn first offence; suspend for repeat attempts."],
    ["Repeated no-response", "Nudge both sides, then re-route the lead."],
  ];

  return (
    <>
      <WorkspaceHeader
        title="Inquiries & disputes"
        description="Flagged threads from the trust system. Every action is logged against the member record."
        actions={
          <>
            <Button variant="outline" size="sm">
              Escalation policy
            </Button>
            <Button variant="navy" size="sm">
              Open next case
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Case list">
        <DataTable
          columns={[
            { key: "id", label: "Case", emphasis: true },
            { key: "parties", label: "Parties" },
            { key: "reason", label: "Reason" },
            { key: "time", label: "Raised" },
            { key: "status", label: "Status", pill: true },
          ]}
          rows={admin.inquiries}
        />
      </Section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <p className="label-xs">Response playbook</p>
          <div className="mt-3 space-y-3">
            {playbook.map(([title, text]) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-1 text-[13px] leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-primary">
            <AlertIcon className="h-4 w-4 text-secondary" />
            Live alert
          </p>
          <Badge tone="red" className="mt-3">
            Off-platform payment
          </Badge>
          <p className="mt-2 text-[13px] leading-6 text-slate-600">
            Case IQ-2284 includes a shared bank detail in thread. The message is
            hidden pending review; both members received an automatic notice.
          </p>
          <Button variant="navy" size="sm" className="mt-4 w-full">
            Review thread
          </Button>
        </div>
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Sample data shown for preview purposes.
      </p>
    </>
  );
}
