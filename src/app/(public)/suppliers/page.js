import { categories } from "@/lib/catalog";
import { shell } from "@/components/shell";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";
import { FilterIcon, UsersIcon } from "@/components/icons";

export const metadata = { title: "Find suppliers" };

export default function SuppliersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Supplier directory"
        title="Find suppliers"
        description="Filter by category, market and certification level. Every profile shows response behaviour, catalogue depth and trade documents."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Suppliers" }]}
        actions={
          <>
            <Button href="/verification" variant="outline">
              Verification programme
            </Button>
            <Button href="/rfq" variant="accent">
              Post a requirement
            </Button>
          </>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="panel h-fit p-5 lg:sticky lg:top-28">
            <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
              <FilterIcon className="h-4 w-4" /> Filters
            </p>

            <div className="mt-4 space-y-4">
              <Field label="Keyword">
                <Input placeholder="Product, company or HS code" />
              </Field>
              <Field label="Category">
                <Select defaultValue="">
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.slug}>{category.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Verification level">
                <Select defaultValue="">
                  <option value="">Any level</option>
                  <option>Company checked</option>
                  <option>Documents audited</option>
                  <option>Factory audited</option>
                </Select>
              </Field>
              <Field label="Destination market">
                <Select defaultValue="">
                  <option value="">Any market</option>
                  <option>European Union</option>
                  <option>GCC</option>
                  <option>United Kingdom</option>
                  <option>North America</option>
                </Select>
              </Field>
              <Button variant="navy" size="sm" className="w-full">
                Apply filters
              </Button>
              <p className="text-center text-[12px] text-slate-500">
                Supplier profiles are not published yet
              </p>
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="navy">Response ≥ 85%</Badge>
                <Badge tone="slate">Export licensed</Badge>
                <Badge tone="slate">Factory audit ready</Badge>
              </div>
              <Select defaultValue="rating" className="w-auto">
                <option value="rating">Sort: rating</option>
                <option>Sort: response rate</option>
                <option>Sort: catalogue size</option>
                <option>Sort: newest</option>
              </Select>
            </div>

            <EmptyState
              icon={<UsersIcon className="h-5 w-5" />}
              title="No supplier companies listed yet"
              text="Supplier names, logos and profiles will be listed here once verified data is provided."
              action={
                <Button href="/rfq" variant="accent" size="sm">
                  Post a requirement
                </Button>
              }
            />
          </div>
        </div>
      </section>
    </>
  );
}
