import { admin } from "@/lib/catalog";
import { Button } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Leads routing" };

export default async function AdminLeadsPage() {
  await requirePermission("admin.leads");
  const stats = [
    { label: "Open leads", value: "14", hint: "3 need routing today" },
    { label: "Routed (30d)", value: "216", hint: "92% acceptance" },
    { label: "Median routing time", value: "3.4 hrs", hint: "Target 8 hrs" },
    { label: "Lead value in play", value: "$1.9M", hint: "Sample figure" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Lead routing"
        description="Buy requirements matched to suppliers. Route manually when the match score is below threshold or the category is contested."
        actions={
          <>
            <Button variant="outline" size="sm">
              Routing rules
            </Button>
            <Button variant="navy" size="sm">
              Auto-route eligible
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Lead pipeline">
        <DataTable
          columns={[
            { key: "id", label: "Lead", emphasis: true },
            { key: "title", label: "Requirement" },
            { key: "routed", label: "Routed to" },
            { key: "value", label: "Value" },
            { key: "quality", label: "Quality", pill: true },
            { key: "status", label: "Status", pill: true },
          ]}
          rows={admin.leads}
        />
      </Section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Hot leads", "Route within 1 hour — buyer is actively comparing."],
          ["Warm leads", "Route same day; supplier has time to prepare terms."],
          ["Below threshold", "Hold for manual review; never auto-route."],
        ].map(([title, text]) => (
          <div key={title} className="panel p-5">
            <p className="font-display text-base font-bold text-primary">{title}</p>
            <p className="mt-1 text-[13px] leading-6 text-slate-600">{text}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Sample data shown for preview purposes.
      </p>
    </>
  );
}
