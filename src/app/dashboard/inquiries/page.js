import Link from "next/link";
import { Badge, Button, EmptyState } from "@/components/ui";
import { InboxIcon } from "@/components/icons";
import { Section, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getThreadsFor, contactQuota } from "@/lib/inbox";

export const instant = false;

export const metadata = { title: "Inquiries" };

const STAGE_TONE = { New: "navy", Negotiating: "amber", Sampling: "blue", Closed: "slate" };
const stages = ["New", "Negotiating", "Sampling", "Closed"];

/**
 * §7.4 inbox — every on-platform conversation, with unread counts and the
 * daily contact-reveal quota for the member's plan.
 */
export default async function InquiriesPage() {
  const { user, tier } = await requirePermission("member.inquiries");
  const threads = await getThreadsFor(user.email);
  const quota = await contactQuota(user.email, tier);

  const counts = Object.fromEntries(
    ["All", ...stages].map((stage) => [
      stage,
      stage === "All" ? threads.length : threads.filter((item) => item.stage === stage).length,
    ]),
  );
  const unread = threads.reduce((sum, item) => sum + (item.unread || 0), 0);

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

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {["All", ...stages].map((stage, index) => (
          <span
            key={stage}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
              index === 0 ? "bg-primary text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {stage}
            <span className="ml-1.5 text-[11px] opacity-70">{counts[stage]}</span>
          </span>
        ))}
        <span className="ml-auto rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-slate-600">
          Contact reveals today: {quota.used}/{quota.limit}
        </span>
        {unread ? (
          <span className="rounded-full bg-accent/20 px-3.5 py-1.5 text-[12px] font-bold text-accent-ink">
            {unread} unread
          </span>
        ) : null}
      </div>

      <Section title="Conversations">
        {threads.length ? (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/dashboard/inquiries/${thread.id}`}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-surface/70"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm ${thread.unread ? "font-bold text-ink" : "font-semibold text-ink"}`}>
                      {thread.counterpartName || thread.counterpart}
                    </p>
                    <Badge tone={STAGE_TONE[thread.stage] || "slate"}>{thread.stage}</Badge>
                    {thread.fraudFlags?.length ? <Badge tone="red">Safety warning</Badge> : null}
                    {thread.reported ? <Badge tone="amber">Reported</Badge> : null}
                  </div>
                  <p className="mt-0.5 truncate text-[13px] font-medium text-slate-600">
                    {thread.subject}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-slate-400">
                    {thread.lastMessagePreview}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {thread.unread ? (
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-ink">
                      {thread.unread}
                    </span>
                  ) : null}
                  <span className="text-[12px] text-slate-400">{thread.relativeTime}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<InboxIcon className="h-5 w-5" />}
            title="No inquiries yet"
            text="When buyers contact you through a listing, the conversation opens here and stays on-platform."
            action={
              <Button href="/dashboard/products" variant="navy" size="sm">
                Add a product
              </Button>
            }
          />
        )}
      </Section>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <InboxIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
        <p className="text-[13px] leading-6 text-slate-600">
          Threads with no reply within 48 hours drop in buyer rankings. Revealing a
          contact uses one daily slot on your plan ({quota.limit}/day) — re-checking
          the same thread is free.
        </p>
      </div>
    </>
  );
}
