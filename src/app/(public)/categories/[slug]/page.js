import { notFound } from "next/navigation";
import Link from "next/link";
import { categories } from "@/lib/catalog";
import { shell } from "@/components/shell";
import { Badge, Button, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { getPublishedListings } from "@/lib/listings";
import { getProfiles } from "@/lib/profile";
import { getTrustScores } from "@/lib/trust";
import { connection } from "next/server";

export const instant = false;

export const metadata = { title: "Category" };


/**
 * §7.2.3 category page — approved listings in one category plus the
 * suppliers behind them.
 */
export default async function CategoryPage({ params }) {
  await connection();
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const items = await getPublishedListings({ category: slug, limit: 60 });
  const emails = [...new Set(items.map((listing) => listing.email))];
  const profiles = await getProfiles(emails);
  const trust = await getTrustScores(emails);

  const supplierRows = emails.map((email) => {
    const profile = profiles.get(email) || {};
    const score = trust.get(email) || { score: 50, label: "New" };
    return {
      email,
      name: profile.legalName || email,
      city: profile.city || "",
      country: profile.country || "",
      about: profile.about || "",
      count: items.filter((listing) => listing.email === email).length,
      trust: score,
    };
  });

  const related = categories.filter((item) => item.slug !== slug).slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow={`HS ${category.hs}`}
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
        <div className="flex flex-wrap gap-2">
          {category.sub.map((sub) => (
            <Badge key={sub} tone="slate">
              {sub}
            </Badge>
          ))}
        </div>

        <div className="mt-8">
          <SectionTitle
            eyebrow="Listings"
            title={`Products in ${category.name}`}
            action={
              <Button href="/search" variant="soft" size="sm">
                Open in search
              </Button>
            }
          />
          {items.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/products/${listing.id}`}
                  className="panel group flex flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <h3 className="font-display text-sm font-bold text-primary group-hover:underline">
                    {listing.title}
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    {listing.currency} {listing.priceMin}
                    {listing.priceMax && listing.priceMax !== listing.priceMin
                      ? `–${listing.priceMax}`
                      : ""}{" "}
                    · MOQ {listing.moq}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="No listings published yet"
                text="Supplier catalogues appear here as soon as moderation approves them."
                action={
                  <Button href="/rfq" variant="accent" size="sm">
                    Post a buy requirement
                  </Button>
                }
              />
            </div>
          )}
        </div>

        <div className="mt-10">
          <SectionTitle eyebrow="Who supplies this" title="Suppliers in this category" />
          <div className="mt-5">
            {supplierRows.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {supplierRows.map((supplier) => (
                  <Link
                    key={supplier.email}
                    href={`/suppliers/${encodeURIComponent(supplier.email)}`}
                    className="panel group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
                        {supplier.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-[15px] font-bold text-primary group-hover:underline">
                          {supplier.name}
                        </h3>
                        <p className="text-[12px] text-slate-500">
                          {[supplier.city, supplier.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <span className="ml-auto rounded-md bg-accent/20 px-2 py-1 text-[12px] font-bold text-accent-ink">
                        {supplier.trust.score}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[13px] leading-6 text-slate-600">
                      {supplier.about || "No description yet."}
                    </p>
                    <Badge tone="slate">
                      {supplier.count} listing{supplier.count === 1 ? "" : "s"}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No supplier companies listed yet"
                text="Supplier profiles for this category will appear here once listings are approved."
              />
            )}
          </div>
        </div>

        <div className="mt-10">
          <SectionTitle eyebrow="Keep browsing" title="Related categories" />
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/categories/${item.slug}`}
                className="panel-flat px-4 py-2 text-[13px] font-semibold text-ink transition hover:border-primary/40 hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
