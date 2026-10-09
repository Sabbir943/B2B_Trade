import { getFoundingSpots, getMemberMembership, getPricingSettings } from "@/lib/membership";
import {
  formatBdt,
  formatUsd,
  tierHighlights,
  tierListingsLabel,
} from "@/lib/pricing";
import { Badge, Button } from "@/components/ui";
import { CheckIcon, CreditCardIcon } from "@/components/icons";
import { DataTable, Pill, Section, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Membership" };

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function MembershipPage() {
  const { user, tier } = await requirePermission("member.membership");

  const [settings, spots, membership] = await Promise.all([
    getPricingSettings(),
    getFoundingSpots(),
    getMemberMembership(user.email),
  ]);

  const currentKey = membership?.tier || tier || "free";
  const current = settings.tiers.find((item) => item.key === currentKey) ?? settings.tiers[0];
  const trialActive = Boolean(membership?.trialActive);
  const foundingLive = settings.founding.enabled && !spots.soldOut;

  const limits = [
    ["Yearly price", `${formatUsd(current.priceUsd)} / ${formatBdt(current.priceBdt)}`],
    ["Product listings", tierListingsLabel(current)],
    ["Contacts / day", String(current.limits.directContactsPerDay)],
    ["Search ranking", current.limits.searchRanking],
  ];

  return (
    <>
      <WorkspaceHeader
        title="Membership"
        description={`${current.name} plan, ${settings.billing.label}. Your plan's limits are enforced from the same settings the public pricing page shows.`}
        actions={
          <Button href="/membership" variant="outline" size="sm">
            Compare all plans
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-primary p-6 text-white lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                Current plan
              </p>
              <p className="mt-2 font-display text-2xl font-bold">{current.name}</p>
              <p className="text-sm text-white/70">{settings.billing.label}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {trialActive ? (
                <Badge tone="amber">
                  Silver trial to {dateFmt.format(new Date(membership.trialUntil))}
                </Badge>
              ) : null}
              <Badge tone="green">Active</Badge>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            {limits.slice(0, 3).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/10 p-3">
                <dt className="text-[11px] uppercase tracking-[0.14em] text-white/60">
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/dashboard/settings" variant="navy" size="sm">
              Manage billing
            </Button>
            <Button href="/membership" variant="outlineWhite" size="sm">
              Change plan
            </Button>
          </div>
        </div>

        <div className="panel p-5">
          <p className="label-xs">Payment method</p>
          <p className="mt-3 text-sm font-semibold text-ink">No payment method on file</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Add a card when you upgrade to a paid plan.
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface p-3 text-[12px] leading-5 text-slate-600">
            <CreditCardIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
            Invoices are emailed 7 days before renewal.
          </div>
        </div>
      </div>

      <Section className="mt-6" title="Plan limits">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {limits.map(([label, value]) => (
            <div key={label} className="panel p-4">
              <p className="label-xs">{label}</p>
              <p className="mt-2 font-display text-xl font-bold text-primary">{value}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 grid gap-2 text-[13px] text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
          {tierHighlights(current).map((highlight) => (
            <li key={highlight} className="flex gap-2">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {highlight}
            </li>
          ))}
        </ul>
      </Section>

      <Section className="mt-6" title="Invoices">
        <DataTable
          columns={[
            { key: "id", label: "Invoice", emphasis: true },
            { key: "plan", label: "Description" },
            { key: "issued", label: "Issued" },
            { key: "amount", label: "Amount" },
            { key: "status", label: "Status", pill: true },
          ]}
          rows={[]}
          empty="No invoices yet."
        />
      </Section>

      <Section
        className="mt-6"
        title="Upgrade options"
        action={
          foundingLive ? (
            <Badge tone="amber">
              {spots.left} {settings.founding.counterLabel}
            </Badge>
          ) : null
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {settings.tiers.map((plan) => {
            const isCurrent = plan.key === current.key;
            const showFounding =
              foundingLive && !isCurrent && (plan.foundingUsd || plan.foundingBdt);

            return (
              <div
                key={plan.key}
                className={`panel flex flex-col p-5 ${
                  isCurrent ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="label-xs">{plan.name}</p>
                  {isCurrent ? <Pill>Current</Pill> : null}
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-primary">
                  {showFounding ? formatUsd(plan.foundingUsd) : formatUsd(plan.priceUsd)}
                </p>
                <p className="mt-1 text-[13px] text-slate-600">
                  {showFounding
                    ? `${formatBdt(plan.foundingBdt)} first year`
                    : `${formatBdt(plan.priceBdt)} / ${settings.billing.periodLabel}`}
                </p>
                <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[13px] text-slate-600">
                  {tierHighlights(plan)
                    .slice(0, 3)
                    .map((highlight) => (
                      <li key={highlight} className="flex gap-2">
                        <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        {highlight}
                      </li>
                    ))}
                </ul>
                <div className="mt-auto pt-4">
                  <Button
                    href={isCurrent ? "/dashboard/settings" : "/membership"}
                    variant={isCurrent ? "outline" : "navy"}
                    size="sm"
                    className="w-full"
                  >
                    {isCurrent ? "Current plan" : `Choose ${plan.name}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
