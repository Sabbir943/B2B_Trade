import Link from "next/link";
import { Badge, Button, EmptyState } from "@/components/ui";
import { TagIcon } from "@/components/icons";
import { Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getVisibleMatches } from "@/lib/requirements";
import { categoriesById } from "@/lib/catalog";

export const instant = false;

export const metadata = { title: "Matched leads" };

const REASON_LABEL = { category: "Category fit", hs: "HS code", country: "Preferred country" };

/**
 * §7.3.3 supplier side — matched buy requirements. The matcher already
 * applies the tier notification window (Platinum −12h, Gold instant,
 * Silver +48h, Free at publish).
 */
export default async function LeadsPage() {
  const { user, tier } = await requirePermission("member.leads");
  const matches = await getVisibleMatches(user.email);
  const rows = matches.map((match) => ({
    id: match.requirement.id,
    score: match.score,
    reasons: match.reasons,
    product: match.requirement.product,
    category: match.requirement.category,
    quantity: `${match.requirement.quantity} ${match.requirement.unit}`,
    destination: match.requirement.destinationPort || match.requirement.shippingTerms,
    status: match.requirement.status,
  }));

  const stats = [
    { label: "Active matches", value: String(rows.length), hint: `Your plan: ${tier}` },
    { label: "Avg. score", value: rows.length ? String(Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length)) : "—", hint: "Out of 100" },
    { label: "Live on board", value: String(rows.filter((row) => row.status === "published").length), hint: "Open for quotes" },
    { label: "Resolved", value: String(rows.filter((row) => ["awarded", "closed"].includes(row.status)).length), hint: "Awarded or closed" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Matched leads"
        description="Buy requirements scored against your published categories, HS codes and preferred origins."
        actions={
          <Button href="/requirements" variant="outline" size="sm">
            Browse the board
          </Button>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Requirements matched to you">
        {rows.length ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-surface text-left">
                  {["Ref", "Requirement", "Quantity", "Destination", "Score", "Why", ""].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-surface/70">
                    <td className="px-4 py-3 font-semibold text-ink">{row.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{row.product}</p>
                      <p className="text-[12px] text-slate-500">
                        {categoriesById[row.category]?.name || row.category}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">{row.destination || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={row.score >= 60 ? "green" : row.score >= 35 ? "amber" : "slate"}>
                        {row.score}/100
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">
                      {row.reasons.map((reason) => REASON_LABEL[reason] || reason).join(" · ")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/requirements/${row.id}`}
                        className="whitespace-nowrap text-[13px] font-semibold text-primary hover:underline"
                      >
                        Quote →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<TagIcon className="h-5 w-5" />}
            title="No matched leads yet"
            text="Keep your categories and HS codes current on your listings — matching runs the moment a buyer's requirement clears moderation."
            action={
              <Button href="/dashboard/products" variant="navy" size="sm">
                Update my listings
              </Button>
            }
          />
        )}
      </Section>

      <Section className="mt-8" title="How scoring works">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Category fit", "40%", "Your published category equals the requirement's"],
            ["HS heading", "35%", "Listing HS code shares the requirement's heading"],
            ["Preferred origin", "25%", "Your country is on the buyer's preferred list"],
          ].map(([label, weight, text]) => (
            <div key={label} className="panel p-5">
              <div className="flex items-baseline justify-between">
                <p className="font-display text-base font-bold text-primary">{label}</p>
                <p className="font-display text-lg font-bold text-secondary">{weight}</p>
              </div>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
