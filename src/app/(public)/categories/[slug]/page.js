import { notFound } from "next/navigation";
import { categories, products, suppliers } from "@/lib/catalog";
import { shell } from "@/components/shell";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  SectionTitle,
  Select,
} from "@/components/ui";
import { ProductCard, SupplierCard } from "@/components/cards";

export const metadata = { title: "Category" };

export function generateStaticParams() {
  return categories.map((item) => ({ slug: item.slug }));
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const items = products.filter((item) => item.category === slug);
  const categorySuppliers = suppliers.filter((item) =>
    item.categories.includes(slug),
  );
  const related = categories
    .filter((item) => item.slug !== slug)
    .slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow={`HS ${category.hs} · ${category.count.toLocaleString()} listings`}
        title={category.name}
        description={category.blurb}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
        actions={
          <>
            <Button href="/suppliers" variant="outline">
              Compare suppliers
            </Button>
            <Button href="/rfq" variant="accent">
              Source this category
            </Button>
          </>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-500">
                Sub-category
              </span>
              <Select defaultValue="">
                <option value="">All sub-categories</option>
                {category.sub.map((sub) => (
                  <option key={sub}>{sub}</option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-500">
                Verification level
              </span>
              <Select defaultValue="">
                <option value="">Any level</option>
                <option>Company checked</option>
                <option>Documents audited</option>
                <option>Factory audited</option>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-500">
                Destination
              </span>
              <Select defaultValue="">
                <option value="">Any market</option>
                <option>European Union</option>
                <option>GCC</option>
                <option>United Kingdom</option>
                <option>North America</option>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-500">
                Sort by
              </span>
              <Select defaultValue="relevant">
                <option value="relevant">Most relevant</option>
                <option>Newest listings</option>
                <option>Best response rate</option>
                <option>Lowest MOQ</option>
              </Select>
            </label>
          </div>
          <Badge tone="navy" className="self-start lg:mb-2.5">
            {items.length * 214 + category.count} results
          </Badge>
        </div>

        <div className="mt-8">
          <SectionTitle
            eyebrow="Listing sample"
            title={`Products in ${category.name}`}
            action={
              <Button href="/search" variant="soft" size="sm">
                Open in search
              </Button>
            }
          />
          {items.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Listings are being indexed"
                text="This category is live for buyers — supplier catalogues will appear here as they are published."
                action={
                  <Button href="/rfq" variant="accent" size="sm">
                    Post a buy requirement
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {categorySuppliers.length ? (
          <div className="mt-10">
            <SectionTitle eyebrow="Who supplies this" title="Suppliers in this category" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {categorySuppliers.map((supplier) => (
                <SupplierCard key={supplier.slug} supplier={supplier} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-10">
          <SectionTitle eyebrow="Keep browsing" title="Related categories" />
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((item) => (
              <a
                key={item.slug}
                href={`/categories/${item.slug}`}
                className="panel-flat px-4 py-2 text-[13px] font-semibold text-ink transition hover:border-primary/40 hover:text-primary"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
