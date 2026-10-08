import { sourcingDeskServices } from "@/lib/content";
import { getPricingSettings } from "@/lib/membership";
import { serviceFeePrice } from "@/lib/pricing";
import { shell } from "@/components/shell";
import { Badge, Button, PageHeader, SectionTitle } from "@/components/ui";
import InquiryForm from "@/components/inquiry-form";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

export const metadata = { title: "Sourcing Desk" };

const process = [
  { title: "Brief", text: "You describe specs, volume, quality bar and target price." },
  { title: "Shortlist", text: "Officers return three to five checked suppliers per round." },
  { title: "Validate", text: "Samples, audits and pricing negotiated through your desk." },
  { title: "Order", text: "Trade records, inspection and shipment support to delivery." },
];

export default async function SourcingServicePage() {
  const settings = await getPricingSettings();
  const deskFee = settings.serviceFees.find((fee) => fee.key === "sourcing_desk");
  const marketEntryFee = settings.serviceFees.find((fee) => fee.key === "market_entry");

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Sourcing Desk"
        description="A managed sourcing team for buyers who would rather spend their time on product than on outreach — shortlists, checks and paperwork included."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sourcing Desk" }]}
        actions={
          <>
            <Button href="/buyer-guide" variant="white">
              Buyer guide
            </Button>
            <Button href="#request" variant="navy">
              Request sourcing
            </Button>
          </>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <SectionTitle eyebrow="What the desk handles" title="Six services, one contact" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sourcingDeskServices.map((service) => (
            <div key={service.title} className="panel p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/10 text-secondary">
                <CheckIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-primary">
                {service.title}
              </h3>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">
                {service.text}
              </p>
              {service.note ? (
                <Badge tone="slate" className="mt-3">
                  {service.note}
                </Badge>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-10">
          <SectionTitle eyebrow="How it runs" title="From brief to shipment" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, index) => (
              <div key={step.title} className="panel p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white font-display text-sm font-bold">
                    {index + 1}
                  </span>
                  {index < process.length - 1 ? (
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

        <div id="request" className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="panel p-6 sm:p-8">
            <p className="label-xs">Send a brief</p>
            <p className="mt-2 font-display text-xl font-bold text-primary">
              Tell the desk what you need
            </p>
            <div className="mt-5">
              <InquiryForm subject="Sourcing Desk brief" compact />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="panel p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="label-xs">Engagement models</p>
                <Badge tone="navy">{deskFee ? serviceFeePrice(deskFee) : "—"}</Badge>
              </div>
              <dl className="mt-3 space-y-3 text-[13px]">
                <div>
                  <dt className="font-semibold text-ink">Pay per brief</dt>
                  <dd className="mt-0.5 text-slate-600">
                    Deal-value fee per matched order, with a minimum fee — billed
                    outside your membership.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Retained desk</dt>
                  <dd className="mt-0.5 text-slate-600">
                    Continuous programmes and market-entry work run on a monthly
                    retainer
                    {marketEntryFee ? ` (${serviceFeePrice(marketEntryFee)})` : ""}.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Marketplace stays free</dt>
                  <dd className="mt-0.5 text-slate-600">
                    Requirements, inquiries and matched leads remain unlimited on
                    every membership tier — the desk is only for managed sourcing.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="panel bg-surface p-5">
              <p className="text-[13px] font-bold text-primary">Response time</p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Briefs are acknowledged the same working day. First shortlists
                typically arrive within five working days.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
