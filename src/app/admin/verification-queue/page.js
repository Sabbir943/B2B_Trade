import { ModerationRow } from "@/components/moderation-actions";
import { StaffSelect } from "@/components/staff-select";
import { Badge } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import {
  getVerificationQueue,
  listAllBadges,
  VERIFICATION_METHODS,
  statusLabel,
} from "@/lib/verification";
import {
  decideVerificationCase,
  assignVerificationMethod,
  revokeVerificationBadge,
} from "@/lib/actions";
import { plain, formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Verification queue" };

const STATUS_TONE = {
  submitted: "amber",
  in_review: "blue",
  visit_scheduled: "navy",
  awaiting_payment: "slate",
};

const METHOD_OPTIONS = VERIFICATION_METHODS.map((method) => ({
  value: method.key,
  label: method.label,
}));

/**
 * §7.5.3–5 queue — assign a verification method (opens the officer task),
 * decide the case (approve awards the badge; reject needs a reason) and
 * revoke badges when a complaint is proven.
 */
export default async function AdminVerificationQueuePage() {
  await requirePermission("admin.verification_queue");

  const queue = await getVerificationQueue();
  const badges = await listAllBadges(50);
  const rows = plain(queue);
  const badgeRows = plain(badges).slice(0, 20);

  const stats = [
    { label: "Open cases", value: String(rows.length), hint: "Non-terminal" },
    { label: "Awaiting visit", value: String(rows.filter((row) => row.status === "visit_scheduled").length), hint: "Site / partner visit" },
    { label: "Document checks", value: String(rows.filter((row) => row.method === "document_check").length), hint: "Desk review" },
    { label: "Badges live", value: String(badgeRows.filter((row) => !row.revokedAt).length), hint: "Not revoked" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Verification queue"
        description="Cases ordered by age. Approving publishes the badge with its award date and method across profiles, listings and threads."
        actions={<Badge tone="amber">{rows.length} open</Badge>}
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Cases">
        <DataTable
          columns={[
            { key: "id", label: "Case", emphasis: true },
            { key: "email", label: "Company" },
            { key: "levelLabel", label: "Level" },
            {
              key: "method",
              label: "Method",
              render: (row) => (
                <StaffSelect
                  value={row.method}
                  options={METHOD_OPTIONS}
                  placeholder="Assign method…"
                  onAction={(method) => assignVerificationMethod(row.id, method)}
                />
              ),
            },
            { key: "createdAt", label: "Submitted", render: (row) => formatDate(row.createdAt) },
            {
              key: "documents",
              label: "Docs",
              render: (row) => `${row.documents?.length || 0} file${row.documents?.length === 1 ? "" : "s"}`,
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <Badge tone={STATUS_TONE[row.status] || "slate"}>{statusLabel(row.status)}</Badge>
              ),
            },
            {
              key: "actions",
              label: "Decision",
              render: (row) => (
                <ModerationRow
                  id={row.id}
                  onAction={decideVerificationCase}
                  actions={[
                    { label: "Approve", value: "Approved" },
                    { label: "Visit", value: "Visit requested" },
                    { label: "Reject", value: "Rejected", tone: "danger", needsReason: true },
                  ]}
                />
              ),
            },
          ]}
          rows={rows}
          empty="Queue is clear — no open verification cases."
        />
      </Section>

      <Section className="mt-8" title="Badges">
        <DataTable
          columns={[
            { key: "id", label: "Badge", emphasis: true },
            { key: "email", label: "Company" },
            { key: "levelLabel", label: "Level" },
            { key: "methodLabel", label: "Method" },
            { key: "awardedAt", label: "Awarded", render: (row) => formatDate(row.awardedAt) },
            { key: "expiresAt", label: "Expires", render: (row) => formatDate(row.expiresAt) },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <Badge tone={row.revokedAt ? "red" : "green"}>
                  {row.revokedAt ? "Revoked" : "Active"}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "",
              render: (row) =>
                row.revokedAt ? (
                  <span className="text-[12px] text-slate-400">Revoked</span>
                ) : (
                  <ModerationRow
                    id={row.id}
                    onAction={revokeVerificationBadge}
                    actions={[
                      { label: "Revoke", value: "revoke", tone: "danger", needsReason: true },
                    ]}
                  />
                ),
            },
          ]}
          rows={badgeRows}
          empty="No badges issued yet."
        />
      </Section>

      <div className="panel mt-6 p-5">
        <p className="label-xs">Review standard</p>
        <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
          <li>· Registration documents match the registry extract.</li>
          <li>· Trade licence is current and category-appropriate.</li>
          <li>· Certificates cover the products actually listed.</li>
          <li>· Factory address confirmed before scheduling an audit.</li>
          <li>· A proven complaint revokes the badge and strips the flag.</li>
        </ul>
      </div>
    </>
  );
}
