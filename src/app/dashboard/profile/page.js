import ProfileForm from "@/components/profile-form";
import { Badge, Button } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";
import { WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { roleLabel } from "@/lib/permissions";

export const metadata = { title: "Company profile" };

export default async function ProfilePage() {
  const { user, role, tier } = await requirePermission("member.profile");

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
          <p className="label-xs">Company details</p>
          <div className="mt-4">
            <ProfileForm user={{ name: user.name, email: user.email }} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <p className="label-xs">Your account</p>
            <dl className="mt-3 space-y-2.5">
              {[
                ["Name", user.name || "—"],
                ["Email", user.email || "—"],
                ["Role", roleLabel(role)],
                ["Plan", tier || "free"],
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
              <Badge tone="slate">Not started</Badge>
            </div>
            <p className="mt-3 text-[13px] leading-6 text-slate-600">
              Verified companies get badges on their profile, listings and every
              inquiry thread.
            </p>
            <Button href="/dashboard/verification" variant="navy" size="sm" className="mt-4 w-full">
              Start verification
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
