import { admin } from "@/lib/catalog";
import { getPricingSettings } from "@/lib/membership";
import { Badge, Button } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import TrialGrantForm from "@/components/trial-grant-form";

export const metadata = { title: "Members" };

export default async function AdminMembersPage() {
  await requirePermission("admin.members");
  const settings = await getPricingSettings();

  const stats = [
    { label: "Total members", value: "1,284", hint: "+312 in 30 days" },
    { label: "Active", value: "1,201", hint: "93.5% of base" },
    { label: "Pending", value: "48", hint: "Awaiting approval" },
    { label: "Suspended", value: "35", hint: "Review each quarter" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Members"
        description="Every company on the platform — plan, country and lifecycle status. Suspension always requires a reason."
        actions={
          <>
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
            <Button variant="navy" size="sm">
              Invite member
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Member directory">
        <DataTable
          columns={[
            { key: "id", label: "Member ID", emphasis: true },
            { key: "company", label: "Company" },
            { key: "plan", label: "Plan" },
            { key: "country", label: "Country" },
            { key: "joined", label: "Joined" },
            { key: "status", label: "Status", pill: true },
          ]}
          rows={admin.members}
        />
      </Section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
        {[
          ["Approve pending", "48 companies waiting on document checks."],
          ["Review suspensions", "35 accounts flagged for quarterly review."],
        ].map(([title, text]) => (
          <div key={title} className="panel p-5">
            <p className="font-display text-base font-bold text-primary">{title}</p>
            <p className="mt-1 text-[13px] leading-6 text-slate-600">{text}</p>
            <Button variant="outline" size="sm" className="mt-3">
              Open
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Member directory rows are sample data — trial grants run against the real account
        database.
      </p>
    </>
  );
}
