import { notFound } from "next/navigation";
import Link from "next/link";
import { shell } from "@/components/shell";
import { Badge, Button, PageHeader, SectionTitle, Tabs } from "@/components/ui";
import PublicInquiry from "@/components/public-inquiry";
import { ClockIcon, MapPinIcon, StarIcon } from "@/components/icons";
import { getPublishedListings } from "@/lib/listings";
import { getProfile, completeness } from "@/lib/profile";
import { getActiveBadge, getBadges } from "@/lib/verification";
import { getTrustScore } from "@/lib/trust";
import { getSessionContext } from "@/lib/session";
import { categoriesById } from "@/lib/catalog";
import { formatDate } from "@/lib/refs";
import { connection } from "next/server";

export const instant = false;

export const metadata = { title: "Supplier profile" };


function isActiveBadge(badge) {
  return !badge.revokedAt && new Date(badge.expiresAt).getTime() > Date.now();
}

/**
 * §7.1 / §7.2 supplier profile — public company page keyed by the account
 * email, showing approved listings, verification badges and the contact
 * composer (sign-in required).
 */
export default async function SupplierProfilePage({ params }) {
  await connection();
  const { slug } = await params;
  const email = decodeURIComponent(slug).toLowerCase();
  const profile = await getProfile(email);
  if (!profile.legalName && !(await getPublishedListings({ email, limit: 1 })).length) notFound();

  const { user } = await getSessionContext();
  const isSelf = user && String(user.email).toLowerCase() === email;

  const [listings, badge, badges, trust] = await Promise.all([
    getPublishedListings({ email, limit: 40 }),
    getActiveBadge(email),
    getBadges(email),
    getTrustScore(email),
  ]);

  const meter = completeness(profile);
  const supplierCategories = (profile.categories || []).map((slugKey) => categoriesById[slugKey]).filter(Boolean);

  return (
    <>
      <PageHeader
        dark
        eyebrow={`${[profile.city, profile.country].filter(Boolean).join(", ") || "Location not set"}${profile.yearEstablished ? ` · Established ${profile.yearEstablished}` : ""}`}
        title={profile.legalName || email}
        description={profile.about || "Company profile on AlliedOne Trade Hub."}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Suppliers", href: "/suppliers" },
          { label: profile.legalName || email },
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
            {(profile.legalName || email).slice(0, 2).toUpperCase()}
          </span>
          <div className="flex flex-wrap gap-2">
            {badge ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white ring-1 ring-white/15">
                {badge.levelLabel} · {formatDate(badge.awardedAt)}
              </span>
            ) : null}
            {badges
              .filter((item) => item.id !== badge?.id)
              .slice(0, 2)
              .map((item) => (
                <span
                  key={item.id}
                  className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/70 ring-1 ring-white/15"
                >
                  {item.levelLabel} ({item.revokedAt ? "revoked" : "expired"})
                </span>
              ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-bold text-accent-ink">
            <StarIcon className="h-4 w-4" /> {trust.score}
            <span className="font-medium opacity-80">({trust.label})</span>
          </div>
        </div>
      </PageHeader>

      <section className={`py-7 sm:py-9 ${shell}`}>
        <Tabs
          active="Overview"
          items={[
            { label: "Overview", href: "#overview" },
            { label: `Products (${listings.length})`, href: "#products" },
            { label: "Verification", href: "#certifications" },
            { label: "Contact", href: "#contact" },
          ]}
          className="max-w-2xl"
        />

        <div id="overview" className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="panel p-5 sm:p-6">
              <p className="label-xs">Company profile</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {profile.about || "No company description yet."}
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="label-xs">Founded</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-primary">
                    {profile.yearEstablished || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="label-xs">Listings</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-primary">
                    {listings.length}
                  </dd>
                </div>
                <div>
                  <dt className="label-xs">Complete</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-primary">
                    {meter.percent}%
                  </dd>
                </div>
                <div>
                  <dt className="label-xs">Business type</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-primary">
                    {profile.businessType || "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="panel p-5 sm:p-6">
              <p className="label-xs">Categories & location</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {supplierCategories.length ? (
                  supplierCategories.map((category) => (
                    <Link key={category.slug} href={`/categories/${category.slug}`}>
                      <Badge tone="navy" className="hover:ring-1 hover:ring-primary">
                        {category.name}
                      </Badge>
                    </Link>
                  ))
                ) : (
                  <Badge tone="slate">No categories set</Badge>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-5 border-t border-slate-100 pt-4 text-[13px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="h-4 w-4 text-secondary" />{" "}
                  {[profile.city, profile.country].filter(Boolean).join(", ") || "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4 text-secondary" /> Trade volume:{" "}
                  {profile.tradeVolume || "not stated"}
                </span>
              </div>
            </div>

            <div id="products">
              <SectionTitle eyebrow="Catalogue" title="Active listings" />
              {listings.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {listings.map((listing) => (
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
                <p className="mt-4 text-sm text-slate-500">
                  Catalogue is being updated — send a requirement to receive quotations
                  directly.
                </p>
              )}
            </div>
          </div>

          <div id="contact" className="space-y-4">
            <div className="panel sticky top-28 p-5">
              <p className="label-xs">Trade desk note</p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Messages stay on-platform and appear in both inboxes, so quotes and
                revisions keep a complete record.
              </p>
              <div className="mt-4">
                {isSelf ? (
                  <Button href="/dashboard/profile" variant="outline" size="sm" className="w-full">
                    This is your profile
                  </Button>
                ) : (
                  <PublicInquiry
                    to={email}
                    subject={`Inquiry: ${profile.legalName || "company"}`}
                    signedIn={Boolean(user)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div id="certifications" className="mt-10">
          <SectionTitle eyebrow="Documents on file" title="Verification & audits" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {badges.length ? (
              badges.slice(0, 6).map((item) => (
                <div key={item.id} className="panel p-4">
                  <Badge tone={item.revokedAt ? "red" : isActiveBadge(item) ? "green" : "amber"}>
                    {item.levelLabel}
                  </Badge>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600">
                    {item.methodLabel} · awarded {formatDate(item.awardedAt)} · expires{" "}
                    {formatDate(item.expiresAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No verification badges on file yet — ask for documents before paying a
                supplier.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
