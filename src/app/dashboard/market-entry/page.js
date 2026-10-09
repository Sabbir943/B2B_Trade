import { Button, EmptyState, Panel } from "@/components/ui";
import { GlobeIcon, ShieldIcon } from "@/components/icons";
import { Section, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Market entry application" };

export default async function MarketEntryApplicationPage() {
  await requirePermission("market_entry.track");

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
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              <ShieldIcon className="h-4 w-4 text-secondary" />
              Application stages
            </p>
            <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
              <li>· Submitted — your brief and documents reach the desk.</li>
              <li>· Documents — compliance dossier reviewed with your officer.</li>
              <li>· Interview — call with the market-entry desk.</li>
              <li>· Approval — registration and on-ground support begin.</li>
            </ul>
          </Panel>

          <Panel>
            <p className="text-sm font-bold text-primary">What you can do here</p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Follow every stage of your own application, upload the documents
              requested by the desk, and message only the staff member assigned
              to you. Sends are permission-checked on the server and logged.
            </p>
            <Button href="/market-entry" variant="outline" size="sm" className="mt-4">
              Programme overview
            </Button>
          </Panel>
        </div>
      </Section>

      <p className="mt-4 text-[12px] text-slate-400">
        Your own application only — brand partners never see marketplace admin
        data.
      </p>
    </>
  );
}
