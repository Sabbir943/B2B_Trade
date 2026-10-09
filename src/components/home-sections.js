import Link from "next/link";
import Image from "next/image";
import { categories, insights, requirements, siteStats } from "@/lib/catalog";
import { shell } from "./shell";
import { Badge, Button, EmptyState, SectionTitle } from "./ui";
import {
  ArrowRightIcon,
  BoxIcon,
  CheckIcon,
  ClipboardIcon,
  InboxIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  UsersIcon,
} from "./icons";

const featuredSlugs = [
  "spices",
  "chemicals",
  "construction-raw-materials",
  "feed-ingredients",
  "agro-products",
  "textile-garment-accessories",
];

const featuredImages = {
  spices:
    "https://images.unsplash.com/photo-1635355995448-77b02d33621d?auto=format&fit=crop&w=1200&h=800&q=80",
  chemicals:
    "https://images.unsplash.com/photo-1620203853151-496c7228306c?auto=format&fit=crop&w=1200&h=800&q=80",
  "construction-raw-materials":
    "https://images.unsplash.com/photo-1763771420583-ff167240e281?auto=format&fit=crop&w=1200&h=800&q=80",
  "feed-ingredients":
    "https://images.unsplash.com/photo-1782852580207-11c100a628e2?auto=format&fit=crop&w=1200&h=800&q=80",
  "agro-products":
    "https://images.unsplash.com/photo-1761549849498-8cf23a31329d?auto=format&fit=crop&w=1200&h=800&q=80",
  "textile-garment-accessories":
    "https://images.unsplash.com/photo-1552710307-537199cd41c0?auto=format&fit=crop&w=1200&h=800&q=80",
};

