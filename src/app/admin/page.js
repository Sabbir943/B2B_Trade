import { Badge, Button, EmptyState } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";
import { DataTable, Pill, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { getAllListings } from "@/lib/listings";
import { getVerificationQueue } from "@/lib/verification";
import { getOpenReports } from "@/lib/inbox";
import { getSourcingRequests, listAllMatches } from "@/lib/requirements";
import { listInvoices } from "@/lib/billing";
import { countUsersByRole } from "@/lib/users";
import { formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Admin overview" };

/** Open = not yet resolved/decided. */
const isOpenReport = (report) => report.status === "open";
const isUnpaid = (invoice) => ["pending", "quoted"].includes(invoice.status);

export default async function AdminOverviewPage() {
  await requirePermission("admin.overview");

  const [pendingListings, queue, reports, sourcing, matches, invoices, roleCounts] =
    await Promise.all([
      getAllListings({ status: "pending", limit: 50 }),
      getVerificationQueue(),
      getOpenReports(),
      getSourcingRequests(50),
      listAllMatches(200),
      listInvoices({ limit: 200 }),
      countUsersByRole(),
    ]);

  const openReports = reports.filter(isOpenReport);
  const openSourcing = sourcing.filter((item) => item.status === "open");
  const unpaidInvoices = invoices.filter(isUnpaid);
  const totalMembers = [...roleCounts.values()].reduce((sum, n) => sum + n, 0);
  const openLeads = matches.filter((match) => match.score >= 50);

  const stats = [
    { label: "Members", value: String(totalMembers), hint: `${roleCounts.get("super_admin") || 0} super admin` },
    { label: "Listings awaiting review", value: String(pendingListings.length), hint: "12-hour moderation SLA" },
    { label: "Verification cases open", value: String(queue.length), hint: "Awaiting decision" },
    { label: "Inquiry reports open", value: String(openReports.length), hint: `${unpaidInvoices.length} unpaid invoices` },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Operations overview"
        description="Moderation, verification and trade health in one screen — live counts from the platform database."
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

      <StatCards items={stats} />

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
          {queue.length ? (
            <DataTable
              columns={[
                { key: "id", label: "Case", emphasis: true },
                { key: "company", label: "Company" },
                { key: "levelLabel", label: "Level" },
                { key: "created", label: "Opened", render: (row) => formatDate(row.createdAt) },
                { key: "status", label: "Status", pill: true },
              ]}
              rows={queue.slice(0, 6).map((item) => ({ ...item, company: item.email }))}
            />
          ) : (
            <EmptyState title="Queue is clear" text="No verification cases are awaiting review." />
          )}
        </Section>

        <Section
          title="Listings awaiting moderation"
          action={
            <Link
              href="/admin/listings"
              className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              Moderate <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {pendingListings.length ? (
            <DataTable
              columns={[
                { key: "id", label: "Listing", emphasis: true },
                { key: "title", label: "Product" },
                { key: "email", label: "Seller" },
                { key: "updated", label: "Updated", render: (row) => formatDate(row.updatedAt) },
              ]}
              rows={pendingListings.slice(0, 6)}
            />
          ) : (
            <EmptyState title="Nothing pending" text="All submitted listings have been reviewed." />
          )}
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Section
          title="Matched leads"
          action={
            <Link
              href="/admin/leads"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              Open
            </Link>
          }
        >
          {openLeads.length ? (
            <div className="space-y-2">
              {openLeads.slice(0, 4).map((match) => (
                <div key={match.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {match.requirement.title}
                    </p>
                    <Pill>{match.score >= 70 ? "hot" : "warm"}</Pill>
                  </div>
                  <p className="mt-1 truncate text-[13px] text-slate-500">
                    → {match.email} · score {match.score}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No matches yet" text="Matches appear as requirements are scored against supplier profiles." />
          )}
        </Section>

        <Section
          title="Open inquiry reports"
          action={
            <Link
              href="/admin/inquiries"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              Open
            </Link>
          }
        >
          {openReports.length ? (
            <div className="space-y-2">
              {openReports.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{item.id}</p>
                    <Pill>{item.status}</Pill>
                  </div>
                  <p className="mt-1 text-[13px] text-slate-500">{item.subject || item.threadId}</p>
                  <p className="text-[12px] text-slate-400">{item.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No open reports" text="Member fraud reports land here for triage." />
          )}
        </Section>

        <Section
          title="Sourcing Desk"
          action={
            <Link
              href="/console/sourcing-desk"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              Open
            </Link>
          }
        >
          {openSourcing.length ? (
            <div className="space-y-2">
              {openSourcing.slice(0, 4).map((item) => (
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
                      {item.buyerEmail} · {item.reason.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Badge tone="amber">{item.source}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Desk is clear" text="Requirements with no quotes after 72 hours escalate here automatically." />
          )}
        </Section>
      </div>
    </>
  );
}
