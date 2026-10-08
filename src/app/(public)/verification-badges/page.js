import { verificationLevels } from "@/lib/content";
import { getPricingSettings } from "@/lib/membership";
import { feePriceByKey } from "@/lib/pricing";
import { shell } from "@/components/shell";
import { Badge, Button, PageHeader, SectionTitle } from "@/components/ui";
import { CheckIcon, StarIcon } from "@/components/icons";

export const metadata = { title: "Verification badges" };

const appearances = [
  {
    where: "Search results",
    text: "Badges sit under each supplier name so shortlists start with checked companies.",
  },
  {
    where: "Supplier profile",
    text: "A verification panel lists every check with its date, scope and expiry.",
  },
  {
    where: "Listings & quotes",
    text: "Your badge travels with each product card and every reply to a requirement.",
  },
  {
    where: "Inquiry threads",
    text: "Both sides see current badge status inside the conversation, not just on the profile.",
  },
];

export default async function VerificationBadgesPage() {
  const settings = await getPricingSettings();

  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Verification badges explained"
        description="What each badge means, what it does not mean, and where buyers will see it across the marketplace."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Verification badges" },
        ]}
        actions={
          <Button href="/verification" variant="navy">
            Get verified
          </Button>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="grid gap-4 lg:grid-cols-3">
          {verificationLevels.map((level, index) => (
            <div key={level.level} className="panel p-6">
              <Badge tone="green">
                <CheckIcon className="h-3 w-3" /> {level.level}
              </Badge>
              <p className="mt-3 font-display text-lg font-bold text-primary">
                {level.level}
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                {level.checks.join(". ")}.
              </p>
              <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Turnaround</dt>
                  <dd className="font-semibold text-ink">{level.time}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Fee</dt>
                  <dd className="font-semibold text-ink">
                    {feePriceByKey(settings, level.feeKey)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Stacks with</dt>
                  <dd className="font-semibold text-ink">
                    {index === 0 ? "—" : verificationLevels[index - 1].level}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="panel p-6">
            <p className="label-xs">How it looks</p>
            <div className="mt-4 space-y-3 rounded-xl bg-surface p-4">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 font-display text-[13px] font-bold text-primary">
                    MS
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-display text-sm font-bold text-primary">
                      Meridian Spice Exports
                      <span aria-hidden="true">🇧🇩</span>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone="green">
                        <CheckIcon className="h-3 w-3" /> Verified
                      </Badge>
                      <Badge tone="navy">Export Licence</Badge>
                      <Badge tone="navy">ISO 22000</Badge>
                    </div>
                  </div>
                  <span className="ml-auto flex items-center gap-1 rounded-md bg-accent/20 px-2 py-1 text-[12px] font-bold text-accent-ink">
                    <StarIcon className="h-3.5 w-3.5" />
                    4.8
                  </span>
                </div>
                <p className="mt-3 border-t border-slate-100 pt-3 text-[12px] text-slate-500">
                  Company checked 22 Sep 2026 · Documents audited 04 Oct 2026 ·
                  Factory audit scheduled
                </p>
              </div>
              <p className="text-[13px] leading-6 text-slate-600">
                One badge stays visible everywhere; the dates underneath tell a
                buyer exactly how fresh each check is.
              </p>
            </div>
          </div>

          <div>
            <SectionTitle eyebrow="Everywhere that matters" title="Where badges appear" />
            <ul className="mt-5 space-y-3">
              {appearances.map((item) => (
                <li key={item.where} className="panel p-4">
                  <p className="font-display text-sm font-bold text-primary">
                    {item.where}
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-slate-600">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel mt-8 p-6">
          <p className="font-display text-lg font-bold text-primary">
            What a badge does not mean
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            A badge records checks we completed on a stated date. It is not a
            guarantee of delivery, pricing or solvency — keep sampling,
            contracting and staging payments exactly as you would with any new
            trading partner.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button href="/verification" variant="navy" size="sm">
              Start verification
            </Button>
            <Button href="/legal/trust-safety" variant="outline" size="sm">
              Trust &amp; Safety policy
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
