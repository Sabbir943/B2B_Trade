import { ModerationRow } from "@/components/moderation-actions";
import { Badge } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getRequirementsAwaitingModeration } from "@/lib/requirements";
import { moderateRequirement } from "@/lib/actions";
import { categoriesById } from "@/lib/catalog";
import { plain, formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Requirement moderation" };

/**
 * §7.3.2 moderation queue — approving publishes the post on the public
 * board and fires the supplier matcher (§7.3.3); rejections need a reason.
 */
export default async function AdminRequirementsPage() {
  await requirePermission("admin.requirements");
  const pending = await getRequirementsAwaitingModeration();
  const rows = plain(pending);

  const stats = [
    { label: "In queue", value: String(rows.length), hint: "12h SLA" },
    {
      label: "Oldest waiting",
      value: rows.length ? formatDate(rows[rows.length - 1].createdAt) : "—",
      hint: "First in, first out",
    },
    { label: "Median age", value: "—", hint: "Fills as the queue runs" },
    { label: "Auto-match", value: "On", hint: "Fires on approval" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Requirement moderation"
        description="Buyer posts awaiting review. Approving publishes to the board and notifies matched suppliers on their tier's schedule."
        actions={<Badge tone="amber">{rows.length} in queue</Badge>}
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Pending buyer posts">
        <DataTable
          columns={[
            { key: "id", label: "Ref", emphasis: true },
            {
              key: "product",
              label: "Requirement",
              render: (row) => (
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold text-ink">{row.product}</span>
                  <span className="text-[12px] font-normal text-slate-500">
                    {categoriesById[row.category]?.name || row.category} · {row.quantity}{" "}
                    {row.unit} · {row.shippingTerms} to {row.destinationPort || "unspecified"}
                  </span>
                </span>
              ),
            },
            { key: "email", label: "Buyer" },
            { key: "createdAt", label: "Submitted", render: (row) => formatDate(row.createdAt) },
            {
              key: "moderationDueAt",
              label: "SLA due",
              render: (row) => formatDate(row.moderationDueAt),
            },
            {
              key: "actions",
              label: "Decision",
              render: (row) => (
                <ModerationRow
                  id={row.id}
                  onAction={moderateRequirement}
                  actions={[
                    { label: "Approve", value: "approved" },
                    { label: "Reject", value: "rejected", tone: "danger", needsReason: true },
                  ]}
                />
              ),
            },
          ]}
          rows={rows}
          empty="Nothing waiting — every buyer post has been decided."
        />
      </Section>

      <div className="panel mt-6 p-5">
        <p className="label-xs">Moderation rules</p>
        <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
          <li>· Specs must be clear enough for a supplier to quote.</li>
          <li>· No prohibited goods, sanctions-sensitive destinations or personal requests.</li>
          <li>· Approval auto-matches suppliers (category 40 / HS 35 / country 25).</li>
          <li>· Rejection reasons are shown to the buyer on their dashboard.</li>
        </ul>
      </div>
    </>
  );
}
