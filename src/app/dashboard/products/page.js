import { Button, EmptyState } from "@/components/ui";
import { BoxIcon, PlusIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Products" };

const listings = [];

const stats = [
  { label: "Live listings", value: "0", hint: "No listings yet" },
  { label: "Views this month", value: "0", hint: "No activity yet" },
  { label: "Inquiries", value: "0", hint: "No activity yet" },
  { label: "Search impressions", value: "0", hint: "No activity yet" },
];

export default async function ProductsPage() {
  await requirePermission("member.products");

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
          rows={listings}
          empty="No products listed yet."
        />
      </Section>

      <div className="mt-6">
        <EmptyState
          icon={<BoxIcon className="h-5 w-5" />}
          title="Add your first product"
          text="List specs, MOQ, packing and certifications — complete listings rank higher in buyer search and get more inquiries."
          action={
            <Button variant="navy" size="sm">
              <PlusIcon className="h-4 w-4" /> Add product
            </Button>
          }
        />
      </div>
    </>
  );
}
