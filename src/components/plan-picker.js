"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "./ui";
import { CheckIcon } from "./icons";
import { Pill } from "./workspace";
import { startPlanCheckout } from "@/lib/member-actions";
import { formatUsd, formatBdt, tierHighlights } from "@/lib/pricing";

/**
 * §7.7.1 plan chooser — opens a membership invoice and hands over to the
 * checkout screen where the member picks gateway or bank transfer.
 */
export default function PlanPicker({ tiers = [], currentKey = "free", founding = false, foundingLive = false, spotsLeft = 0 }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  async function choose(tierKey) {
    setBusy(tierKey);
    setError(null);
    const result = await startPlanCheckout({ tierKey, cadence: "yearly" });
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/dashboard/membership/checkout?invoice=${result.invoiceId}`);
  }

  return (
    <div>
      {foundingLive ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Founding offer is live — paid plans bill at the founding price while{" "}
          <strong>{spotsLeft}</strong> spots remain.
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((plan) => {
          const isCurrent = plan.key === currentKey;
          const showFounding = founding && foundingLive && !isCurrent && (plan.foundingUsd || plan.foundingBdt);
          return (
            <div key={plan.key} className={`panel flex flex-col p-5 ${isCurrent ? "ring-2 ring-primary" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="label-xs">{plan.name}</p>
                {isCurrent ? <Pill>Current</Pill> : null}
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-primary">
                {showFounding ? formatUsd(plan.foundingUsd) : formatUsd(plan.priceUsd)}
              </p>
              <p className="mt-1 text-[13px] text-slate-600">
                {showFounding ? `${formatBdt(plan.foundingBdt)} first year` : `${formatBdt(plan.priceBdt)} / year`}
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
                {isCurrent ? (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    <Badge tone="green">Current plan</Badge>
                  </Button>
                ) : plan.key === "free" ? (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Free forever
                  </Button>
                ) : (
                  <Button
                    variant="navy"
                    size="sm"
                    className="w-full"
                    disabled={busy === plan.key}
                    onClick={() => choose(plan.key)}
                  >
                    {busy === plan.key ? "Opening invoice…" : `Choose ${plan.name}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
