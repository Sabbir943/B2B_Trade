import { admin } from "@/lib/catalog";
import { Button } from "@/components/ui";
import { Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Reports" };

const weekly = [
  { label: "Verification throughput", value: 86, hint: "Cases closed vs target" },
  { label: "Listing SLA", value: 96, hint: "Reviewed within 24 hrs" },
  { label: "Inquiry resolution", value: 78, hint: "Closed within 24 hrs" },
  { label: "Member onboarding", value: 92, hint: "Activated within 7 days" },
];

const breakdown = [
  { region: "Europe", members: "486", leads: "312", inquiries: "1,204" },
  { region: "Middle East", members: "274", leads: "198", inquiries: "812" },
  { region: "Asia-Pacific", members: "241", leads: "161", inquiries: "690" },
  { region: "Americas", members: "188", leads: "104", inquiries: "431" },
  { region: "Africa", members: "95", leads: "58", inquiries: "206" },
];

export default async function AdminReportsPage() {
  await requirePermission("admin.reports");
  return (
    <>
      <WorkspaceHeader
        title="Reports"
        description="Operational health across moderation, verification and support — last 30 days unless noted."
        actions={
          <>
            <Button variant="outline" size="sm">
              Schedule email
            </Button>
            <Button variant="navy" size="sm">
              Export report
            </Button>
          </>
        }
      />

      <StatCards items={admin.reports} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="SLA performance">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            {weekly.map((item) => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="font-display text-sm font-bold text-primary">
                    {item.value}%
                  </p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full rounded-full ${
                      item.value >= 90 ? "bg-success" : item.value >= 80 ? "bg-secondary" : "bg-amber-500"
                    }`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <p className="mt-1 text-[12px] text-slate-500">{item.hint}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="By region">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-surface text-left">
                  {["Region", "Members", "Leads", "Inquiries"].map((head) => (
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
                {breakdown.map((row) => (
                  <tr key={row.region}>
                    <td className="px-4 py-3 font-semibold text-ink">{row.region}</td>
                    <td className="px-4 py-3 text-slate-600">{row.members}</td>
                    <td className="px-4 py-3 text-slate-600">{row.leads}</td>
                    <td className="px-4 py-3 text-slate-600">{row.inquiries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Trust & safety", "27 flagged inquiries · 47 listings removed"],
          ["Marketplace quality", "12 categories · 10,255 live listings"],
          ["Support load", "312 tickets · 4.7/5 satisfaction"],
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
