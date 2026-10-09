import { getPricingSettings } from "@/lib/membership";
import { tierHighlights, tierPriceLines } from "@/lib/pricing";
import { shell } from "@/components/shell";
import { Badge, Button, PageHeader, SectionTitle } from "@/components/ui";
import { ArrowRightIcon, CheckIcon, ShieldIcon } from "@/components/icons";

export const metadata = { title: "Sell on AlliedOne" };

const benefits = [
  {
    title: "Buyers come with intent",
    text: "Every buy requirement on the board carries a quantity, destination and date — no cold outreach required.",
  },
  {
    title: "Your badge travels with you",
    text: "Verified status shows in search, listings and inquiry threads, so introductions start with proof.",
  },
  {
    title: "HS-coded discovery",
    text: "Listings are classified to tariff headings, putting you in front of buyers searching the way procurement teams actually search.",
  },
  {
    title: "Trade records on-platform",
    text: "Quotes, messages and orders stay in one thread — useful for audits, renewals and your next buyer conversation.",
  },
];

const steps = [
  { title: "Create your company profile", text: "Free, takes about ten minutes." },
  { title: "List products with specs", text: "Grade, packing, MOQ, lead time, port." },
  { title: "Get verified", text: "Company checks are free; add document audits when ready." },
  { title: "Answer requirements", text: "Matched alerts surface the posts you can win." },
];

export default async function SellPage() {
  const settings = await getPricingSettings();
  return (
    <>
      <PageHeader
        dark
        eyebrow="For suppliers"
        title="Sell to verified buyers worldwide"
        description="List your products, answer live buy requirements and build a profile importers can trust — starting free."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sell" }]}
        actions={
          <>
            <Button href="/sign-up" variant="accent">
              Join Free
            </Button>
            <Button href="/supplier-guide" variant="white">
              Supplier guide
            </Button>
          </>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="panel p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/10 text-secondary">
                <CheckIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-primary">
                {benefit.title}
              </h3>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <SectionTitle eyebrow="Getting started" title="Four steps to first quote" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="panel p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white font-display text-sm font-bold">
                    {index + 1}
                  </span>
                  {index < steps.length - 1 ? (
                    <ArrowRightIcon className="hidden h-4 w-4 text-slate-300 lg:block" />
                  ) : null}
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-primary">
                  {step.title}
                </h3>
                <p className="mt-1 text-[13px] leading-6 text-slate-600">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <SectionTitle
            eyebrow="Pricing"
            title="Start free, upgrade when it pays"
            action={
              <Button href="/membership" variant="outline" size="sm">
                Compare all plans
              </Button>
            }
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {settings.tiers.map((tier) => {
              const price = tierPriceLines(tier);
              const founding =
                settings.founding.enabled && (tier.foundingUsd || tier.foundingBdt)
                  ? tierPriceLines(tier, { founding: true })
                  : null;

              return (
                <div key={tier.key} className="panel p-5">
                  <p className="label-xs">{tier.name}</p>
                  <p className="mt-2 font-display text-2xl font-bold text-primary">
                    {founding ? founding.usd : price.usd}
                    {price.cadence ? (
                      <span className="ml-1 text-[13px] font-medium text-slate-500">
                        {price.cadence}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-600">
                    {founding ? `${founding.bdt} first year · list ${price.bdt}` : price.bdt}
                  </p>
                  <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[13px] text-slate-600">
                    {tierHighlights(tier)
                      .slice(0, 3)
                      .map((highlight) => (
                        <li key={highlight} className="flex gap-2">
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                          {highlight}
                        </li>
                      ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-2xl bg-primary p-6 text-white sm:grid-cols-2 sm:items-center sm:p-8">
          <div className="flex gap-3">
            <ShieldIcon className="mt-1 h-6 w-6 shrink-0 text-white/70" />
            <div>
              <p className="font-display text-lg font-bold">
                Company verification is free
              </p>
              <p className="mt-1 text-sm leading-6 text-white/70">
                Every supplier can carry a Verified badge at no cost. Document
                and factory audits are optional add-ons when buyers ask for
                more depth.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <Button href="/sign-up" variant="accent">
              Join Free
            </Button>
            <Button href="/verification" variant="white">
              Get verified
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
