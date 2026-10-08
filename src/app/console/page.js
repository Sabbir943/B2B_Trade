import { console_ } from "@/lib/catalog";
import { Badge, Button } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";
import { DataTable, Pill, SampleNote, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import Link from "next/link";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Console overview" };

export default async function ConsoleOverviewPage() {
  await requirePermission("console.overview");
  const max = Math.max(...console_.revenue.map((point) => point.value));

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

      <StatCards items={console_.stats} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Section
          title="Revenue trend (net MRR, $k)"
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
            <div className="flex h-44 items-end gap-3">
              {console_.revenue.map((point) => (
                <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {point.value}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-primary transition"
                    style={{ height: `${(point.value / max) * 130}px` }}
                  />
                  <span className="text-[11px] text-slate-400">{point.month}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-slate-100 pt-3 text-[12px] text-slate-500">
              Six-month view · net of refunds · sample figure
            </p>
          </div>
        </Section>

        <Section title="Live offers">
          <DataTable
            columns={[
              { key: "code", label: "Code", emphasis: true },
              { key: "type", label: "Offer" },
              { key: "uses", label: "Uses" },
              { key: "status", label: "Status", pill: true },
            ]}
            rows={console_.offers}
          />
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
          <div className="space-y-2">
            {console_.desk.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary/10 font-display text-[11px] font-bold text-primary">
                  {item.id}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.lead}</p>
                  <p className="truncate text-[12px] text-slate-500">
                    {item.owner} · {item.value}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <Pill>{item.status}</Pill>
                  <p className="mt-1 text-[11px] text-slate-400">SLA {item.sla}</p>
                </div>
              </div>
            ))}
          </div>
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
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2">
            {console_.audit.slice(0, 4).map((entry) => (
              <div
                key={entry.time + entry.action}
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
                <span className="shrink-0 text-[11px] text-slate-400">{entry.time}</span>
              </div>
            ))}
          </div>
          <Badge tone="amber" className="mt-3">
            1 suspicious login under review
          </Badge>
        </Section>
      </div>

      <SampleNote />
    </>
  );
}
