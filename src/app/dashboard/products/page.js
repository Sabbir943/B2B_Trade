import { dashboard } from "@/lib/catalog";
import { Badge, Button, ProgressBar } from "@/components/ui";
import { BoxIcon, PlusIcon } from "@/components/icons";
import { DataTable, SampleNote, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  await requirePermission("member.products");
  const stats = [
    { label: "Live listings", value: "64", hint: "6 drafts in progress" },
    { label: "Views this month", value: "12,410", hint: "+8% vs last month" },
    { label: "Inquiries", value: "37", hint: "9 awaiting reply" },
    { label: "Search impressions", value: "48.2k", hint: "Sample figure" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Products"
        description="Everything you have listed — live, draft and under review. Keep specs, MOQ and packing current to stay ranked."
        actions={
          <>
            <Button href="/dashboard/verification" variant="outline" size="sm">
              Verification status
            </Button>
            <Button variant="navy" size="sm">
              <PlusIcon className="h-4 w-4" /> Add product
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="All listings">
        <DataTable
          columns={[
            { key: "name", label: "Product", emphasis: true },
            { key: "sku", label: "SKU" },
            { key: "category", label: "Category" },
            { key: "views", label: "Views" },
            { key: "inquiries", label: "Inquiries" },
            { key: "status", label: "Status", pill: true },
          ]}
          rows={dashboard.products}
        />
      </Section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <p className="label-xs">Profile completeness</p>
          <p className="mt-2 font-display text-xl font-bold text-primary">86%</p>
          <ProgressBar value={86} className="mt-3" />
          <p className="mt-3 text-[13px] leading-6 text-slate-600">
            Add packing videos and two more certificates to reach 100% — complete
            profiles receive 2.4× more inquiries.
          </p>
          <Button href="/dashboard/profile" variant="navy" size="sm" className="mt-4">
            Complete profile
          </Button>
        </div>

        <div className="panel p-5">
          <p className="label-xs">Listing quality</p>
          <div className="mt-3 space-y-3">
            {[
              ["Title & HS classification", "Complete", "green"],
              ["Specification table", "Complete", "green"],
              ["Certification documents", "2 of 4 uploaded", "amber"],
              ["Packing & shipping info", "Missing", "red"],
            ].map(([label, state, tone]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-slate-600">{label}</span>
                <Badge tone={tone}>{state}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface p-3 text-[13px] text-slate-600">
            <BoxIcon className="h-4 w-4 shrink-0 text-secondary" />
            Draft listings are hidden from search until published.
          </div>
        </div>
      </div>

      <SampleNote />
    </>
  );
}
