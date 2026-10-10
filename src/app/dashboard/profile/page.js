import ProfileForm from "@/components/profile-form";
import { Badge, Button, ProgressBar } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";
import { WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { roleLabel } from "@/lib/permissions";
import { completeness, currencyForCountry, getProfile } from "@/lib/profile";
import { getActiveBadge, getCasesFor, statusLabel } from "@/lib/verification";
import { getTrustScore } from "@/lib/trust";
import { categories, categoriesById } from "@/lib/catalog";
import { formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Company profile" };

/**
 * §7.1.4 — completeness meter (rank penalty under 70%), read-only currency
 * derived from country, and the live verification badge state.
 */
export default async function ProfilePage() {
  const { user, role, tier } = await requirePermission("member.profile");
  const profile = await getProfile(user.email);
  const meter = completeness(profile);
  const badge = await getActiveBadge(user.email);
  const cases = await getCasesFor(user.email);
  const trust = await getTrustScore(user.email);
  const openCase = cases.find((item) => !["approved", "rejected", "revoked"].includes(item.status));

  return (
    <>
      <WorkspaceHeader
        title="Company profile"
        description="What buyers read before they reply. Complete, current profiles appear higher in supplier search."
        actions={
          <Button href="/dashboard/verification" variant="outline" size="sm">
            Verification status
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="label-xs">Company details</p>
            <span className="text-[13px] font-semibold text-slate-500">
              {profile.phoneVerified ? "Phone verified" : "Phone not verified"}
            </span>
          </div>
          <div className="mt-4">
            <ProfileForm
              user={{ name: user.name, email: user.email }}
              profile={profile}
              categories={categories}
              categoriesById={categoriesById}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <p className="label-xs">Profile completeness</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-display text-2xl font-bold text-primary">
                {meter.percent}%
              </span>
              <Badge tone={meter.percent >= 70 ? "green" : "amber"}>
                {meter.percent >= 70 ? "Normal rank" : "Lower rank"}
              </Badge>
            </div>
            <div className="mt-3">
              <ProgressBar value={meter.percent} tone={meter.percent >= 70 ? "green" : "amber"} />
            </div>
            <p className="mt-3 text-[13px] leading-6 text-slate-600">
              {meter.missing.length
                ? `Missing: ${meter.missing.join(", ")}`
                : "Every weighted field is filled in."}
            </p>
          </div>

          <div className="panel p-5">
            <p className="label-xs">Your account</p>
            <dl className="mt-3 space-y-2.5">
              {[
                ["Name", user.name || "—"],
                ["Email", user.email || "—"],
                ["Role", roleLabel(role)],
                ["Plan", tier || "free"],
                ["Currency", currencyForCountry(profile.country)],
                ["Trust score", `${trust.score}/100 · ${trust.label}`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-[13px] text-slate-500">{label}</dt>
                  <dd className="truncate text-[13px] font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel p-5">
            <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
              <ShieldIcon className="h-4 w-4 text-secondary" />
              Verification
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[13px] text-slate-600">Status</span>
              {badge ? (
                <Badge tone="green">{badge.levelLabel || "Verified"}</Badge>
              ) : openCase ? (
                <Badge tone="amber">{statusLabel(openCase.status)}</Badge>
              ) : (
                <Badge tone="slate">Not started</Badge>
              )}
            </div>
            {badge ? (
              <p className="mt-3 text-[13px] leading-6 text-slate-600">
                Awarded {formatDate(badge.awardedAt)} · {badge.methodLabel} · expires{" "}
                {formatDate(badge.expiresAt)}
              </p>
            ) : (
              <p className="mt-3 text-[13px] leading-6 text-slate-600">
                Verified companies get badges on their profile, listings and every
                inquiry thread.
              </p>
            )}
            <Button
              href={badge ? "/dashboard/verification?renew=1" : "/dashboard/verification"}
              variant="navy"
              size="sm"
              className="mt-4 w-full"
            >
              {badge ? "Renew badge" : openCase ? "View case" : "Start verification"}
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
