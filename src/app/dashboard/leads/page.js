import { Badge, Button, EmptyState } from "@/components/ui";
import { TagIcon } from "@/components/icons";
import { Section, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Matched leads" };

const leads = [];

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
        <Badge tone="navy">{leads.length} active matches</Badge>
        <Badge tone="slate">Refreshed hourly</Badge>
      </div>

      <EmptyState
        icon={<TagIcon className="h-5 w-5" />}
        title="No matched leads yet"
        text="Requirements scored against your categories, certifications and trade history will appear here."
        action={
          <Button href="/requirements" variant="navy" size="sm">
            Browse the board
          </Button>
        }
      />

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
    </>
  );
}
