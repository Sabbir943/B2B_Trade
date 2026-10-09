import { hsCodes, products, categories, suppliers } from "@/lib/catalog";
import { shell } from "@/components/shell";
import { Badge, Button, EmptyState, PageHeader } from "@/components/ui";
import { ProductCard, SupplierCard } from "@/components/cards";
import { ArrowRightIcon, TagIcon } from "@/components/icons";
import { notFound } from "next/navigation";
import Link from "next/link";

export const instant = false;

export function generateStaticParams() {
  return hsCodes.map((item) => ({ code: item.code }));
}

export async function generateMetadata({ params }) {
  const { code } = await params;
  const entry = hsCodes.find((item) => item.code === code);
  return { title: entry ? `HS ${code} — ${entry.title}` : "HS code" };
}

export default async function HsCodePage({ params }) {
  const { code } = await params;
  const entry = hsCodes.find((item) => item.code === code);
  if (!entry) notFound();

  const matched = products.filter((product) => product.hs === code);
  const relatedCats = categories.filter((category) => category.hs === code);
  const matchedSuppliers = suppliers.filter((supplier) =>
    matched.some((product) => product.supplier === supplier.slug)
  );

  return (
    <>
      <PageHeader
        eyebrow="HS code"
        title={`HS ${entry.code} — ${entry.title}`}
        description={`Start from the tariff line to find suppliers who already ship goods classified under HS ${entry.code}.`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "HS codes", href: "/search?type=products" },
          { label: entry.code },
        ]}
        actions={
          <>
            <Button href="/rfq" variant="accent">
              Post Your Requirement
            </Button>
            <Button href="/search?type=products" variant="white">
              Browse all products
            </Button>
          </>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="navy">
            <TagIcon className="h-3 w-3" /> Heading {entry.code}
          </Badge>
          {relatedCats.map((category) => (
            <Badge key={category.slug} tone="slate">
              {category.name}
            </Badge>
          ))}
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow-text">Products</p>
              <h2 className="mt-3 font-display text-xl font-bold text-primary">
                Listings under HS {entry.code}
              </h2>
            </div>
            <Link
              href="/search?type=products"
              className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:flex"
            >
              See all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {matched.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matched.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                icon={<TagIcon className="h-6 w-6" />}
                title="No listings published for this heading yet"
                text="Post a requirement and matched suppliers will quote directly."
                action={
                  <Button href="/rfq" variant="accent" size="sm">
                    Post Your Requirement
                  </Button>
                }
              />
            </div>
          )}
        </div>

        <div className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow-text">Suppliers</p>
              <h2 className="mt-3 font-display text-xl font-bold text-primary">
                Companies shipping this heading
              </h2>
            </div>
            <Link
              href="/suppliers"
              className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:flex"
            >
              All suppliers <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5">
            {matchedSuppliers.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {matchedSuppliers.map((supplier) => (
                  <SupplierCard key={supplier.slug} supplier={supplier} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No supplier companies listed yet"
                text="Supplier profiles shipping this heading will appear here once verified data is provided."
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
