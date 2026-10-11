import { ModerationRow } from "@/components/moderation-actions";
import DeleteRowAction from "@/components/delete-row-action";
import { Badge } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getAllListings, LISTING_STATUS } from "@/lib/listings";
import { listCategoriesById } from "@/lib/categories-db";
import { adminDeleteListing, moderateListing } from "@/lib/actions";
import { plain, formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Listings moderation" };

const STATUS_TONE = { approved: "green", pending: "amber", rejected: "red", draft: "slate" };

/**
 * §7.2.2 listing moderation — real rows from the `listings` collection.
 * Approvals are instant; removals demand a written reason the seller sees.
 */
export default async function AdminListingsPage() {
  await requirePermission("admin.listings");

  const all = await getAllListings({ limit: 200 });
  const categoriesById = await listCategoriesById();
  const pending = all.filter((row) => row.status === LISTING_STATUS.PENDING);
  const rows = [...pending, ...all.filter((row) => row.status !== LISTING_STATUS.PENDING)];

  const stats = [
    { label: "Awaiting review", value: String(pending.length), hint: "12h SLA" },
    { label: "Approved", value: String(all.filter((row) => row.status === LISTING_STATUS.APPROVED).length), hint: "Public catalogue" },
    { label: "Rejected", value: String(all.filter((row) => row.status === LISTING_STATUS.REJECTED).length), hint: "Reason sent to seller" },
    { label: "Total tracked", value: String(all.length), hint: "All statuses" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Listing moderation"
        description="Pending listings first. Approvals publish instantly; removals require a reason the seller sees on their row."
        actions={<Badge tone="amber">{pending.length} in queue</Badge>}
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Listings">
        <DataTable
          columns={[
            { key: "id", label: "Listing", emphasis: true },
            {
              key: "title",
              label: "Product",
              render: (row) => (
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold text-ink">{row.title}</span>
                  {row.rejectionReason ? (
                    <span className="text-[12px] font-normal text-red-600">{row.rejectionReason}</span>
                  ) : null}
                </span>
              ),
            },
            { key: "email", label: "Seller" },
            {
              key: "category",
              label: "Category",
              render: (row) => categoriesById[row.category]?.name || row.category,
            },
            { key: "createdAt", label: "Submitted", render: (row) => formatDate(row.createdAt) },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <Badge tone={STATUS_TONE[row.status] || "slate"}>{row.status}</Badge>
              ),
            },
            {
              key: "actions",
              label: "Decision",
              render: (row) => (
                <span className="flex flex-col items-start gap-2">
                  {row.status === LISTING_STATUS.PENDING ? (
                    <ModerationRow
                      id={row.id}
                      onAction={moderateListing}
                      actions={[
                        { label: "Approve", value: "approved" },
                        { label: "Remove", value: "rejected", tone: "danger", needsReason: true },
                      ]}
                    />
                  ) : (
                    <span className="text-[12px] text-slate-400">Decided</span>
                  )}
                  <DeleteRowAction
                    id={row.id}
                    onAction={adminDeleteListing}
                    title="Delete this listing?"
                    body="The product is removed from the catalogue for everyone. The seller can list it again later. This is recorded in the audit log."
                    confirmLabel="Delete listing"
                  />
                </span>
              ),
            },
          ]}
          rows={plain(rows)}
          empty="No listings in the system yet."
        />
      </Section>

      <div className="panel mt-6 p-5">
        <p className="label-xs">Moderation rules</p>
        <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
          <li>· Claims must match certificates attached to the listing.</li>
          <li>· Unit pricing needs a basis (kg, MT, pc, m²).</li>
          <li>· Third-party images require written permission.</li>
          <li>· Removals notify the seller with the written reason.</li>
        </ul>
      </div>
    </>
  );
}
