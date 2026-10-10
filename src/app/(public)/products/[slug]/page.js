import { notFound } from "next/navigation";
import Link from "next/link";
import { categories } from "@/lib/catalog";
import { shell } from "@/components/shell";
import { Badge, Breadcrumbs, Button, Panel, SectionTitle } from "@/components/ui";
import PublicInquiry from "@/components/public-inquiry";
import { StarIcon } from "@/components/icons";
import { getListing, getPublishedListings, recordListingView } from "@/lib/listings";
import { getActiveBadge } from "@/lib/verification";
import { getTrustScore } from "@/lib/trust";
import { getProfile } from "@/lib/profile";
import { getSessionContext } from "@/lib/session";
import { categoriesById } from "@/lib/catalog";
import { formatDate } from "@/lib/refs";
import { connection } from "next/server";

export const instant = false;

export const metadata = { title: "Product" };


/**
 * §7.2.3 public listing detail — only approved listings resolve here; each
 * view increments the seller's counter. Contact goes through the inbox.
 */
export default async function ProductPage({ params }) {
  await connection();
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing || listing.status !== "approved") notFound();

  await recordListingView(listing.id);

  const { user } = await getSessionContext();
  const isSeller = user && String(user.email).toLowerCase() === listing.email;

  const [sellerProfile, badge, trust, related] = await Promise.all([
    getProfile(listing.email),
    getActiveBadge(listing.email),
    getTrustScore(listing.email),
    getPublishedListings({ category: listing.category, limit: 4 }),
  ]);

  const category = categoriesById[listing.category];
  const priceRange =
    listing.priceMax && listing.priceMax !== listing.priceMin
      ? `${listing.currency} ${listing.priceMin}–${listing.priceMax}`
      : `${listing.currency} ${listing.priceMin}`;

  return (
    <section className={`py-7 sm:py-9 ${shell}`}>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category?.name ?? "Products", href: `/categories/${listing.category}` },
          { label: listing.title },
        ]}
      />

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid-map flex h-56 items-end justify-between rounded-2xl bg-gradient-to-br from-primary via-[#153050] to-[#1e4168] p-5 sm:h-72">
            <div>
              <span className="label-xs text-white/60">{category?.name}</span>
              <p className="mt-1 max-w-md font-display text-xl font-bold leading-tight text-white sm:text-2xl">
                {listing.title}
              </p>
            </div>
            {listing.hsCode ? (
              <span className="rounded-lg bg-white/15 px-3 py-1 text-[12px] font-bold text-white">
                HS {listing.hsCode}
              </span>
            ) : null}
          </div>

          <div className="panel mt-5 p-5 sm:p-6">
            <p className="label-xs">Specification</p>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {[
                  ["MOQ", listing.moq],
                  ["Price range", priceRange],
                  ["Incoterm", listing.incoterm],
                  ["Supply capacity", listing.capacity || "—"],
                  ["Origin", listing.originCountry || "—"],
                  ["Listed", formatDate(listing.createdAt)],
                ].map(([key, value]) => (
                  <tr key={key} className="border-b border-slate-100 last:border-0">
                    <th className="w-1/2 py-2.5 text-left font-medium text-slate-500">{key}</th>
                    <td className="py-2.5 font-semibold text-ink">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel mt-5 p-5 sm:p-6">
            <p className="label-xs">About this listing</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {listing.description}
            </p>
          </div>

          {related.filter((item) => item.id !== listing.id).length ? (
            <div className="mt-9">
              <SectionTitle eyebrow="Similar offers" title="Related listings" />
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related
                  .filter((item) => item.id !== listing.id)
                  .slice(0, 3)
                  .map((item) => (
                    <Link
                      key={item.id}
                      href={`/products/${item.id}`}
                      className="panel group flex flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <h3 className="font-display text-sm font-bold text-primary group-hover:underline">
                        {item.title}
                      </h3>
                      <p className="text-[12px] text-slate-500">
                        {item.currency} {item.priceMin} · MOQ {item.moq}
                      </p>
                    </Link>
                  ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="panel sticky top-28 p-5">
            <p className="label-xs">Seller</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
                {(sellerProfile.legalName || listing.email).slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm font-bold text-ink">
                  {sellerProfile.legalName || listing.email}
                  {badge ? (
                    <span className="text-success" title={`${badge.levelLabel} · ${badge.methodLabel}`}>
                      ✓
                    </span>
                  ) : null}
                </p>
                <p className="flex items-center gap-1 text-[12px] text-slate-500">
                  {sellerProfile.city ? `${sellerProfile.city}, ` : ""}
                  {sellerProfile.country} · trust {trust.score}
                  <StarIcon className="h-3 w-3 text-accent" />
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {badge ? <Badge tone="green">{badge.levelLabel}</Badge> : null}
              <Badge tone="slate">{trust.label}</Badge>
            </div>

            <div className="mt-5">
              {isSeller ? (
                <Button href="/dashboard/products" variant="outline" className="w-full">
                  This is your listing
                </Button>
              ) : (
                <PublicInquiry
                  to={listing.email}
                  subject={`Inquiry: ${listing.title}`}
                  listingId={listing.id}
                  signedIn={Boolean(user)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