export function TrustStrip() {
  if (!siteStats.enabled) return null;
  return (
    <section className="border-b border-slate-200/70 bg-white">
      <div className={`py-6 ${shell}`}>
        <ul className="grid gap-2 sm:grid-cols-3 sm:gap-6">
          {siteStats.lines.map((line) => (
            <li
              key={line}
              className="text-center text-[14px] font-semibold leading-6 text-ink sm:text-left"
            >
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FeaturedCategories() {
  const items = featuredSlugs
    .map((slug) => {
      const category = categories.find((entry) => entry.slug === slug);
      return category ? { ...category, image: featuredImages[slug] } : null;
    })
    .filter(Boolean);

  return (
    <section className="bg-surface">
      <div className={`py-12 sm:py-16 ${shell}`}>
        <SectionTitle
          eyebrow="Browse the catalogue"
          title="Featured categories"
          action={
            <Button href="/categories" variant="outline" size="sm">
              All categories <ArrowRightIcon className="h-4 w-4" />
            </Button>
          }
        />

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="group relative isolate flex h-72 flex-col justify-end overflow-hidden rounded-2xl border border-slate-200 bg-primary shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Image
                src={category.image}
                alt={`${category.name} — ${category.blurb}`}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#06263f]/95 via-[#0a5486]/60 to-[#0a5486]/5" />
              <span className="grid-map absolute inset-0 opacity-40" />

              <span className="absolute right-4 top-4 rounded-md bg-white/15 px-2 py-1 font-mono text-[11px] font-bold text-white ring-1 ring-white/25 backdrop-blur-sm">
                HS {category.hs}
              </span>

              <div className="relative p-5">
                <h3 className="font-display text-lg font-bold leading-snug text-white">
                  {category.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-white/75">
                  {category.blurb}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {category.sub.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/85 ring-1 ring-white/15"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <span className="mt-4 flex items-center gap-1.5 text-[13px] font-bold text-accent">
                  Browse category
                  <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LiveRequirements() {
  const open = requirements.slice(0, 4);

  return (
    <section className="bg-white">
      <div className={`py-12 sm:py-16 ${shell}`}>
        <SectionTitle
          eyebrow="Demand board"
          title="Latest buy requirements"
          action={
            <Button href="/requirements" variant="soft" size="sm">
              View all requirements <ArrowRightIcon className="h-4 w-4" />
            </Button>
          }
        />

        {open.length ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden gap-4 border-b border-slate-200 bg-surface px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 md:grid md:grid-cols-[90px_1fr_130px_150px_120px_28px]">
              <span>HS code</span>
              <span>Requirement</span>
              <span>Quantity</span>
              <span>Destination</span>
              <span>Posted</span>
              <span className="sr-only">Open</span>
            </div>

            <ul className="divide-y divide-slate-100">
              {open.map((item) => {
                const hs = categories.find(
                  (category) => category.slug === item.category,
                )?.hs;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/requirements/${item.id}-${item.slug}`}
                      className="group grid gap-2 px-5 py-4 transition hover:bg-surface md:grid-cols-[90px_1fr_130px_150px_120px_28px] md:items-center md:gap-4"
                    >
                      <span className="font-mono text-[13px] font-bold text-primary">
                        {hs}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink group-hover:text-primary">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-slate-500">
                          {item.buyer} · {item.status}
                        </span>
                      </span>
                      <span className="text-[13px] font-semibold text-ink">
                        {item.qty}
                      </span>
                      <span className="text-[13px] text-slate-600">
                        {item.country}
                      </span>
                      <span className="text-[13px] text-slate-500">
                        {item.posted}
                      </span>
                      <ArrowRightIcon className="hidden h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary md:block" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              icon={<InboxIcon className="h-5 w-5" />}
              title="No buy requirements published yet"
              text="Buyer requests for this board will appear here as soon as they are posted."
              action={
                <Button href="/rfq" variant="accent" size="sm">
                  Post a requirement
                </Button>
              }
            />
          </div>
        )}
      </div>
    </section>
  );
}

export function VerifiedSuppliers() {
  return (
    <section className="bg-surface">
      <div className={`py-12 sm:py-16 ${shell}`}>
        <SectionTitle
          eyebrow="Certified trade partners"
          title="Verified suppliers"
          action={
            <Button href="/suppliers" variant="outline" size="sm">
              Find suppliers <ArrowRightIcon className="h-4 w-4" />
            </Button>
          }
        />

        <div className="mt-7">
          <EmptyState
            icon={<UsersIcon className="h-5 w-5" />}
            title="Supplier profiles are not published yet"
            text="Company names, logos and customer stories will appear here as soon as real supplier data is connected."
          />
        </div>
      </div>
    </section>
  );
}

export function MarketEntryBanner() {
  return (
    <section className="bg-white">
      <div className={`py-12 sm:py-16 ${shell}`}>
        <div className="grid-map relative overflow-hidden rounded-2xl bg-primary px-6 py-9 text-white sm:px-10 sm:py-11">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="eyebrow-rule" />
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                For overseas brands &amp; importers
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-[1.9rem]">
                Bangladesh Market Entry
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-white/75">
                Enter one of Asia&apos;s fastest sourcing bases with a local
                desk: supplier discovery, compliance checks, registration
                support and on-ground verification handled end to end.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button href="/market-entry" variant="white">
                How it works
              </Button>
              <Button href="/market-entry/apply" variant="navy">
                Start an application
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    icon: <ClipboardIcon className="h-5 w-5" />,
    title: "Post",
    text: "Publish what you need — specs, quantity, destination and budget.",
  },
  {
    icon: <SearchIcon className="h-5 w-5" />,
    title: "Match",
    text: "The marketplace and trade desk route it to suppliers who can deliver.",
  },
  {
    icon: <ShieldIcon className="h-5 w-5" />,
    title: "Verify",
    text: "Company documents, factory audits and badges confirm who you deal with.",
  },
  {
    icon: <BoxIcon className="h-5 w-5" />,
    title: "Trade",
    text: "Quote, sample, contract and ship with docs and logistics support.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-surface">
      <div className={`py-12 sm:py-16 ${shell}`}>
        <SectionTitle
          eyebrow="The workflow"
          title="How it works"
          action={
            <Button href="/buyer-guide" variant="soft" size="sm">
              Read the full guide
            </Button>
          }
        />

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="panel relative p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary">
                  {step.icon}
                </span>
                <span className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-primary">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SourcingDesk() {
  return (
    <section className="bg-white">
      <div className={`py-12 sm:py-16 ${shell}`}>
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-surface p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="eyebrow-rule" />
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Sourcing Desk
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-primary">
              Can&apos;t find a supplier? Our team will source it for you.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-600">
              Send the specification — our sourcing officers shortlist factories,
              check documentation, negotiate samples and hand you a comparable
              quote pack. Typical turnaround is five working days.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button href="/sourcing-service" variant="navy">
                Request sourcing
              </Button>
              <Button href="/rfq" variant="outline">
                Post a requirement
              </Button>
            </div>
          </div>

          <ul className="grid gap-3">
            {[
              "Supplier discovery across 12 categories",
              "Sample coordination and quality notes",
              "Factory audit scheduling before ordering",
              "Comparable quote pack with lead times",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl bg-white p-4 text-sm text-slate-600"
              >
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/12 text-success">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const badgeLevels = [
  {
    tone: "Company",
    title: "Company checked",
    text: "Registration, trade licence and bank details confirmed for the legal entity.",
  },
  {
    tone: "Documents",
    title: "Documents audited",
    text: "Export licences, product certificates and test reports reviewed by the trade desk.",
  },
  {
    tone: "Factory",
    title: "Factory audited",
    text: "On-site audit covering capacity, quality systems and social compliance.",
  },
];

export function VerificationBadges() {
  return (
    <section className="bg-surface">
      <div className={`py-12 sm:py-16 ${shell}`}>
        <SectionTitle
          eyebrow="Trust markers"
          title="Verification badges explained"
          action={
            <Button href="/verification-badges" variant="outline" size="sm">
              Badge reference <ArrowRightIcon className="h-4 w-4" />
            </Button>
          }
        />

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {badgeLevels.map((level) => (
            <div key={level.title} className="panel p-5">
              <Badge tone="green">
                <CheckIcon className="h-3 w-3" /> {level.tone} verified
              </Badge>
              <h3 className="mt-3 font-display text-base font-bold text-primary">
                {level.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
                {level.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-5 flex items-center gap-2 text-[13px] text-slate-500">
          <ShieldIcon className="h-4 w-4 text-secondary" />
          Badges sit beside every supplier name in search results and listings —
          clear them once and they follow your profile everywhere.
        </p>
      </div>
    </section>
  );
}

export function LatestInsights() {
  const latest = insights.slice(0, 3);

  return (
    <section className="bg-white">
      <div className={`py-12 sm:py-16 ${shell}`}>
        <SectionTitle
          eyebrow="Trade Insights"
          title="Latest from the research desk"
          action={
            <Button href="/insights" variant="soft" size="sm">
              All insights <ArrowRightIcon className="h-4 w-4" />
            </Button>
          }
        />

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {latest.map((article) => (
            <Link
              key={article.slug}
              href={`/insights/${article.slug}`}
              className="panel group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <Badge tone="navy">{article.category}</Badge>
                <span className="text-[12px] text-slate-500">{article.read}</span>
              </div>
              <h3 className="mt-3 font-display text-[15px] font-bold leading-snug text-primary group-hover:underline">
                {article.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-slate-600">
                {article.excerpt}
              </p>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-[12px] text-slate-500">
                <span>{article.date}</span>
                <span className="flex items-center gap-1 font-semibold text-primary">
                  Read <ArrowRightIcon className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="bg-surface">
      <div className={`pb-14 sm:pb-20 ${shell}`}>
        <div className="grid-map relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-white sm:px-10 sm:py-12">
          <div className="relative max-w-2xl">
            <span className="eyebrow-rule" />
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
              Two sides, one marketplace
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-[1.9rem]">
              Join free. Start trading across borders.
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-white/75">
              Create a buyer or supplier account in minutes — post requirements,
              list products and get matched with verified trading partners.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/sign-up" variant="accent">
                Join Free
              </Button>
              <Button href="/rfq" variant="white">
                Post Your Requirement
              </Button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[13px] text-white/60">
              <StarIcon className="h-4 w-4" />
              Free plan available · No card required · Cancel paid plans anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
