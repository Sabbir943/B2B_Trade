import ProfileForm from "@/components/profile-form";
import { Badge, Button } from "@/components/ui";
import { CheckIcon, ShieldIcon } from "@/components/icons";
import { SampleNote, Section, WorkspaceHeader } from "@/components/workspace";
import { dashboard } from "@/lib/catalog";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Company profile" };

const facts = [
  ["Founded", "2009"],
  ["Processing units", "2"],
  ["Annual capacity", "6,000 MT"],
  ["Main port", "Chattogram"],
  ["Markets served", "18 countries"],
  ["Team seats", "5 of 10"],
];

export default async function ProfilePage() {
  await requirePermission("member.profile");
  return (
    <>
      <WorkspaceHeader
        title="Company profile"
        description="What buyers read before they reply. Complete, current profiles appear higher in supplier search."
        actions={
          <>
            <Button href="/suppliers/meridian-spice-exports" variant="outline" size="sm">
              View public profile
            </Button>
            <Badge tone="green">
              <CheckIcon className="h-3 w-3" /> Verified
            </Badge>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="panel p-6">
          <p className="label-xs">Company details</p>
          <div className="mt-4">
            <ProfileForm />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <p className="label-xs">At a glance</p>
            <dl className="mt-3 space-y-2.5">
              {facts.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-[13px] text-slate-500">{label}</dt>
                  <dd className="text-[13px] font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel p-5">
            <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
              <ShieldIcon className="h-4 w-4 text-secondary" />
              Public trust signals
            </p>
            <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
              <li className="flex gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Company verified 22 Sep 2026
              </li>
              <li className="flex gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Responds within 6 hours
              </li>
              <li className="flex gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                4.8 rating across 36 trades
              </li>
            </ul>
            <Button href="/dashboard/verification" variant="navy" size="sm" className="mt-4 w-full">
              Manage verification
            </Button>
          </div>

          <Section title="Team seats">
            <div className="panel p-5">
              <p className="text-[13px] text-slate-600">
                5 of 10 seats used on the Exporter plan.
              </p>
              <Button variant="outline" size="sm" className="mt-3 w-full">
                Invite teammate
              </Button>
            </div>
          </Section>
        </aside>
      </div>

      <SampleNote />
    </>
  );
}
