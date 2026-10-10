import { EmptyState } from "@/components/ui";
import { Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { listInvoices } from "@/lib/billing";
import { formatUsd } from "@/lib/pricing";

export const instant = false;

export const metadata = { title: "Revenue" };

const MONTHS = 6;

const KIND_LABELS = {
  membership: "Membership subscriptions",
  document_verified: "Document Verified fees",
  audited: "Factory audit fees",
  sourcing_desk: "Sourcing Desk retainers",
  market_entry: "Market Entry retainers",
  service_fee: "Other service fees",
};

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [, month] = key.split("-");
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    Number(month) - 1
  ];
}

export default async function ConsoleRevenuePage() {
  await requirePermission("console.revenue");
  const invoices = await listInvoices({ limit: 1000 });

  const paid = invoices.filter((invoice) => invoice.status === "paid" && invoice.paidAt);
  const pending = invoices.filter((invoice) => invoice.status === "pending");
  const quoted = invoices.filter((invoice) => invoice.status === "quoted");

  const total = paid.reduce((sum, invoice) => sum + (invoice.amountUsd || 0), 0);
  const pendingTotal = pending.reduce((sum, invoice) => sum + (invoice.amountUsd || 0), 0);

  const stats = [
    { label: "Collected", value: formatUsd(total), hint: `${paid.length} paid invoices` },
    { label: "Outstanding", value: formatUsd(pendingTotal), hint: `${pending.length} pending` },
    { label: "Quoted (custom)", value: String(quoted.length), hint: "Awaiting agreed amount" },
    { label: "All invoices", value: String(invoices.length), hint: "Every kind" },
  ];

  // Monthly paid totals for the last N months.
  const now = new Date();
  const buckets = [];
  for (let i = MONTHS - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const byMonth = new Map(buckets.map((key) => [key, 0]));
  for (const invoice of paid) {
    const key = monthKey(invoice.paidAt);
    if (byMonth.has(key)) byMonth.set(key, byMonth.get(key) + (invoice.amountUsd || 0));
  }
  const revenue = buckets.map((key) => ({
    month: monthLabel(key),
    value: Math.round(byMonth.get(key)),
  }));
  const maxRevenue = Math.max(1, ...revenue.map((point) => point.value));

  // Mix by invoice kind (paid only).
  const byKind = new Map();
  for (const invoice of paid) {
    const kind = invoice.kind || "service_fee";
    const bucket = byKind.get(kind) || { total: 0, count: 0 };
    bucket.total += invoice.amountUsd || 0;
    bucket.count += 1;
    byKind.set(kind, bucket);
  }
  const mix = [...byKind.entries()].sort((a, b) => b[1].total - a[1].total);

  // Membership tier mix from paid membership invoices.
  const byTier = new Map();
  for (const invoice of paid) {
    if (invoice.kind !== "membership" || !invoice.tier) continue;
    byTier.set(invoice.tier, (byTier.get(invoice.tier) || 0) + 1);
  }
  const tierRows = [...byTier.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <WorkspaceHeader
        title="Revenue"
        description="Paid invoice totals by month, service line and membership tier — computed from the billing collection."
      />

      <StatCards items={stats} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title={`Paid totals, last ${MONTHS} months ($)`}>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            {paid.length ? (
              <div className="flex h-48 items-end gap-3">
                {revenue.map((point) => (
                  <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {point.value}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-primary"
                      style={{
                        height: `${Math.max(4, (point.value / maxRevenue) * 140)}px`,
                      }}
                    />
                    <span className="text-[11px] text-slate-400">{point.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">No paid invoices yet.</p>
            )}
            <p className="mt-4 border-t border-slate-100 pt-3 text-[12px] text-slate-500">
              Summed from invoice.paidAt + amountUsd
            </p>
          </div>
        </Section>

        <Section title="Mix by service line">
          {mix.length ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              {mix.map(([kind, bucket]) => {
                const share = total ? Math.round((bucket.total / total) * 100) : 0;
                return (
                  <div key={kind}>
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm text-ink">{KIND_LABELS[kind] || kind}</p>
                      <p className="text-sm font-semibold text-primary">
                        {formatUsd(bucket.total)}{" "}
                        <span className="text-[12px] text-slate-400">{share}%</span>
                      </p>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-secondary"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[12px] text-slate-500">{bucket.count} invoices</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No revenue yet" text="The mix appears once invoices are paid." />
          )}
        </Section>
      </div>

      <Section className="mt-6" title="Paid membership invoices by tier">
        {tierRows.length ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-surface text-left">
                  {["Tier", "Paid invoices"].map((head) => (
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
                {tierRows.map(([tier, count]) => (
                  <tr key={tier}>
                    <td className="px-4 py-3 font-semibold capitalize text-ink">{tier}</td>
                    <td className="px-4 py-3 text-slate-600">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No paid membership invoices yet.
          </p>
        )}
      </Section>
    </>
  );
}
