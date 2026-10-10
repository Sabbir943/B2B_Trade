import { EmptyState } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { listAllMatches } from "@/lib/requirements";
import { formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Leads routing" };

const quality = (score) => (score >= 70 ? "hot" : score >= 50 ? "warm" : "cold");

export default async function AdminLeadsPage() {
  await requirePermission("admin.leads");
  const matches = await listAllMatches(300);

  const hot = matches.filter((match) => match.score >= 70).length;
  const warm = matches.filter((match) => match.score >= 50 && match.score < 70).length;
  const requirements = new Set(matches.map((match) => match.requirementId)).size;
  const suppliers = new Set(matches.map((match) => match.email)).size;

  const stats = [
    { label: "Total matches", value: String(matches.length), hint: "Across all requirements" },
    { label: "Hot (≥70)", value: String(hot), hint: "Category + HS + country aligned" },
    { label: "Warm (50–69)", value: String(warm), hint: "Partial alignment" },
    { label: "Suppliers matched", value: String(suppliers), hint: `${requirements} requirements` },
  ];

  const rows = matches.map((match) => ({
    id: match.id,
    title: match.requirement.title,
    routed: match.email,
    score: String(match.score),
    quality: quality(match.score),
    notify: formatDate(match.notifyAt),
  }));

  return (
    <>
      <WorkspaceHeader
        title="Lead routing"
        description="Buy requirements scored against supplier profiles — category 40, HS code 35, country 25."
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Lead pipeline">
        {rows.length ? (
          <DataTable
            columns={[
              { key: "id", label: "Match", emphasis: true },
              { key: "title", label: "Requirement" },
              { key: "routed", label: "Matched supplier" },
              { key: "score", label: "Score" },
              { key: "quality", label: "Quality", pill: true },
              { key: "notify", label: "Notify at" },
            ]}
            rows={rows}
          />
        ) : (
          <EmptyState
            title="No matches yet"
            text="Matches are written when a buyer publishes a requirement — scoring runs automatically."
          />
        )}
      </Section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Hot leads", "Score ≥ 70 — category, HS code and destination country all align."],
          ["Warm leads", "Score 50–69 — strong on one or two signals; worth a same-day look."],
          ["Below threshold", "Score < 50 — held from the supplier's lead view until it improves."],
        ].map(([title, text]) => (
          <div key={title} className="panel p-5">
            <p className="font-display text-sm font-bold text-primary">{title}</p>
            <p className="mt-1 text-[13px] leading-6 text-slate-600">{text}</p>
          </div>
        ))}
      </div>
    </>
  );
}
