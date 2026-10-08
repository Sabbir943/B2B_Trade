import { dashboard } from "@/lib/catalog";
import { Badge, Button, ProgressBar } from "@/components/ui";
import { CheckIcon, ClockIcon, ShieldIcon } from "@/components/icons";
import { SampleNote, Section, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Verification" };

const documents = [
  { label: "Trade licence", state: "Accepted", tone: "green" },
  { label: "Company registration", state: "Accepted", tone: "green" },
  { label: "Bank verification letter", state: "Accepted", tone: "green" },
  { label: "ISO 22000 certificate", state: "Expiring soon", tone: "amber" },
  { label: "Lab test report (current lot)", state: "Missing", tone: "red" },
];

export default async function VerificationPage() {
  await requirePermission("member.verification");
  const done = dashboard.verifySteps.filter((step) => step.state === "done").length;
  const progress = Math.round((done / dashboard.verifySteps.length) * 100);

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
                  Company verified
                </p>
                <p className="text-[13px] text-slate-500">
                  Documents audited 22 Sep 2026 · Factory audit in progress
                </p>
              </div>
            </div>
            <Badge tone="green">
              <CheckIcon className="h-3 w-3" /> Verified
            </Badge>
          </div>

          <ProgressBar value={progress} className="mt-5" />
          <p className="mt-2 text-[13px] text-slate-600">
            {done} of {dashboard.verifySteps.length} steps complete · current stage
            factory audit
          </p>

          <ol className="mt-6 space-y-0">
            {dashboard.verifySteps.map((step, index) => (
              <li key={step.label} className="relative flex gap-4 pb-5 last:pb-0">
                {index < dashboard.verifySteps.length - 1 ? (
                  <span
                    className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px ${
                      step.state === "done" ? "bg-success" : "bg-slate-200"
                    }`}
                  />
                ) : null}
                <span
                  className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${
                    step.state === "done"
                      ? "bg-success"
                      : step.state === "current"
                        ? "bg-primary"
                        : "bg-slate-300"
                  }`}
                >
                  {step.state === "done" ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : step.state === "current" ? (
                    <ClockIcon className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[11px] font-bold">{index + 1}</span>
                  )}
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
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="green">
                <CheckIcon className="h-3 w-3" /> Company Verified
              </Badge>
              <Badge tone="navy">Export Licence</Badge>
              <Badge tone="navy">ISO 22000</Badge>
              <Badge tone="amber">Factory audit pending</Badge>
            </div>
            <p className="mt-3 text-[13px] leading-6 text-slate-600">
              Badges display on your profile, listings and every inquiry thread.
            </p>
            <Button href="/verification-badges" variant="outline" size="sm" className="mt-3">
              What each badge means
            </Button>
          </div>

          <div className="panel p-5">
            <p className="label-xs">Documents</p>
            <ul className="mt-3 space-y-2.5">
              {documents.map((doc) => (
                <li key={doc.label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[13px] text-slate-600">
                    <CheckIcon
                      className={`h-4 w-4 ${
                        doc.tone === "red" ? "text-slate-300" : "text-success"
                      }`}
                    />
                    {doc.label}
                  </span>
                  <Badge tone={doc.tone}>{doc.state}</Badge>
                </li>
              ))}
            </ul>
            <Button variant="navy" size="sm" className="mt-4 w-full">
              Upload missing document
            </Button>
          </div>
        </div>
      </div>

      <Section className="mt-6" title="Next audit">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Scheduled", "14 Oct 2026 · 10:00 BST"],
            ["Auditor", "Bureau Veritas · Dhaka"],
            ["Scope", "Production line, QA records, packing"],
          ].map(([label, value]) => (
            <div key={label} className="panel p-5">
              <p className="label-xs">{label}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      <SampleNote />
    </>
  );
}
