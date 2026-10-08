import { verificationLevels } from "@/lib/content";
import { getPricingSettings } from "@/lib/membership";
import { feePriceByKey } from "@/lib/pricing";
import { shell } from "@/components/shell";
import { Badge, Button, PageHeader, SectionTitle } from "@/components/ui";
import { ArrowRightIcon, CheckIcon, ClockIcon, ShieldIcon } from "@/components/icons";

export const metadata = { title: "Get verified" };

const process = [
  { title: "Apply", text: "Pick a level and submit your company details." },
  { title: "Submit", text: "Upload licences, certificates and audit access." },
  { title: "Review", text: "Our officers check every document against originals." },
  { title: "Badge live", text: "The badge appears beside your name marketplace-wide." },
];

export default async function VerificationPage() {
  const settings = await getPricingSettings();
  return (
    <>
      <PageHeader
        eyebrow="Trust & safety"
        title="Get verified"
        description="Three levels of checks — company, documents and factory — reviewed by our officers so buyers see evidence, not claims."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Get verified" }]}
        actions={
          <>
            <Button href="/verification-badges" variant="outline">
              Badge reference
            </Button>
            <Button href="/sign-up" variant="navy">
              Start verification
            </Button>
          </>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="grid gap-4 lg:grid-cols-3">
          {verificationLevels.map((level, index) => {
            const price = feePriceByKey(settings, level.feeKey);
            return (
              <div key={level.level} className="panel relative flex flex-col p-6">
                <span className="absolute right-5 top-5 font-display text-[13px] font-bold text-slate-300">
                  0{index + 1}
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                  <ShieldIcon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-display text-lg font-bold text-primary">
                  {level.level}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone="slate">
                    <ClockIcon className="h-3 w-3" /> {level.time}
                  </Badge>
                  {price.length <= 22 ? (
                    <Badge tone="navy">{price}</Badge>
                  ) : (
                    <span className="text-[13px] font-semibold text-primary">{price}</span>
                  )}
                </div>

                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[13px] text-slate-600">
                  {level.checks.map((check) => (
                    <li key={check} className="flex gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {check}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 rounded-lg bg-surface p-3 text-[13px] leading-6 text-ink">
                  <span className="font-semibold">Outcome:</span> {level.outcome}
                </p>

                <div className="mt-auto pt-5">
                  <Button href="/sign-up" variant="navy" className="w-full">
                    Choose {level.level}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <SectionTitle eyebrow="The process" title="How verification runs" />
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

        <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-surface p-6 sm:grid-cols-2 sm:items-center">
          <div>
            <p className="label-xs">Documents to have ready</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Business registration and trade licence
              </li>
              <li className="flex gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Product certificates and test reports
              </li>
              <li className="flex gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Bank verification letter on letterhead
              </li>
              <li className="flex gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Factory address and contact for audit scheduling
              </li>
            </ul>
          </div>
          <div className="rounded-xl bg-white p-5">
            <p className="font-display text-base font-bold text-primary">
              Renewals are tracked for you
            </p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Certificates expire. We remind you 30 days ahead and keep the badge
              visible with its last-reviewed date so buyers always know what they
              are looking at.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/verification-badges" variant="soft" size="sm">
                See badges
              </Button>
              <Button href="/contact" variant="outline" size="sm">
                Talk to an officer
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
