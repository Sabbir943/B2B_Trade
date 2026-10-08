import { admin } from "@/lib/catalog";
import { Badge, Button } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";
import { DataTable, Pill, SampleNote, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import Link from "next/link";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  await requirePermission("admin.overview");
  return (
    <>
      <WorkspaceHeader
        title="Operations overview"
        description="Moderation, verification and trade health in one screen. Targets shown against the last 30 days."
        actions={
          <>
            <Button href="/admin/verification-queue" variant="outline" size="sm">
              Open queue
            </Button>
            <Button href="/admin/reports" variant="navy" size="sm">
              Full reports
            </Button>
          </>
        }
      />

      <StatCards items={admin.reports} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section
          title="Verification queue"
          action={
            <Link
              href="/admin/verification-queue"
              className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              All cases <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <DataTable
            columns={[
              { key: "id", label: "Case", emphasis: true },
              { key: "company", label: "Company" },
              { key: "type", label: "Type" },
              { key: "age", label: "Age" },
              { key: "risk", label: "Risk", pill: true },
            ]}
            rows={admin.queue}
          />
        </Section>

        <Section
          title="Flagged listings"
          action={
            <Link
              href="/admin/listings"
              className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              Moderate <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <DataTable
            columns={[
              { key: "id", label: "Listing", emphasis: true },
              { key: "product", label: "Product" },
              { key: "flag", label: "Reason" },
              { key: "status", label: "Status", pill: true },
            ]}
            rows={admin.listings}
          />
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Section
          title="Leads needing routing"
          action={
            <Link
              href="/admin/leads"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              Open
            </Link>
          }
        >
          <div className="space-y-2">
            {admin.leads.map((lead) => (
              <div key={lead.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{lead.title}</p>
                  <Pill>{lead.quality}</Pill>
                </div>
                <p className="mt-1 text-[13px] text-slate-500">
                  {lead.value} · {lead.routed}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Escalated inquiries"
          action={
            <Link
              href="/admin/inquiries"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              Open
            </Link>
          }
        >
          <div className="space-y-2">
            {admin.inquiries.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{item.id}</p>
                  <Pill>{item.status}</Pill>
                </div>
                <p className="mt-1 text-[13px] text-slate-500">{item.parties}</p>
                <p className="text-[12px] text-slate-400">{item.reason}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Today">
          <div className="space-y-3">
            {[
              ["Queue SLA", "9 hrs median", "Target 24 hrs"],
              ["New members", "+14 today", "Sample figure"],
              ["Reports open", "3", "2 high priority"],
              ["Payments failed", "1", "Auto-retry queued"],
            ].map(([label, value, hint]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-[13px] text-slate-500">{label}</p>
                  <p className="font-display text-base font-bold text-primary">{value}</p>
                </div>
                <p className="mt-0.5 text-[12px] text-slate-400">{hint}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <Badge tone="amber">Attention</Badge>
        <p className="min-w-0 flex-1 text-[13px] leading-6 text-slate-600">
          Case <span className="font-semibold text-ink">CS-3298</span> has been
          waiting 7 days — beyond the 48-hour review target.
        </p>
        <Link
          href="/admin/verification-queue"
          className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
        >
          Review now <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      <SampleNote />
    </>
  );
}
