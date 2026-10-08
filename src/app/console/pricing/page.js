import { console_ } from "@/lib/catalog";
import { Badge, Button } from "@/components/ui";
import { DataTable, Section, SampleNote, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getPricingSettings, getFoundingSpots } from "@/lib/membership";
import { formatBdt, formatUsd, serviceFeePrice } from "@/lib/pricing";
import PricingSettingsForm from "@/components/pricing-settings-form";

export const metadata = { title: "Pricing & offers" };

export default async function ConsolePricingPage() {
  await requirePermission("console.pricing");

  const [settings, spots] = await Promise.all([getPricingSettings(), getFoundingSpots()]);

  const stats = [
    { label: "Tiers published", value: String(settings.tiers.length), hint: settings.billing.label },
    {
      label: "Founding spots left",
      value: settings.founding.enabled ? String(spots.left) : "Off",
      hint: `${spots.taken} of ${spots.total} claimed`,
    },
    { label: "Paid members", value: String(spots.taken), hint: "Real sign-ups" },
    {
      label: "Money-back",
      value: `${settings.guarantees.moneyBackDays} days`,
      hint: settings.guarantees.moneyBackAudience,
    },
  ];

  const tierRows = settings.tiers.map((tier) => ({
    id: tier.key,
    plan: tier.name,
    list: `${formatUsd(tier.priceUsd)} / ${formatBdt(tier.priceBdt)}`,
    founding: settings.founding.enabled
      ? `${formatUsd(tier.foundingUsd)} / ${formatBdt(tier.foundingBdt)}`
      : "—",
    listings: tier.limits.productListingsUnlimited
      ? "Unlimited"
      : String(tier.limits.productListings),
    contacts: String(tier.limits.directContactsPerDay),
    ranking: tier.limits.searchRanking,
  }));

  const feeRows = settings.serviceFees.map((fee) => ({
    id: fee.key,
    service: fee.name,
    price: serviceFeePrice(fee),
    model: fee.kind.replace(/_/g, " "),
  }));

  return (
    <>
      <WorkspaceHeader
        title="Membership pricing & service fees"
        description="Every tier price, limit, guarantee and service fee shown on the public pages comes from this settings document. Edits are permission-checked (console.pricing), audited with a before/after diff and published immediately."
        actions={
          <>
            <Button href="/membership" variant="outline" size="sm">
              Preview public page
            </Button>
            <Button href="/console/audit-log" variant="outline" size="sm">
              Audit log
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <div className="mt-6">
        <PricingSettingsForm initial={settings} spots={spots} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Published tiers">
          <DataTable
            columns={[
              { key: "plan", label: "Plan", emphasis: true },
              { key: "list", label: "List / year" },
              { key: "founding", label: "Founding / year" },
              { key: "listings", label: "Listings" },
              { key: "contacts", label: "Contacts / day" },
              { key: "ranking", label: "Ranking" },
            ]}
            rows={tierRows}
          />
        </Section>

        <Section title="Service fees (outside membership)">
          <DataTable
            columns={[
              { key: "service", label: "Service", emphasis: true },
              { key: "price", label: "Price" },
              { key: "model", label: "Model" },
            ]}
            rows={feeRows}
          />
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Offers & codes">
          <DataTable
            columns={[
              { key: "code", label: "Code", emphasis: true },
              { key: "type", label: "Type" },
              { key: "uses", label: "Uses" },
              { key: "expires", label: "Expires" },
              { key: "status", label: "Status", pill: true },
            ]}
            rows={console_.offers}
          />
          <SampleNote text="Promotional codes are sample rows — the founding offer above is the live discount mechanism." />
        </Section>

        <div className="panel p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-base font-bold text-primary">Guarantees in force</p>
            <Badge tone={settings.guarantees.leadGuaranteeEnabled ? "green" : "slate"}>
              Lead guarantee {settings.guarantees.leadGuaranteeEnabled ? "on" : "off"}
            </Badge>
          </div>
          <dl className="mt-4 space-y-3 text-[13px] leading-6">
            <div className="rounded-xl bg-surface p-3">
              <dt className="label-xs">Money-back</dt>
              <dd className="mt-1 text-slate-700">
                {settings.guarantees.moneyBackDays}-day money-back for{" "}
                {settings.guarantees.moneyBackAudience}.
              </dd>
            </div>
            <div className="rounded-xl bg-surface p-3">
              <dt className="label-xs">Lead guarantee</dt>
              <dd className="mt-1 text-slate-700">
                {settings.guarantees.leadGuaranteeEnabled
                  ? `${settings.guarantees.leadGuaranteeMinInquiries} verified inquiries — ${settings.guarantees.leadGuaranteeNote}`
                  : "Configured but switched off until the six-month review."}
              </dd>
            </div>
            <div className="rounded-xl bg-surface p-3">
              <dt className="label-xs">Trials</dt>
              <dd className="mt-1 text-slate-700">
                {settings.trials.silverTrialMonths}-month free Silver trial for selected{" "}
                {settings.trials.eligibleCountry} suppliers — granted from Admin → Members.
              </dd>
            </div>
            <div className="rounded-xl bg-surface p-3">
              <dt className="label-xs">Buying mode</dt>
              <dd className="mt-1 text-slate-700">{settings.buyingMode.note}</dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
