import { Button, EmptyState } from "@/components/ui";
import { InboxIcon } from "@/components/icons";
import { Section, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Inquiries" };

const filters = ["All", "New", "Negotiating", "Sampling", "Closed"];
const inquiries = [];

export default async function InquiriesPage() {
  await requirePermission("member.inquiries");
  const counts = Object.fromEntries(
    filters.map((filter) => [
      filter,
      filter === "All"
        ? inquiries.length
        : inquiries.filter((item) => item.stage === filter).length,
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
    </>
  );
}
