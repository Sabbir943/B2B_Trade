import { console_ } from "@/lib/catalog";
import { Button } from "@/components/ui";
import { Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Revenue" };

const mix = [
  ["Subscriptions", "$96.2k", "81%"],
  ["Verification fees", "$12.4k", "10%"],
  ["Featured listings", "$6.8k", "6%"],
  ["Sourcing Desk retainers", "$3.0k", "3%"],
];

const cohorts = [
  { cohort: "Q4 2025", size: "412", retained: "91%", arpa: "$612" },
  { cohort: "Q1 2026", size: "486", retained: "89%", arpa: "$640" },
  { cohort: "Q2 2026", size: "521", retained: "88%", arpa: "$655" },
  { cohort: "Q3 2026", size: "588", retained: "93%", arpa: "$688" },
];

export default async function ConsoleRevenuePage() {
  await requirePermission("console.revenue");
  const max = Math.max(...console_.revenue.map((point) => point.value));

  return (
    <>
      <WorkspaceHeader
        title="Revenue"
        description="Net MRR, revenue mix and cohort retention. Figures exclude marketplace transaction fees — none are charged yet."
        actions={
          <>
            <Button variant="outline" size="sm">
              Finance export
            </Button>
            <Button variant="navy" size="sm">
              Board pack
            </Button>
          </>
        }
      />

      <StatCards items={console_.stats} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Net MRR trend ($k)">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex h-48 items-end gap-3">
              {console_.revenue.map((point) => (
                <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {point.value}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-primary"
                    style={{ height: `${(point.value / max) * 140}px` }}
                  />
                  <span className="text-[11px] text-slate-400">{point.month}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-slate-100 pt-3 text-[12px] text-slate-500">
              +59% over six months · sample figure
            </p>
          </div>
        </Section>

        <Section title="Revenue mix">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            {mix.map(([label, amount, share]) => (
              <div key={label}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-ink">{label}</p>
                  <p className="text-sm font-semibold text-primary">
                    {amount} <span className="text-[12px] text-slate-400">{share}</span>
                  </p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{ width: share }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section className="mt-6" title="Cohort retention">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-surface text-left">
                {["Cohort", "Members", "Retained", "ARPA"].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cohorts.map((row) => (
                <tr key={row.cohort}>
                  <td className="px-4 py-3 font-semibold text-ink">{row.cohort}</td>
                  <td className="px-4 py-3 text-slate-600">{row.size}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-success">{row.retained}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.arpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <p className="mt-4 text-[12px] text-slate-400">
        Sample data shown for preview purposes.
      </p>
    </>
  );
}
