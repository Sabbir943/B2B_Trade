import { marketEntrySteps } from "@/lib/content";
import { getPricingSettings } from "@/lib/membership";
import { serviceFeePrice } from "@/lib/pricing";
import { shell } from "@/components/shell";
import { Badge, Button, PageHeader, SectionTitle } from "@/components/ui";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

export const metadata = { title: "Bangladesh Market Entry" };

const includes = [
  "Local sourcing officers based in Dhaka and Chattogram",
  "Factory shortlists with verification status attached",
  "Registration, import documentation and customs guidance",
  "Sample coordination and inspection scheduling",
  "First-shipment support until the route is stable",
];

export default async function MarketEntryPage() {
  const settings = await getPricingSettings();
  const entryFee = settings.serviceFees.find((fee) => fee.key === "market_entry");

  return (
    <>
      <PageHeader
        dark
        eyebrow="For overseas brands & importers"
        title="Bangladesh Market Entry"
        description="Enter one of Asia's fastest sourcing bases with a named officer: discovery, verification, documentation and first shipments handled end to end."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Market Entry" }]}
        actions={
          <>
            <Button href="/market-entry/apply" variant="white">
              Start an application
            </Button>
            <Button href="/contact" variant="outlineWhite">
              Talk to the desk
            </Button>
          </>
        }
      >
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge tone="slate">Textiles &amp; garments</Badge>
          <Badge tone="slate">Leather &amp; footwear</Badge>
          <Badge tone="slate">Jute &amp; agro</Badge>
          <Badge tone="slate">Home textiles</Badge>
        </div>
      </PageHeader>

      <section className={`py-8 sm:py-10 ${shell}`}>
        <SectionTitle eyebrow="The engagement" title="Four stages, one officer" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {marketEntrySteps.map((step, index) => (
            <div key={step.title} className="panel p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white font-display text-sm font-bold">
                  {index + 1}
                </span>
                {index < marketEntrySteps.length - 1 ? (
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

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="panel p-6">
            <p className="label-xs">What is included</p>
            <ul className="mt-4 space-y-3">
              {includes.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-slate-600">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/12 text-success">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-6">
            <p className="label-xs">Who it is for</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Brands and importers who want a Bangladesh sourcing route without
              building a local team first — typically first orders between
              $25,000 and $500,000, with room to scale once the supplier base is
              proven.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
              <div>
                <dt className="label-xs">Typical timeline</dt>
                <dd className="mt-1 font-display text-lg font-bold text-primary">
                  6–10 weeks
                </dd>
              </div>
              <div>
                <dt className="label-xs">Engagement fee</dt>
                <dd className="mt-1 font-display text-lg font-bold text-primary">
                  {entryFee ? serviceFeePrice(entryFee) : "Scoped per brief"}
                </dd>
              </div>
            </dl>
            <Button href="/market-entry/apply" variant="navy" className="mt-5 w-full">
              Start an application
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
