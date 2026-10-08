import { console_ } from "@/lib/catalog";
import { Badge, Button } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Sourcing Desk" };

export default async function ConsoleSourcingDeskPage() {
  await requirePermission("console.sourcing_desk");
  const stats = [
    { label: "Open briefs", value: "23", hint: "Across two desks" },
    { label: "Value in play", value: "$4.8M", hint: "Sample figure" },
    { label: "SLA breaches", value: "1", hint: "SD-771 · 4 hrs left" },
    { label: "Matched this week", value: "9", hint: "Awaiting buyer confirmation" },
  ];

  const desks = [
    ["Desk A", "R. Chowdhury · I. Hossain", "14 briefs", "$3.4M"],
    ["Desk B", "S. Karim", "9 briefs", "$1.4M"],
  ];

  return (
    <>
      <WorkspaceHeader
        title="Sourcing Desk"
        description="Managed briefs with named officers and SLA clocks. Escalate before the clock expires, not after."
        actions={
          <>
            <Button variant="outline" size="sm">
              Officer roster
            </Button>
            <Button variant="navy" size="sm">
              Assign brief
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Active briefs">
        <DataTable
          columns={[
            { key: "id", label: "Brief", emphasis: true },
            { key: "lead", label: "Requirement" },
            { key: "owner", label: "Owner" },
            { key: "value", label: "Value" },
            { key: "sla", label: "SLA" },
            { key: "status", label: "Status", pill: true },
          ]}
          rows={console_.desk}
        />
      </Section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <p className="label-xs">Desk performance</p>
          <div className="mt-4 space-y-4">
            {[
              ["Briefs matched within SLA", 92],
              ["Buyer confirmation rate", 74],
              ["Repeat briefs from the same buyer", 61],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-ink">{label}</p>
                  <p className="font-display text-sm font-bold text-primary">{value}%</p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <p className="label-xs">Desks</p>
            <div className="mt-3 space-y-3">
              {desks.map(([name, staff, briefs, value]) => (
                <div key={name} className="rounded-lg bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary">{name}</p>
                    <Badge tone="navy">{briefs}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-slate-500">{staff}</p>
                  <p className="text-[12px] font-semibold text-ink">{value} in play</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <p className="label-xs">Escalation</p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Briefs within four hours of SLA expiry page the desk lead. Two
              briefs are currently in that window.
            </p>
            <Button variant="navy" size="sm" className="mt-3 w-full">
              View expiring
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
