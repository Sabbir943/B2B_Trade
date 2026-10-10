import { ModerationRow } from "@/components/moderation-actions";
import { Badge } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { listInvoices, listDueReminders } from "@/lib/billing";
import { activateBankTransferPayment } from "@/lib/actions";
import { plain, formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Payments" };

const STATUS_TONE = { paid: "green", pending: "amber", awaiting_bank: "amber", failed: "red", quoted: "slate", cancelled: "slate" };

/**
 * §7.7.3–5 billing console — real invoices. Bank-transfer invoices are
 * activated by hand once funds clear; due renewal reminders are listed.
 */
export default async function AdminPaymentsPage() {
  await requirePermission("admin.payments");

  const invoices = plain(await listInvoices({ limit: 100 }));
  const reminders = plain(await listDueReminders(50));
  const awaiting = invoices.filter((row) => row.status === "awaiting_bank");
  const paid = invoices.filter((row) => row.status === "paid");

  const collected = paid.reduce((sum, row) => sum + (row.currency === "USD" ? row.amountUsd || 0 : 0), 0);

  const stats = [
    { label: "Awaiting bank", value: String(awaiting.length), hint: "Activate when cleared" },
    { label: "Paid invoices", value: String(paid.length), hint: "All kinds" },
    { label: "Collected (USD)", value: `$${collected.toLocaleString()}`, hint: "USD invoices only" },
    { label: "Renewal reminders due", value: String(reminders.length), hint: "30 / 7 / 1 days" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Payments"
        description="Invoices across memberships, verification fees and market-entry retainers. Gateway charges auto-activate; bank transfers need a staff confirmation."
        actions={<Badge tone={awaiting.length ? "amber" : "green"}>{awaiting.length} to activate</Badge>}
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Invoices">
        <DataTable
          columns={[
            { key: "id", label: "Invoice", emphasis: true },
            { key: "email", label: "Member" },
            { key: "label", label: "Description" },
            {
              key: "amount",
              label: "Amount",
              render: (row) =>
                row.currency === "BDT"
                  ? `BDT ${Number(row.amountBdt || 0).toLocaleString()}`
                  : `$${Number(row.amountUsd || 0).toLocaleString()}`,
            },
            {
              key: "method",
              label: "Method",
              render: (row) => row.method || row.kind || "—",
            },
            { key: "createdAt", label: "Issued", render: (row) => formatDate(row.createdAt) },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <Badge tone={STATUS_TONE[row.status] || "slate"}>{row.status}</Badge>
              ),
            },
            {
              key: "actions",
              label: "Action",
              render: (row) =>
                row.status === "awaiting_bank" ? (
                  <ModerationRow
                    id={row.id}
                    onAction={activateBankTransferPayment}
                    actions={[{ label: "Mark paid", value: "activate" }]}
                  />
                ) : row.status === "pending" ? (
                  <span className="text-[12px] text-slate-500">Awaiting member</span>
                ) : (
                  <span className="text-[12px] text-slate-400">—</span>
                ),
            },
          ]}
          rows={invoices}
          empty="No invoices yet."
        />
      </Section>

      <Section className="mt-8" title="Renewal reminders due">
        <DataTable
          columns={[
            { key: "email", label: "Member", emphasis: true },
            { key: "days", label: "Days left", render: (row) => `${row.days}` },
            { key: "dueAt", label: "Due", render: (row) => formatDate(row.dueAt) },
            { key: "expiresAt", label: "Expires", render: (row) => formatDate(row.expiresAt) },
          ]}
          rows={reminders}
          empty="No renewal reminders are due right now."
        />
      </Section>
    </>
  );
}
