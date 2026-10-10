import { Badge, EmptyState } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getSourcingRequests } from "@/lib/requirements";
import { listOfficers } from "@/lib/market-entry";
import { formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Sourcing Desk" };

const reasonLabel = (reason) => String(reason || "").replace(/_/g, " ");

export default async function ConsoleSourcingDeskPage() {
  await requirePermission("console.sourcing_desk");
  const [requests, officers] = await Promise.all([
    getSourcingRequests(200),
    listOfficers(),
  ]);

  const open = requests.filter((item) => item.status === "open");
  const auto = requests.filter((item) => item.source === "auto");
  const manual = requests.filter((item) => item.source !== "auto");

  const stats = [
    { label: "Open briefs", value: String(open.length), hint: `${requests.length} total requests` },
    { label: "Auto-escalations", value: String(auto.length), hint: "72h no-quote rule" },
    { label: "Manual requests", value: String(manual.length), hint: "Buyer clicked Request Sourcing Help" },
    { label: "Officers", value: String(officers.length), hint: "Eligible to own a brief" },
  ];

  const rows = requests.map((item) => ({
    id: item.id,
    lead: item.title,
    buyer: item.buyerEmail,
    reason: reasonLabel(item.reason),
    source: item.source,
    opened: formatDate(item.createdAt),
    status: item.status,
  }));

  return (
    <>
      <WorkspaceHeader
        title="Sourcing Desk"
        description="Managed briefs raised by the 72-hour no-quote rule or by buyers. Every request is tied to a published requirement."
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Briefs">
        {rows.length ? (
          <DataTable
            columns={[
              { key: "id", label: "Brief", emphasis: true },
              { key: "lead", label: "Requirement" },
              { key: "buyer", label: "Buyer" },
              { key: "reason", label: "Reason" },
              { key: "source", label: "Source" },
              { key: "opened", label: "Opened" },
              { key: "status", label: "Status", pill: true },
            ]}
            rows={rows}
          />
        ) : (
          <EmptyState
            title="Desk is clear"
            text="Requirements with zero quotes after 72 hours escalate here automatically; buyers can also request help from their dashboard."
          />
        )}
      </Section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <p className="label-xs">Eligible officers</p>
          {officers.length ? (
            <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
              {officers.map((officer) => (
                <li key={officer.email} className="flex items-center justify-between gap-3">
                  <span className="truncate font-semibold text-ink">{officer.email}</span>
                  <Badge tone="navy">{officer.role}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              No staff accounts yet — officers are drawn from staff roles.
            </p>
          )}
        </div>

        <div className="panel p-5">
          <p className="label-xs">How briefs open</p>
          <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
            <li>
              <strong className="text-ink">auto</strong> — a published requirement had zero
              quotes after 72 hours; the rule runs idempotently on every view.
            </li>
            <li>
              <strong className="text-ink">manual</strong> — the buyer pressed
              &ldquo;Request Sourcing Help&rdquo; from their requirements dashboard.
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
