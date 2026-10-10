import Link from "next/link";
import { shell } from "@/components/shell";
import { Badge, Button, EmptyState, PageHeader } from "@/components/ui";
import { UsersIcon } from "@/components/icons";
import { getSellersWithListings } from "@/lib/listings";
import { getProfiles, getProfile, completeness } from "@/lib/profile";
import { getTrustScores } from "@/lib/trust";
import { categories, categoriesById } from "@/lib/catalog";
import { connection } from "next/server";

export const instant = false;

export const metadata = { title: "Find suppliers" };


/**
 * §7.2.3 supplier directory — companies with at least one approved
 * listing, ranked by profile completeness (the §7.1.4 search rank).
 */
export default async function SuppliersPage({ searchParams }) {
  await connection();
  const { category = "" } = await searchParams;

  let sellers = await getSellersWithListings();
  if (category) {
    sellers = sellers.filter((row) =>
      row.listings.some((listing) => listing.category === category),
    );
  }

  const emails = sellers.map((row) => row.email);
  const profiles = await getProfiles(emails);
  const trust = await getTrustScores(emails);

  const rows = sellers
    .map((row) => {
      const profile = profiles.get(row.email) || {};
      const score = trust.get(row.email) || { score: 50, label: "New" };
      return {
        email: row.email,
        name: profile.legalName || row.email,
        city: profile.city || "",
        country: profile.country || "",
        about: profile.about || "",
        categories: profile.categories || [],
        count: row.count,
        completeness: completeness(profile).percent,
        trust: score,
      };
    })
    .sort((a, b) => b.completeness - a.completeness || b.count - a.count);

  return (
    <>
      <PageHeader
        eyebrow="Supplier directory"
        title="Find suppliers"
        description="Companies with approved listings on the platform. Complete profiles and verification badges rank higher."
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
            <p className="text-[13px] font-bold text-primary">Categories</p>
            <div className="mt-3 flex flex-col gap-1.5">
              <Link
                href="/suppliers"
                className={`rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                  !category ? "bg-primary text-white" : "text-slate-600 hover:bg-surface"
                }`}
              >
                All categories
              </Link>
              {categories.map((item) => (
                <Link
                  key={item.slug}
                  href={`/suppliers?category=${item.slug}`}
                  className={`rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                    category === item.slug ? "bg-primary text-white" : "text-slate-600 hover:bg-surface"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Badge tone="navy">{rows.length} suppliers with live listings</Badge>
              <span className="text-[12px] text-slate-500">Sorted by profile completeness</span>
            </div>

            {rows.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {rows.map((row) => (
                  <Link
                    key={row.email}
                    href={`/suppliers/${encodeURIComponent(row.email)}`}
                    className="panel group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
                        {row.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-[15px] font-bold text-primary group-hover:underline">
                          {row.name}
                        </h3>
                        <p className="text-[12px] text-slate-500">
                          {[row.city, row.country].filter(Boolean).join(", ") || "Location not set"}
                        </p>
                      </div>
                      <span className="ml-auto rounded-md bg-accent/20 px-2 py-1 text-[12px] font-bold text-accent-ink">
                        {row.trust.score}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-[13px] leading-6 text-slate-600">
                      {row.about || "No description yet."}
                    </p>

                    <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                      <Badge tone={row.completeness >= 70 ? "green" : "amber"}>
                        {row.completeness}% complete
                      </Badge>
                      <Badge tone="slate">{row.count} listing{row.count === 1 ? "" : "s"}</Badge>
                      {row.categories.slice(0, 2).map((slug) => (
                        <Badge key={slug} tone="navy">
                          {categoriesById[slug]?.name || slug}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<UsersIcon className="h-5 w-5" />}
                title={category ? "No suppliers in this category yet" : "No suppliers listed yet"}
                text="Suppliers appear here the moment their first listing is approved by moderation."
                action={
                  <Button href="/rfq" variant="accent" size="sm">
                    Post a requirement
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
