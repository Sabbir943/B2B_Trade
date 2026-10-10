import { Badge, Button, EmptyState, ProgressBar } from "@/components/ui";
import { GlobeIcon } from "@/components/icons";
import { Section, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getApplicationFor, MARKET_ENTRY_STAGES, stageLabel } from "@/lib/market-entry";
import { plain, formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Market entry application" };

const TERMINAL_TONE = { rejected: "red", withdrawn: "slate" };

/**
 * §7.6 tracking — the applicant sees their own application only: current
 * stage, named officer and the stage history written by staff.
 */
export default async function MarketEntryApplicationPage() {
  const { user } = await requirePermission("market_entry.track");
  const application = await getApplicationFor(user.email);

  if (!application) {
    return (
      <>
        <WorkspaceHeader
          title="Market entry application"
          description="Track your Bangladesh market-entry application end to end. You can see and message only the staff assigned to this application."
        />
        <EmptyState
          icon={<GlobeIcon className="h-5 w-5" />}
          title="No application submitted"
          text="Once you submit a market-entry application it appears here with its stage, document checklist and assigned officer."
          action={
            <Button href="/market-entry/apply" variant="navy" size="sm">
              Start an application
            </Button>
          }
        />
        <Section className="mt-6" title="How it works">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Submitted", "Brief and documents reach the desk."],
              ["Screening → call", "Compliance review, then a leadership call."],
              ["Proposal → active", "Contract, registration and retainer billing."],
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

  const terminal = ["rejected", "withdrawn"].includes(application.stage);
  const currentIndex = MARKET_ENTRY_STAGES.findIndex((stage) => stage.key === application.stage);
  const done = terminal ? 0 : currentIndex + 1;
  const progress = Math.round((done / MARKET_ENTRY_STAGES.length) * 100);
  const history = application.stageHistory || [];

  return (
    <>
      <WorkspaceHeader
        title="Market entry application"
        description={`${application.company} · ${application.id}`}
        actions={
          <Badge tone={terminal ? TERMINAL_TONE[application.stage] || "slate" : "navy"}>
            {stageLabel(application.stage)}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold text-primary">
                {stageLabel(application.stage)}
              </p>
              <p className="text-[13px] text-slate-500">
                Officer: {application.officer || "not assigned yet"} · applied{" "}
                {formatDate(application.createdAt)}
              </p>
            </div>
            <Badge tone={terminal ? TERMINAL_TONE[application.stage] || "slate" : "green"}>
              {terminal ? "Closed" : "In progress"}
            </Badge>
          </div>

          <div className="mt-5">
            <ProgressBar value={progress} tone={terminal ? "amber" : "green"} />
          </div>
          <p className="mt-2 text-[13px] text-slate-600">
            {done} of {MARKET_ENTRY_STAGES.length} stages complete
          </p>

          <ol className="mt-6 space-y-0">
            {MARKET_ENTRY_STAGES.map((stage, index) => {
              const isDone = index < done;
              const isCurrent = index === currentIndex && !terminal;
              return (
                <li key={stage.key} className="relative flex gap-4 pb-5 last:pb-0">
                  {index < MARKET_ENTRY_STAGES.length - 1 ? (
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
                    <p className="text-sm font-semibold text-ink">{stage.label}</p>
                    <p className="text-[12px] text-slate-500">
                      {history.find((entry) => entry.stage === stage.key)
                        ? formatDate(history.find((entry) => entry.stage === stage.key).at)
                        : isCurrent
                          ? "Current stage"
                          : "Pending"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {application.note ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="label-xs">Note from the desk</p>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-700">{application.note}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <p className="label-xs">Application</p>
            <dl className="mt-3 space-y-2.5">
              {[
                ["Company", application.company],
                ["Category", application.category || "—"],
                ["Target market", application.targetMarket || "—"],
                ["Contact", application.contactName || "—"],
                ["Email", application.contactEmail],
                ["Website", application.website || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-[13px] text-slate-500">{label}</dt>
                  <dd className="truncate text-[13px] font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel p-5">
            <p className="label-xs">Brief</p>
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-600">
              {application.details}
            </p>
          </div>

          <div className="panel p-5">
            <p className="label-xs">Assigned officer</p>
            {application.officer ? (
              <>
                <p className="mt-2 text-sm font-bold text-ink">{application.officer}</p>
                <p className="mt-1 text-[13px] text-slate-500">
                  Your single point of contact from scoping call to first shipment.
                </p>
              </>
            ) : (
              <p className="mt-2 text-[13px] text-slate-500">
                An officer is assigned during screening — usually within two working days.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Your own application only — brand partners never see marketplace admin data.
      </p>
    </>
  );
}
