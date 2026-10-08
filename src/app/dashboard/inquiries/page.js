import { dashboard } from "@/lib/catalog";
import { Avatar, Badge, Button } from "@/components/ui";
import { InboxIcon } from "@/components/icons";
import { Pill, SampleNote, Section, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Inquiries" };

const filters = ["All", "New", "Negotiating", "Sampling", "Closed"];

export default async function InquiriesPage() {
  await requirePermission("member.inquiries");
  const counts = Object.fromEntries(
    filters.map((filter) => [
      filter,
      filter === "All"
        ? dashboard.inquiries.length
        : dashboard.inquiries.filter((item) => item.stage === filter).length,
    ])
  );

  return (
    <>
      <WorkspaceHeader
        title="Inquiries"
        description="Every conversation with buyers, in one thread. Replies stay on-platform so both sides keep the same trade record."
        actions={
          <Button href="/dashboard/leads" variant="outline" size="sm">
            Matched leads
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <span
            key={filter}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
              filter === "All"
                ? "bg-primary text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {filter}
            <span className="ml-1.5 text-[11px] opacity-70">{counts[filter]}</span>
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {dashboard.inquiries.map((item) => (
          <div
            key={item.subject}
            className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center"
          >
            <Avatar name={item.from} className="h-11 w-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                {item.from}
                <Badge tone="slate">{item.country}</Badge>
                {item.unread ? <Badge tone="navy">Unread</Badge> : null}
              </p>
              <p className="mt-0.5 text-sm text-slate-600">{item.subject}</p>
              <p className="mt-1 text-[12px] text-slate-400">Last activity · {item.time}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Pill>{item.stage}</Pill>
              <Button variant="navy" size="sm">
                Open thread
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <InboxIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
        <p className="text-[13px] leading-6 text-slate-600">
          Threads with no reply within 48 hours drop in buyer rankings. Saved
          replies live under Settings → Messaging.
        </p>
      </div>

      <Section className="mt-6" title="By stage">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {filters.slice(1).map((stage) => (
            <div key={stage} className="panel p-4">
              <p className="label-xs">{stage}</p>
              <p className="mt-1 font-display text-2xl font-bold text-primary">
                {counts[stage]}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <SampleNote />
    </>
  );
}
