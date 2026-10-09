import { Badge, Button, EmptyState, ProgressBar } from "@/components/ui";
import { ClockIcon, ShieldIcon } from "@/components/icons";
import { Section, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Verification" };

const steps = [
  { label: "Application submitted", state: "todo", date: "Not started" },
  { label: "Documents reviewed", state: "todo", date: "Not started" },
  { label: "Factory audit scheduled", state: "todo", date: "Not started" },
  { label: "Audit report in review", state: "todo", date: "Not started" },
  { label: "Certificate issued", state: "todo", date: "Not started" },
];

export default async function VerificationPage() {
  await requirePermission("member.verification");
  const done = steps.filter((step) => step.state === "done").length;
  const progress = Math.round((done / steps.length) * 100);

  return (
    <>
      <WorkspaceHeader
        title="Verification"
        description="Track every check on your company. Badges renew automatically when certificates are refreshed."
        actions={
          <>
            <Button href="/verification" variant="outline" size="sm">
              Programme details
            </Button>
            <Button variant="navy" size="sm">
              Upload documents
            </Button>
          </>
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
                  Verification not started
                </p>
                <p className="text-[13px] text-slate-500">
                  No documents submitted yet
                </p>
              </div>
            </div>
            <Badge tone="slate">Not started</Badge>
          </div>

          <ProgressBar value={progress} className="mt-5" />
          <p className="mt-2 text-[13px] text-slate-600">
            {done} of {steps.length} steps complete
          </p>

          <ol className="mt-6 space-y-0">
            {steps.map((step, index) => (
              <li key={step.label} className="relative flex gap-4 pb-5 last:pb-0">
                {index < steps.length - 1 ? (
                  <span className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px bg-slate-200" />
                ) : null}
                <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-300 text-white">
                  <span className="text-[11px] font-bold">{index + 1}</span>
                </span>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-ink">{step.label}</p>
                  <p className="text-[12px] text-slate-500">{step.date}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <p className="label-xs">Badges earned</p>
            <div className="mt-3">
              <EmptyState
                title="No badges yet"
                text="Badges display on your profile, listings and every inquiry thread once earned."
              />
            </div>
            <Button href="/verification-badges" variant="outline" size="sm" className="mt-3 w-full">
              What each badge means
            </Button>
          </div>

          <div className="panel p-5">
            <p className="label-xs">Documents</p>
            <div className="mt-3">
              <EmptyState
                icon={<ClockIcon className="h-5 w-5" />}
                title="No documents uploaded"
                text="Trade licence, registration and certificates go here."
              />
            </div>
            <Button variant="navy" size="sm" className="mt-4 w-full">
              Upload documents
            </Button>
          </div>
        </div>
      </div>

      <Section className="mt-6" title="How it works">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Submit documents", "Trade licence, registration, bank letter and product certificates."],
            ["Desk review & audit", "The trade desk reviews paperwork and schedules a factory audit."],
            ["Badges issued", "Verified badges appear on your profile, listings and inquiries."],
          ].map(([label, text]) => (
            <div key={label} className="panel p-5">
              <p className="font-display text-sm font-bold text-primary">{label}</p>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
