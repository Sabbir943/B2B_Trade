import { Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getAllListings } from "@/lib/listings";
import { getPublishedRequirements, getSourcingRequests } from "@/lib/requirements";
import { getOpenReports } from "@/lib/inbox";
import { getVerificationQueue, listAllBadges } from "@/lib/verification";
import { listInvoices } from "@/lib/billing";
import { listApplications } from "@/lib/market-entry";
import { listUsers } from "@/lib/users";
import { categoriesById } from "@/lib/catalog";

export const instant = false;

export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  await requirePermission("admin.reports");

  const [
    users,
    approvedListings,
    pendingListings,
    rejectedListings,
    publishedRequirements,
    openReports,
    queue,
    badges,
    invoices,
    applications,
    sourcing,
  ] = await Promise.all([
    listUsers(1000),
    getAllListings({ status: "approved", limit: 1000 }),
    getAllListings({ status: "pending", limit: 1000 }),
    getAllListings({ status: "rejected", limit: 1000 }),
    getPublishedRequirements({ limit: 1000 }),
    getOpenReports(),
    getVerificationQueue(),
    listAllBadges(500),
    listInvoices({ limit: 500 }),
    listApplications({ limit: 500 }),
    getSourcingRequests(500),
  ]);

  const liveReports = openReports.filter((report) => report.status === "open");
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
  const revenueUsd = paidInvoices.reduce((sum, invoice) => sum + (invoice.amountUsd || 0), 0);
  const openSourcing = sourcing.filter((item) => item.status === "open");

  const stats = [
    { label: "Accounts", value: String(users.length), hint: "Registered users" },
    { label: "Live listings", value: String(approvedListings.length), hint: `${pendingListings.length} pending · ${rejectedListings.length} rejected` },
    { label: "Published requirements", value: String(publishedRequirements.length), hint: `${openSourcing.length} with the Sourcing Desk` },
    { label: "Paid invoices", value: String(paidInvoices.length), hint: `$${revenueUsd.toLocaleString("en-US")} collected` },
  ];

  const categoryCounts = new Map();
  for (const listing of approvedListings) {
    categoryCounts.set(listing.category, (categoryCounts.get(listing.category) || 0) + 1);
  }
  const byCategory = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const queues = [
    ["Verification queue", queue.length, "Cases awaiting a decision"],
    ["Listing moderation", pendingListings.length, "12-hour SLA"],
    ["Inquiry reports", liveReports.length, "Fraud / off-platform attempts"],
    ["Market-entry pipeline", applications.filter((app) => !["active", "rejected", "withdrawn"].includes(app.stage)).length, "Applications in motion"],
    ["Badges on file", badges.length, "Active + historical verification badges"],
  ];

  return (
    <>
      <WorkspaceHeader
        title="Reports"
        description="Live operational counts across moderation, verification, billing and the Sourcing Desk."
      />

      <StatCards items={stats} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Queue depths">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            {queues.map(([label, count, hint]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-surface p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{label}</p>
                  <p className="text-[12px] text-slate-500">{hint}</p>
                </div>
                <p className="font-display text-xl font-bold text-primary">{count}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Live listings by category">
          {byCategory.length ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              {byCategory.map(([slug, count]) => {
                const pct = approvedListings.length
                  ? Math.round((count / approvedListings.length) * 100)
                  : 0;
                return (
                  <div key={slug}>
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-medium text-ink">
                        {categoriesById[slug]?.name || slug}
                      </p>
                      <p className="font-display text-sm font-bold text-primary">{count}</p>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-[12px] text-slate-500">{pct}% of live catalogue</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No approved listings yet — category share appears once moderation approves the
              first products.
            </p>
          )}
        </Section>
      </div>
    </>
  );
}
