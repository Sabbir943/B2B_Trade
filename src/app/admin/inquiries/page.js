import { ModerationRow } from "@/components/moderation-actions";
import { Badge } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getOpenReports } from "@/lib/inbox";
import { resolveInquiryReport } from "@/lib/actions";
import { plain, formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Inquiries & disputes" };

const STATUS_TONE = { open: "amber", resolved: "green", escalated: "red" };

/**
 * §7.4.4 Inquiry Monitor — member reports on threads. Resolve clears the
 * thread flag; escalate keeps it visible for the trust officer.
 */
export default async function AdminInquiriesPage() {
  await requirePermission("admin.inquiries");

  const reports = plain(await getOpenReports());
  const open = reports.filter((row) => row.status === "open");

  const stats = [
    { label: "Open reports", value: String(open.length), hint: "Needs a decision" },
    { label: "Escalated", value: String(reports.filter((row) => row.status === "escalated").length), hint: "Trust officer" },
    { label: "Resolved", value: String(reports.filter((row) => row.status === "resolved").length), hint: "Flag cleared" },
    { label: "Total filed", value: String(reports.length), hint: "All time (latest 100)" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Inquiries & disputes"
        description="Member reports on conversations, plus the fraud patterns the inbox flags automatically (bank details, payment changes)."
        actions={<Badge tone={open.length ? "amber" : "green"}>{open.length} open</Badge>}
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Reports">
        <DataTable
          columns={[
            { key: "id", label: "Report", emphasis: true },
            { key: "subject", label: "Thread" },
            {
              key: "parties",
              label: "Parties",
              render: (row) => (row.parties || []).join(" ↔ "),
            },
            { key: "reportedBy", label: "Filed by" },
            { key: "reason", label: "Reason" },
            { key: "createdAt", label: "Raised", render: (row) => formatDate(row.createdAt) },
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
              render: (row) =>
                row.status === "open" ? (
                  <ModerationRow
                    id={row.id}
                    onAction={resolveInquiryReport}
                    actions={[
                      { label: "Resolve", value: "resolved" },
                      { label: "Escalate", value: "escalated", tone: "danger" },
                    ]}
                  />
                ) : (
                  <span className="text-[12px] text-slate-400">
                    {row.resolvedBy ? `by ${row.resolvedBy}` : "Decided"}
                  </span>
                ),
            },
          ]}
          rows={reports}
          empty="No reports filed — the inbox is clean."
        />
      </Section>

      <div className="panel mt-6 p-5">
        <p className="label-xs">Response playbook</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["Off-platform payment", "Warn first offence; suspend for repeat attempts."],
            ["Bank-detail changes", "Freeze the thread until both parties re-verify."],
            ["Spam / unsolicited", "Resolve and warn; three strikes suspend selling."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
