import { admin } from "@/lib/catalog";
import { Badge, Button } from "@/components/ui";
import { GlobeIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Market Entry applications" };

export default async function AdminMarketEntryPage() {
  await requirePermission("admin.market_entry");
  const stats = [
    { label: "Open applications", value: "12", hint: "3 submitted this week" },
    { label: "In documents", value: "5", hint: "Waiting on members" },
    { label: "Approved (30d)", value: "4", hint: "Engagements starting" },
    { label: "Median time to scope", value: "4 days", hint: "Target 5 days" },
  ];

  const stages = [
    ["Received", "Scoping call booked within two working days."],
    ["Documents", "Import licences, certifications and target specs collected."],
    ["Interview", "Officer walks the member through the engagement scope."],
    ["Approved", "Fee agreed; sourcing officer assigned."],
  ];

  return (
    <>
      <WorkspaceHeader
        title="Market Entry applications"
        description="Overseas brands and importers applying for a managed Bangladesh entry. Each application gets one named officer."
        actions={
          <>
            <Button variant="outline" size="sm">
              Officer workload
            </Button>
            <Button variant="navy" size="sm">
              Assign officer
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Applications">
        <DataTable
          columns={[
            { key: "id", label: "Ref", emphasis: true },
            { key: "company", label: "Company" },
            { key: "market", label: "Target market" },
            { key: "submitted", label: "Submitted" },
            { key: "stage", label: "Stage", pill: true },
            { key: "officer", label: "Officer" },
          ]}
          rows={admin.applications}
        />
      </Section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-6">
          <p className="flex items-center gap-2 text-sm font-bold text-primary">
            <GlobeIcon className="h-4 w-4 text-secondary" />
            Stage definitions
          </p>
          <ol className="mt-4 space-y-3">
            {stages.map(([stage, text], index) => (
              <li key={stage} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary font-display text-[12px] font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{stage}</p>
                  <p className="text-[13px] leading-6 text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <p className="label-xs">Officer workload</p>
            <div className="mt-3 space-y-2.5">
              {[
                ["R. Chowdhury", "6 applications"],
                ["S. Karim", "4 applications"],
                ["I. Hossain", "2 applications"],
              ].map(([name, load]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-600">{name}</span>
                  <Badge tone="navy">{load}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <p className="label-xs">SLA reminder</p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Applications untouched for 3 working days escalate to the desk
              lead. Two applications are currently at day three.
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Show overdue
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Sample data shown for preview purposes.
      </p>
    </>
  );
}
