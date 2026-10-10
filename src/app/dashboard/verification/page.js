import { Badge, EmptyState, ProgressBar } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";
import { Section, WorkspaceHeader } from "@/components/workspace";
import VerificationApply from "@/components/verification-apply";
import { requirePermission } from "@/lib/session";
import { getProfile } from "@/lib/profile";
import { getPricingSettings } from "@/lib/membership";
import {
  VERIFICATION_LEVELS,
  feeForLevel,
  getCasesFor,
  getBadges,
  getActiveBadge,
  methodLabel,
  statusLabel,
} from "@/lib/verification";
import { plain, formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Verification" };

function daysUntil(value) {
  return (new Date(value).getTime() - Date.now()) / 86400000;
}

const STEP_BY_STATUS = {
  submitted: 1,
  in_review: 2,
  visit_scheduled: 3,
  approved: 5,
  rejected: 2,
  awaiting_payment: 0,
};

/**
 * §7.5 member side — apply for a badge level, follow the case through the
 * Verification Queue, and renew before the annual expiry.
 */
export default async function VerificationPage() {
  const { user } = await requirePermission("member.verification");
  const profile = await getProfile(user.email);
  const [cases, badges, activeBadge, settings] = await Promise.all([
    getCasesFor(user.email),
    getBadges(user.email),
    getActiveBadge(user.email),
    getPricingSettings(),
  ]);

  const latest = cases[0] || null;
  const open = latest && ["awaiting_payment", "submitted", "in_review", "visit_scheduled"].includes(latest.status);
  const done = latest ? STEP_BY_STATUS[latest.status] ?? 0 : 0;
  const progress = Math.round((done / 5) * 100);
  const renewSoon = activeBadge ? daysUntil(activeBadge.expiresAt) < 60 : false;

  const steps = [
    { label: "Application submitted", date: latest ? formatDate(latest.createdAt) : "Not started" },
    { label: "Documents reviewed", date: done >= 2 ? formatDate(latest.updatedAt) : "Pending" },
    {
      label: latest?.method?.includes("visit") || latest?.method?.includes("audit") ? "Site visit / audit" : "Desk review",
      date: done >= 3 ? methodLabel(latest.method) : "Pending",
    },
    { label: "Decision in review", date: done >= 4 ? formatDate(latest.updatedAt) : "Pending" },
    { label: "Badge issued", date: activeBadge ? formatDate(activeBadge.awardedAt) : "Pending" },
  ];

  const fees = Object.fromEntries(
    VERIFICATION_LEVELS.map((level) => {
      const fee = feeForLevel(settings, level.key);
      const amount = fee.quoted
        ? fee.label || "Quoted"
        : fee.usd
          ? `$${fee.usd}`
          : fee.bdt
            ? `৳${fee.bdt}`
            : "";
      return [level.key, { amount, label: fee.quoted ? fee.label : "" }];
    }),
  );

  return (
    <>
      <WorkspaceHeader
        title="Verification"
        description="Track every check on your company. Badges renew annually and show the award date and method publicly."
        actions={
          <Badge tone={activeBadge ? "green" : latest ? "amber" : "slate"}>
            {activeBadge ? activeBadge.levelLabel : latest ? statusLabel(latest.status) : "Not started"}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-bold text-primary">
                  {latest ? `${latest.levelLabel} — ${statusLabel(latest.status)}` : "Verification not started"}
                </p>
                <p className="text-[13px] text-slate-500">
                  {latest
                    ? `Case ${latest.id} · method: ${methodLabel(latest.method)}`
                    : "Choose a level below to begin"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <ProgressBar value={progress} tone={progress >= 100 ? "green" : "navy"} />
          </div>
          <p className="mt-2 text-[13px] text-slate-600">
            {done} of 5 steps complete
            {latest?.decisionReason ? ` · ${latest.decisionReason}` : ""}
          </p>

          <ol className="mt-6 space-y-0">
            {steps.map((step, index) => {
              const isDone = index < done;
              const isCurrent = index === done && !open ? false : index === done;
              return (
                <li key={step.label} className="relative flex gap-4 pb-5 last:pb-0">
                  {index < steps.length - 1 ? (
                    <span className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px bg-slate-200" />
                  ) : null}
                  <span
                    className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${
                      isDone ? "bg-success" : isCurrent ? "bg-primary" : "bg-slate-300"
                    }`}
                  >
                    <span className="text-[11px] font-bold">{index + 1}</span>
                  </span>
                  <div className="pt-0.5">
                    <p className="text-sm font-semibold text-ink">{step.label}</p>
                    <p className="text-[12px] text-slate-500">{step.date}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <p className="label-xs">Badges earned</p>
            <div className="mt-3 space-y-3">
              {badges.length ? (
                badges.map((badge) => (
                  <div key={badge.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-ink">{badge.levelLabel}</p>
                      <Badge tone={badge.revokedAt ? "red" : daysUntil(badge.expiresAt) > 0 ? "green" : "amber"}>
                        {badge.revokedAt ? "Revoked" : daysUntil(badge.expiresAt) > 0 ? "Active" : "Expired"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {formatDate(badge.awardedAt)} · {badge.methodLabel} · expires {formatDate(badge.expiresAt)}
                    </p>
                    {badge.revokedReason ? (
                      <p className="mt-1 text-[12px] text-red-600">{badge.revokedReason}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No badges yet"
                  text="Badges display on your profile, listings and every inquiry thread once earned."
                />
              )}
            </div>
          </div>

          <div className="panel p-5">
            <p className="label-xs">Submitted documents</p>
            <div className="mt-3 space-y-2">
              {latest?.documents?.length ? (
                latest.documents.map((doc, index) => (
                  <div key={index} className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2 last:border-0">
                    <span className="text-[13px] font-semibold text-ink">{doc.type}</span>
                    <span className="truncate text-[12px] text-slate-500">{doc.reference}</span>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-slate-500">No documents on file yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Section className="mt-8" title={activeBadge ? "Renew or upgrade" : "Start verification"}>
        <div className="panel p-6">
          <VerificationApply
            levels={plain(VERIFICATION_LEVELS)}
            fees={fees}
            country={profile.country || ""}
            hasOpenCase={Boolean(open)}
            canRenew={Boolean(activeBadge) && renewSoon}
          />
        </div>
      </Section>
    </>
  );
}
