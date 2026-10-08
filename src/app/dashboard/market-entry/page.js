import { Badge, Panel } from "@/components/ui";
import { GlobeIcon, ShieldIcon, CheckIcon } from "@/components/icons";
import { Section, StatCards, WorkspaceHeader, Pill } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import PartnerMessageForm from "@/components/partner-message-form";

export const metadata = { title: "Market entry application" };

const application = {
  ref: "ME-118",
  market: "EU — Germany",
  submitted: "04 Oct 2026",
  stage: "Documents",
  officer: "R. Chowdhury",
  updated: "07 Oct 2026",
};

const stages = [
  { key: "Submitted", done: true },
  { key: "Documents", done: false, current: true },
  { key: "Interview", done: false },
  { key: "Approval", done: false },
];

const checklist = [
  ["Brand registration certificate", "Received"],
  ["Product compliance dossier (EU)", "Received"],
  ["Factory audit report", "Pending"],
  ["Power of attorney for the officer", "Received"],
];

export default async function MarketEntryApplicationPage() {
  await requirePermission("market_entry.track");

  const stats = [
    { label: "Reference", value: application.ref, hint: "Keep for correspondence" },
    { label: "Current stage", value: application.stage, hint: `Updated ${application.updated}` },
    { label: "Assigned officer", value: application.officer, hint: "Dhaka market-entry desk" },
    { label: "Target market", value: application.market, hint: "Application filed" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Market entry application"
        description="Track your Bangladesh market-entry application end to end. You can see and message only the staff assigned to this application."
        actions={
          <Badge tone="navy">
            <GlobeIcon className="h-3.5 w-3.5" /> {application.stage}
          </Badge>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Progress">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {stages.map((stage) => (
              <li key={stage.key} className="flex flex-1 items-start gap-3">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                    stage.done
                      ? "bg-success text-white"
                      : stage.current
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {stage.done ? <CheckIcon className="h-4 w-4" /> : "•"}
                </span>
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      stage.current ? "text-primary" : stage.done ? "text-ink" : "text-slate-400"
                    }`}
                  >
                    {stage.key}
                  </p>
                  <p className="text-[12px] text-slate-500">
                    {stage.done
                      ? "Complete"
                      : stage.current
                        ? "In progress — officer reviewing"
                        : "Not started"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <p className="flex items-center gap-2 text-sm font-bold text-primary">
            <ShieldIcon className="h-4 w-4 text-secondary" />
            Document checklist
          </p>
          <ul className="mt-4 space-y-2.5">
            {checklist.map(([doc, state]) => (
              <li
                key={doc}
                className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3.5 py-2.5"
              >
                <span className="text-[13px] text-slate-600">{doc}</span>
                <Pill>{state}</Pill>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] leading-5 text-slate-500">
            Submitted <span className="font-semibold">{application.submitted}</span> ·
            officer <span className="font-semibold">{application.officer}</span>
          </p>
        </Panel>

        <Panel>
          <p className="text-sm font-bold text-primary">Message your assigned officer</p>
          <p className="mt-1 text-[13px] leading-6 text-slate-600">
            Messages go only to the staff member handling your application. The
            send is permission-checked on the server and logged.
          </p>
          <div className="mt-4">
            <PartnerMessageForm />
          </div>
        </Panel>
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Your own application only — brand partners never see marketplace admin
        data.
      </p>
    </>
  );
}
