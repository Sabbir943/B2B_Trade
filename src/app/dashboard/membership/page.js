import { getFoundingSpots, getPricingSettings } from "@/lib/membership";
import Link from "next/link";
import { getMembershipSummary } from "@/lib/billing";
import { formatBdt, formatUsd, tierHighlights, tierListingsLabel } from "@/lib/pricing";
import { Badge, Button } from "@/components/ui";
import { CreditCardIcon } from "@/components/icons";
import { DataTable, Pill, Section, WorkspaceHeader } from "@/components/workspace";
import PlanPicker from "@/components/plan-picker";
import { requirePermission } from "@/lib/session";
import { formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Membership" };

const STATUS_TONE = { paid: "green", pending: "amber", awaiting_bank: "amber", failed: "red", quoted: "slate" };

/**
 * §7.7 membership — live tier limits, invoice history, renewal reminders
 * and the plan chooser that opens the §7.7.2 checkout.
 */
export default async function MembershipPage() {
  const { user, tier } = await requirePermission("member.membership");

  const [settings, spots, summary] = await Promise.all([
    getPricingSettings(),
    getFoundingSpots(),
    getMembershipSummary(user.email),
  ]);

  const currentKey = summary.tier || tier || "free";
  const current = settings.tiers.find((item) => item.key === currentKey) ?? settings.tiers[0];
  const foundingLive = settings.founding.enabled && !spots.soldOut;

  const limits = [
    ["Yearly price", `${formatUsd(current.priceUsd)} / ${formatBdt(current.priceBdt)}`],
    ["Product listings", tierListingsLabel(current)],
    ["Contacts / day", String(current.limits.directContactsPerDay)],
    ["Search ranking", current.limits.searchRanking],
  ];

  const invoiceRows = summary.invoices.map((invoice) => ({
    id: invoice.id,
    label: invoice.label,
    issued: formatDate(invoice.createdAt),
    amount:
      invoice.currency === "BDT"
        ? `BDT ${Number(invoice.amountBdt || 0).toLocaleString()}`
        : `$${Number(invoice.amountUsd || 0).toLocaleString()}`,
    status: invoice.status === "awaiting_bank" ? "Bank transfer" : invoice.status,
    payLink: ["pending", "awaiting_bank"].includes(invoice.status)
      ? `/dashboard/membership/checkout?invoice=${invoice.id}`
      : null,
  }));

  return (
    <>
      <WorkspaceHeader
        title="Membership"
        description={`${current.name} plan · ${settings.billing.label}. Limits are enforced from the same live settings the public pricing page shows.`}
        actions={
          <Button href="/membership" variant="outline" size="sm">
            Compare all plans
          </Button>
        }
      />

      {summary.renewing ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          Your {current.name} plan renews {formatDate(summary.expiresAt)} — {summary.daysLeft}{" "}
          day{summary.daysLeft === 1 ? "" : "s"} left. Reminders go out at 30, 7 and 1 days.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-primary p-6 text-white lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                Current plan
              </p>
              <p className="mt-2 font-display text-2xl font-bold">{current.name}</p>
              <p className="text-sm text-white/70">
                {summary.expiresAt
                  ? `Active until ${formatDate(summary.expiresAt)}`
                  : settings.billing.label}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.reminders?.length ? (
                <Badge tone="amber">Renewal reminder</Badge>
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
              Manage account
            </Button>
            <Button href="#plans" variant="outlineWhite" size="sm">
              Change plan
            </Button>
          </div>
        </div>

        <div className="panel p-5">
          <p className="label-xs">Billing</p>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface p-3 text-[12px] leading-5 text-slate-600">
            <CreditCardIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
            Gateway cards are handled by our PSP — this app never stores card data.
            Bank transfers activate once staff confirm the funds.
          </div>
          <dl className="mt-4 space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[13px] text-slate-500">Renewal date</dt>
              <dd className="text-[13px] font-semibold text-ink">{summary.expiresLabel}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[13px] text-slate-500">Invoices</dt>
              <dd className="text-[13px] font-semibold text-ink">{summary.invoices.length}</dd>
            </div>
          </dl>
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
              <span className="text-success">✓</span>
              {highlight}
            </li>
          ))}
        </ul>
      </Section>

      <Section className="mt-6" title="Invoices">
        <DataTable
          columns={[
            { key: "id", label: "Invoice", emphasis: true },
            { key: "label", label: "Description" },
            { key: "issued", label: "Issued" },
            { key: "amount", label: "Amount" },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <span className="flex items-center gap-2">
                  <Pill>{row.status}</Pill>
                  {row.payLink ? (
                    <Link href={row.payLink} className="text-[11px] font-bold text-primary hover:underline">
                      Pay →
                    </Link>
                  ) : null}
                </span>
              ),
            },
          ]}
          rows={invoiceRows}
          empty="No invoices yet."
        />
        {summary.invoices.length ? null : (
          <p className="mt-3 flex items-center gap-2 text-[12px] text-slate-400">
            <Badge tone={STATUS_TONE.pending}>i</Badge>
            Invoices appear here the moment you start an upgrade or a paid verification.
          </p>
        )}
      </Section>

      <div id="plans" className="mt-8">
        <Section title="Change plan">
          <PlanPicker
            tiers={settings.tiers}
            currentKey={currentKey}
            founding={Boolean(settings.founding.enabled)}
            foundingLive={foundingLive}
            spotsLeft={spots.left ?? 0}
          />
        </Section>
      </div>
    </>
  );
}
