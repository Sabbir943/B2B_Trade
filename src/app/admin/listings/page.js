import { admin } from "@/lib/catalog";
import { Button } from "@/components/ui";
import { AlertIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getStaffStatuses } from "@/lib/audit";
import { moderateListing } from "@/lib/actions";
import { RowActions } from "@/components/staff-actions";

export const metadata = { title: "Listings moderation" };

export default async function AdminListingsPage() {
  await requirePermission("admin.listings");
  const statuses = await getStaffStatuses("listing");
  const rows = admin.listings.map((item) => ({
    ...item,
    status: statuses[item.id]?.status ?? item.status,
  }));
  const stats = [
    { label: "Under review", value: "18", hint: "2 reported today" },
    { label: "Moderated (30d)", value: "1,948", hint: "96% within SLA" },
    { label: "Approved", value: "1,901", hint: "97.6% approval rate" },
    { label: "Removed", value: "47", hint: "Price claims dominate" },
  ];

  const reasons = [
    ["Price claim", "Unsupported unit pricing", "18"],
    ["Image rights", "Stock or competitor images", "12"],
    ["Duplicate", "Same SKU listed twice", "9"],
    ["Restricted", "Prohibited or unlicensed goods", "3"],
  ];

  return (
    <>
      <WorkspaceHeader
        title="Listing moderation"
        description="Reported products with their flags. Approvals are instant; removals notify the seller with the reason."
        actions={
          <>
            <Button variant="outline" size="sm">
              Bulk approve
            </Button>
            <Button variant="navy" size="sm">
              Next report
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Reported listings">
        <DataTable
          columns={[
            { key: "id", label: "Listing", emphasis: true },
            { key: "product", label: "Product" },
            { key: "seller", label: "Seller" },
            { key: "flag", label: "Flag" },
            { key: "reported", label: "Reported" },
            { key: "status", label: "Status", pill: true },
            {
              key: "actions",
              label: "Decision",
              render: (row) => (
                <RowActions
                  id={row.id}
                  onAction={moderateListing}
                  actions={[
                    { label: "Approve", value: "Approved" },
                    { label: "Remove", value: "Removed", tone: "danger" },
                  ]}
                />
              ),
            },
          ]}
          rows={rows}
        />
      </Section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <p className="label-xs">Flag reasons (30 days)</p>
          <div className="mt-4 space-y-3">
            {reasons.map(([label, text, count]) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-50 font-display text-sm font-bold text-red-600">
                  {count}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{label}</p>
                  <p className="text-[13px] text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-primary">
            <AlertIcon className="h-4 w-4 text-secondary" />
            Moderation rules
          </p>
          <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
            <li>· Claims must match certificates attached to the listing.</li>
            <li>· Unit pricing needs a basis (kg, MT, pc, m²).</li>
            <li>· Third-party images require written permission.</li>
            <li>· Three removals trigger a member warning review.</li>
          </ul>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            Open policy
          </Button>
        </div>
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Sample rows — approvals and removals run through a server action that
        checks <span className="font-semibold">admin.listings</span> and appends
        an audit-log entry.
      </p>
    </>
  );
}
