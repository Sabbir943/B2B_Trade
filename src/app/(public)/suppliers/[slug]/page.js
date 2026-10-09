import { notFound } from "next/navigation";
import { categories, products, suppliers } from "@/lib/catalog";
import { shell } from "@/components/shell";
import { Badge, Button, PageHeader, SectionTitle, Tabs } from "@/components/ui";
import { ProductCard } from "@/components/cards";
import InquiryForm from "@/components/inquiry-form";
import { ClockIcon, MapPinIcon, StarIcon } from "@/components/icons";

export const metadata = { title: "Supplier profile" };

export const instant = false;

export default async function SupplierProfilePage({ params }) {
  const { slug } = await params;
  const supplier = suppliers.find((item) => item.slug === slug);
  if (!supplier) notFound();

  const items = products.filter((item) => item.supplier === supplier.slug);
  const supplierCategories = categories.filter((item) =>
    supplier.categories.includes(item.slug),
  );

  return (
    <>
      <PageHeader
        dark
        eyebrow={`${supplier.city}, ${supplier.country} · Member since ${supplier.founded}`}
        title={supplier.name}
        description={supplier.desc}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Suppliers", href: "/suppliers" },
          { label: supplier.name },
        ]}
        actions={
          <>
            <Button href="/rfq" variant="white">
              Send a requirement
            </Button>
            <Button href="#contact" variant="navy">
              Contact supplier
            </Button>
          </>
        }
      >
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 font-display text-xl font-bold text-white ring-1 ring-white/20">
            {supplier.name
              .split(" ")
              .slice(0, 2)
              .map((word) => word[0])
              .join("")}
          </span>
          <div className="flex flex-wrap gap-2">
            {supplier.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white ring-1 ring-white/15"
              >
                {badge}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-bold text-accent-ink">
            <StarIcon className="h-4 w-4" /> {supplier.rating}
            <span className="font-medium opacity-80">({supplier.reviews})</span>
          </div>
        </div>
      </PageHeader>

      <section className={`py-7 sm:py-9 ${shell}`}>
        <Tabs
          active="Overview"
          items={[
            { label: "Overview", href: "#overview" },
            { label: `Products (${items.length})`, href: "#products" },
            { label: "Verification", href: "#certifications" },
            { label: "Contact", href: "#contact" },
          ]}
          className="max-w-2xl"
        />

        <div id="overview" className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="panel p-5 sm:p-6">
              <p className="label-xs">Company profile</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {supplier.desc} Operations run from {supplier.city} with a team of{" "}
                {supplier.employees} across production, quality and export
                documentation.
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="label-xs">Founded</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-primary">
                    {supplier.founded}
                  </dd>
                </div>
                <div>
                  <dt className="label-xs">Listings</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-primary">
                    {supplier.products}
                  </dd>
                </div>
                <div>
                  <dt className="label-xs">Response</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-primary">
                    {supplier.responseRate}%
                  </dd>
                </div>
                <div>
                  <dt className="label-xs">Reply time</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-primary">
                    {supplier.responseTime}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="panel p-5 sm:p-6">
              <p className="label-xs">Markets & categories</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {supplierCategories.map((category) => (
                  <a key={category.slug} href={`/categories/${category.slug}`}>
                    <Badge tone="navy" className="hover:ring-1 hover:ring-primary">
                      {category.name}
                    </Badge>
                  </a>
                ))}
                <Badge tone="green">European Union</Badge>
                <Badge tone="green">GCC</Badge>
                <Badge tone="green">United Kingdom</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-5 border-t border-slate-100 pt-4 text-[13px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="h-4 w-4 text-secondary" /> {supplier.city},{" "}
                  {supplier.country}
                </span>
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4 text-secondary" /> Replies in{" "}
                  {supplier.responseTime} on average
                </span>
              </div>
            </div>

            <div id="products">
              <SectionTitle eyebrow="Catalogue" title="Active listings" />
              {items.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {items.map((product) => (
                    <ProductCard key={product.slug} product={product} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Catalogue is being updated — send a requirement to receive
                  quotations directly.
                </p>
              )}
            </div>
          </div>

          <div id="contact" className="space-y-4">
            <div className="panel sticky top-28 p-5">
              <p className="label-xs">Trade desk note</p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Messages stay on-platform and appear in both inboxes, so quotes
                and revisions keep a complete record.
              </p>
              <div className="mt-4">
                <InquiryForm subject={supplier.name} compact />
              </div>
            </div>
          </div>
        </div>

        <div id="certifications" className="mt-10">
          <SectionTitle
            eyebrow="Documents on file"
            title="Verification & audits"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {supplier.badges.map((badge, index) => (
              <div key={badge} className="panel p-4">
                <Badge tone={index === 0 ? "amber" : "navy"}>{badge}</Badge>
                <p className="mt-2 text-[13px] leading-6 text-slate-600">
                  Reviewed by the AlliedOne trade desk; renewal on the
                  schedule shown in the member dashboard.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
