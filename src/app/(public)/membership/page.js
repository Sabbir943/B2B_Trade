import { getFoundingSpots, getPricingSettings } from "@/lib/membership";
import {
  FEATURE_ROWS,
  formatBdt,
  formatUsd,
  serviceFeePrice,
  tierHighlights,
  tierPriceLines,
} from "@/lib/pricing";
import { shell } from "@/components/shell";
import { Badge, Button, PageHeader, SectionTitle } from "@/components/ui";
import { CheckIcon, ShieldIcon } from "@/components/icons";

export const metadata = { title: "Membership plans" };

function FeatureValue({ value }) {
  if (value === "Yes") return <CheckIcon className="h-4 w-4 text-success" />;
  if (value === "No" || value === "—") return <span className="text-slate-400">—</span>;
  return <span>{value}</span>;
}

export default async function MembershipPage() {
  const [settings, spots] = await Promise.all([getPricingSettings(), getFoundingSpots()]);

  const foundingLive = settings.founding.enabled && !spots.soldOut;
  const { moneyBackDays, moneyBackAudience, leadGuaranteeEnabled } = settings.guarantees;

  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Plans that scale with your trade"
        description={`Four tiers, billed yearly in USD or BDT. ${settings.buyingMode.note}`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Membership" }]}
        actions={
          <Button href="/sign-up" variant="accent">
            Join Free
          </Button>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        {settings.founding.enabled ? (
          <div className="rounded-2xl bg-primary p-6 text-white sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                  Founding offer
                </p>
                <p className="mt-2 font-display text-xl font-bold sm:text-2xl">
                  {settings.founding.headline}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-white/70">
                  {spots.soldOut
                    ? "The founding allocation is fully claimed — standard list pricing now applies."
                    : `First ${settings.founding.totalSpots} paid members only. ${settings.founding.discountPercent}% off the first year, then the standard list price at renewal.`}
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="font-display text-4xl font-bold text-white">
                  {spots.soldOut ? "0" : spots.left}
                </p>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/60">
                  {settings.founding.counterLabel}
                </p>
              </div>
            </div>
            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${spots.percentUsed}%` }}
              />
            </div>
            <p className="mt-2 text-[12px] text-white/60">
              {spots.taken} of {spots.total} claimed — updated live as members join.
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {settings.tiers.map((tier) => {
            const paid = tier.priceUsd > 0 || tier.priceBdt > 0;
            const showFounding = paid && foundingLive && (tier.foundingUsd || tier.foundingBdt);
            const list = tierPriceLines(tier);
            const founding = tierPriceLines(tier, { founding: true });

            return (
              <div
                key={tier.key}
                className={`panel relative flex flex-col p-5 ${
                  tier.featured ? "ring-2 ring-primary" : ""
                }`}
              >
                {tier.featured ? (
                  <Badge tone="navy" className="absolute -top-3 left-5">
                    Most popular
                  </Badge>
                ) : null}
                {showFounding ? (
                  <Badge tone="amber" className="absolute -top-3 right-5">
                    −{settings.founding.discountPercent}% first year
                  </Badge>
                ) : null}

                <p className="label-xs">{tier.name}</p>
                <p className="mt-2 font-display text-3xl font-bold text-primary">
                  {showFounding ? founding.usd : list.usd}
                  {list.cadence ? (
                    <span className="ml-1 text-[13px] font-medium text-slate-500">
                      {list.cadence}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-[13px] text-slate-600">
                  {showFounding
                    ? `${founding.bdt} first year · list ${list.bdt}`
                    : list.bdt}
                </p>
                {showFounding ? (
                  <p className="text-[12px] text-slate-400 line-through">
                    {list.usd} / {settings.billing.periodLabel}
                  </p>
                ) : null}

                <p className="mt-3 text-[13px] leading-6 text-slate-600">{tier.blurb}</p>

                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[13px] text-slate-600">
                  {tierHighlights(tier)
                    .slice(0, 5)
                    .map((highlight) => (
                      <li key={highlight} className="flex gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {highlight}
                      </li>
                    ))}
                </ul>

                <div className="mt-5 pt-1">
                  <Button href="/sign-up" variant={tier.featured ? "navy" : "outline"} className="w-full">
                    {paid ? `Choose ${tier.name}` : "Join Free"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <SectionTitle eyebrow="Side by side" title="Compare plan limits" />
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-surface text-left">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Feature
                  </th>
                  {settings.tiers.map((tier) => (
                    <th
                      key={tier.key}
                      className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
                    >
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {FEATURE_ROWS.map((row) => (
                  <tr key={row.key}>
                    <td className="px-4 py-3 font-medium text-ink">{row.label}</td>
                    {settings.tiers.map((tier) => (
                      <td
                        key={`${row.key}-${tier.key}`}
                        className="px-4 py-3 text-slate-600"
                      >
                        <FeatureValue value={row.value(tier)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-2xl bg-primary p-6 text-white sm:grid-cols-3 sm:p-8">
          <div>
            <ShieldIcon className="h-5 w-5 text-white/70" />
            <p className="mt-2 font-display text-base font-bold">
              {moneyBackDays}-day money-back
            </p>
            <p className="mt-1 text-[13px] leading-6 text-white/70">
              First-time paid members get a full refund within {moneyBackDays} days of
              first payment.
            </p>
          </div>
          <div>
            <CheckIcon className="h-5 w-5 text-white/70" />
            <p className="mt-2 font-display text-base font-bold">Buying stays free</p>
            <p className="mt-1 text-[13px] leading-6 text-white/70">
              {settings.buyingMode.note}
            </p>
          </div>
          <div>
            <Badge tone="amber">{settings.billing.label}</Badge>
            <p className="mt-2 font-display text-base font-bold">
              {leadGuaranteeEnabled
                ? "Lead guarantee included"
                : "Simple annual billing"}
            </p>
            <p className="mt-1 text-[13px] leading-6 text-white/70">
              {leadGuaranteeEnabled
                ? `${settings.guarantees.leadGuaranteeMinInquiries} verified inquiries or your membership is extended free.`
                : `A lead guarantee is planned for later this year — ${moneyBackAudience} are covered today.`}
            </p>
          </div>
        </div>

        <div className="mt-10">
          <SectionTitle
            eyebrow="Service fees"
            title="Priced outside the membership"
            action={
              <Button href="/contact" variant="outline" size="sm">
                Ask about a service
              </Button>
            }
          />
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-surface text-left">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Service
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Fee
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settings.serviceFees.map((fee) => (
                  <tr key={fee.key}>
                    <td className="px-4 py-3 font-medium text-ink">{fee.name}</td>
                    <td className="px-4 py-3 text-slate-600">{serviceFeePrice(fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] leading-6 text-slate-500">
            Membership covers visibility and lead access; verification, audits and desk
            engagements are billed separately. {settings.trials.note}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <p className="font-display text-base font-bold text-primary">
              Start free — upgrade when the marketplace pays back
            </p>
            <p className="mt-1 text-[13px] leading-6 text-slate-600">
              {settings.trials.silverTrialMonths > 0
                ? `${settings.trials.silverTrialMonths}-month free Silver trials are available for selected ${settings.trials.eligibleCountry} suppliers. `
                : ""}
              {formatUsd(settings.tiers[1].priceUsd)} / {formatBdt(settings.tiers[1].priceBdt)}{" "}
              after that, cancel any time.
            </p>
          </div>
          <Button href="/sign-up" variant="navy">
            Create free account
          </Button>
        </div>
      </section>
    </>
  );
}
