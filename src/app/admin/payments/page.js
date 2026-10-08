import { admin } from "@/lib/catalog";
import { Button } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Payments" };

export default async function AdminPaymentsPage() {
  await requirePermission("admin.payments");
  const stats = [
    { label: "Collected (30d)", value: "$84.2k", hint: "Subscriptions + add-ons" },
    { label: "Failed charges", value: "6", hint: "Auto-retry in 48 hrs" },
    { label: "Refunds (30d)", value: "$412", hint: "3 requests" },
    { label: "Dunning recovery", value: "71%", hint: "Of failed charges" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Payments"
        description="Invoices, retries and refunds across all memberships. Failed charges enter dunning automatically."
        actions={
          <>
            <Button variant="outline" size="sm">
              Export ledger
            </Button>
            <Button variant="navy" size="sm">
              Retry failed
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Recent transactions">
        <DataTable
          columns={[
            { key: "id", label: "Invoice", emphasis: true },
            { key: "member", label: "Member" },
            { key: "amount", label: "Amount" },
            { key: "method", label: "Method" },
            { key: "date", label: "Date" },
            { key: "status", label: "Status", pill: true },
          ]}
          rows={admin.payments}
        />
      </Section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Card", "62% of revenue"],
          ["Wire", "24% of revenue"],
          ["bKash / Nagad", "9% of revenue"],
          ["Other", "5% of revenue"],
        ].map(([label, value]) => (
          <div key={label} className="panel p-5">
            <p className="label-xs">{label}</p>
            <p className="mt-1 font-display text-lg font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-base font-bold text-primary">
            One charge needs attention
          </p>
          <p className="mt-1 text-[13px] text-slate-600">
            INV-2026-1004 failed on 05 Oct — card declined twice.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            Contact member
          </Button>
          <Button variant="navy" size="sm">
            Retry now
          </Button>
        </div>
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Sample data shown for preview purposes.
      </p>
    </>
  );
}
