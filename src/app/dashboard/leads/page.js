import { dashboard } from "@/lib/catalog";
import { Badge, Button, ProgressBar } from "@/components/ui";
import { TagIcon } from "@/components/icons";
import { Pill, SampleNote, Section, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Matched leads" };

export default async function LeadsPage() {
  await requirePermission("member.leads");
  return (
    <>
      <WorkspaceHeader
        title="Matched leads"
        description="Buy requirements scored against your categories, certifications and shipping history. Higher match means a better shot."
        actions={
          <>
            <Button href="/requirements" variant="outline" size="sm">
              Browse the board
            </Button>
            <Button variant="navy" size="sm">
              <TagIcon className="h-4 w-4" /> Tune matches
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone="navy">{dashboard.leads.length} active matches</Badge>
        <Badge tone="slate">Refreshed hourly</Badge>
        <Badge tone="amber">2 need a reply today</Badge>
      </div>

      <div className="space-y-3">
        {dashboard.leads.map((lead) => (
          <div key={lead.title} className="panel p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 sm:w-72">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-white">
                  {lead.match}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{lead.title}</p>
                  <p className="text-[12px] text-slate-500">
                    {lead.country} · {lead.value}
                  </p>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <ProgressBar value={lead.match} className="h-2" />
                <p className="mt-1.5 text-[12px] text-slate-500">
                  Match driven by category fit, certifications and port proximity
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Pill>{lead.stage}</Pill>
                <Button variant="navy" size="sm">
                  Quote
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Section className="mt-6" title="How scoring works">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Category fit", "40%", "HS heading and subcategory alignment"],
            ["Company evidence", "35%", "Verification level and certificate coverage"],
            ["Trade history", "25%", "Response time, awards and repeat buyers"],
          ].map(([label, weight, text]) => (
            <div key={label} className="panel p-5">
              <div className="flex items-baseline justify-between">
                <p className="font-display text-base font-bold text-primary">{label}</p>
                <p className="font-display text-lg font-bold text-secondary">{weight}</p>
              </div>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <SampleNote />
    </>
  );
}
