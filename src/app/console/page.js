import { Badge, Button, EmptyState } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";
import { DataTable, Pill, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { listInvoices } from "@/lib/billing";
import { getSourcingRequests } from "@/lib/requirements";
import { listAuditEntries } from "@/lib/audit";
import { getFoundingSpots, getPricingSettings } from "@/lib/membership";
import { formatUsd, serviceFeePrice } from "@/lib/pricing";
import { formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Console overview" };

const MONTHS = 6;

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

export default async function ConsoleOverviewPage() {
  await requirePermission("console.overview");

  const [invoices, sourcing, audit, spots, settings] = await Promise.all([
    listInvoices({ limit: 500 }),
    getSourcingRequests(100),
    listAuditEntries(100),
    getFoundingSpots(),
    getPricingSettings(),
  ]);

  const paid = invoices.filter((invoice) => invoice.status === "paid" && invoice.paidAt);
  const outstanding = invoices.filter((invoice) =>
    ["pending", "quoted"].includes(invoice.status),
  );

  // Monthly paid revenue for the last N months (empty months included).
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
  const revenue = buckets.map((key) => ({ month: monthLabel(key), value: Math.round(byMonth.get(key)) }));
  const maxRevenue = Math.max(1, ...revenue.map((point) => point.value));

  const openDesk = sourcing.filter((item) => item.status === "open");

  const stats = [
    { label: "Paid invoices", value: String(paid.length), hint: `${outstanding.length} outstanding` },
    {
      label: "Collected",
      value: formatUsd(paid.reduce((sum, invoice) => sum + (invoice.amountUsd || 0), 0)),
      hint: "All time",
    },
    { label: "Sourcing Desk open", value: String(openDesk.length), hint: `${sourcing.length} total requests` },
    {
      label: "Founding spots",
      value: settings.founding.enabled ? String(spots.left) : "Off",
      hint: `${spots.taken} of ${spots.total} claimed`,
    },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Super-Admin console"
        description="Revenue, pricing levers and platform-wide controls. Every change here writes to the audit log."
        actions={
          <>
            <Button href="/console/audit-log" variant="outline" size="sm">
              Audit log
            </Button>
            <Button href="/console/pricing" variant="navy" size="sm">
              Pricing controls
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Section
          title="Paid revenue, last 6 months ($)"
          action={
            <Link
              href="/console/revenue"
              className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              Details <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            {paid.length ? (
              <div className="flex h-44 items-end gap-3">
                {revenue.map((point) => (
                  <div
                    key={point.month}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <span className="text-[11px] font-semibold text-slate-500">
                      {point.value}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-primary transition"
                      style={{
                        height: `${Math.max(4, (point.value / maxRevenue) * 130)}px`,
                      }}
                    />
                    <span className="text-[11px] text-slate-400">{point.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">
                No paid invoices yet — the chart fills in as members pay.
              </p>
            )}
            <p className="mt-4 border-t border-slate-100 pt-3 text-[12px] text-slate-500">
              Six-month view · summed from paid invoice records
            </p>
          </div>
        </Section>

        <Section title="Service fees">
          {settings.serviceFees.length ? (
            <DataTable
              columns={[
                { key: "name", label: "Fee", emphasis: true },
                { key: "kind", label: "Model" },
                { key: "price", label: "Price" },
              ]}
              rows={settings.serviceFees.map((fee) => ({
                id: fee.key,
                name: fee.name,
                kind: fee.kind.replace(/_/g, " "),
                price: serviceFeePrice(fee),
              }))}
            />
          ) : (
            <EmptyState title="No service fees configured" text="Add fees from Pricing controls." />
          )}
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section
          title="Sourcing Desk"
          action={
            <Link
              href="/console/sourcing-desk"
              className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              Open desk <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {openDesk.length ? (
            <div className="space-y-2">
              {openDesk.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary/10 font-display text-[11px] font-bold text-primary">
                    {item.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                    <p className="truncate text-[12px] text-slate-500">
                      {item.buyerEmail} · opened {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <Pill>{item.status}</Pill>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Desk is clear"
              text="Escalated requirements from /admin/requirements or the 72-hour rule land here."
            />
          )}
        </Section>

        <Section
          title="Latest audit entries"
          action={
            <Link
              href="/console/audit-log"
              className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              Full log <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {audit.length ? (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2">
              {audit.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {entry.action}
                    </p>
                    <p className="truncate text-[12px] text-slate-500">
                      {entry.actor} · {entry.target}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {formatDate(entry.at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No audit entries yet"
              text="Staff actions — moderation, role changes, pricing edits — land here the moment they run."
            />
          )}
          <Badge tone="slate" className="mt-3">
            {audit.length} entries loaded · immutable storage
          </Badge>
        </Section>
      </div>
    </>
  );
}
