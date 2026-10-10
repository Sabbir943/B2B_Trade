import { ModerationRow } from "@/components/moderation-actions";
import { StaffSelect } from "@/components/staff-select";
import { Badge } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import {
  listApplications,
  listActiveForRetainer,
  listOfficers,
  MARKET_ENTRY_STAGES,
  MARKET_ENTRY_TERMINAL,
  stageLabel,
} from "@/lib/market-entry";
import {
  advanceMarketEntryStage,
  assignMarketEntryOfficer,
  issueMarketEntryRetainer,
} from "@/lib/actions";
import { plain, formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Market Entry applications" };

const STAGE_TONE = {
  submitted: "amber",
  screening: "blue",
  call: "navy",
  proposal: "navy",
  contract: "green",
  active: "green",
  rejected: "red",
  withdrawn: "slate",
};

const STAGE_OPTIONS = [
  ...MARKET_ENTRY_STAGES.map((stage) => ({ value: stage.key, label: stage.label })),
  ...MARKET_ENTRY_TERMINAL.map((key) => ({ value: key, label: stageLabel(key) })),
];

/**
 * §7.6 pipeline console — advance the stage, assign the named officer and
 * (from the contract stage) issue the monthly retainer invoice.
 */
export default async function AdminMarketEntryPage() {
  await requirePermission("admin.market_entry");

  const applications = plain(await listApplications({ limit: 100 }));
  const active = plain(await listActiveForRetainer());
  const assignees = plain(await listOfficers());
  const officerOptions = assignees.map((person) => ({
    value: person.email,
    label: person.name ? `${person.name} (${person.email})` : person.email,
  }));

  const stats = [
    { label: "Applications", value: String(applications.length), hint: "All stages" },
    { label: "In screening", value: String(applications.filter((row) => ["submitted", "screening"].includes(row.stage)).length), hint: "Early pipeline" },
    { label: "Contracted", value: String(applications.filter((row) => ["contract", "active"].includes(row.stage)).length), hint: "Retainer eligible" },
    { label: "Officers", value: String(new Set(applications.map((row) => row.officer).filter(Boolean)).size), hint: "With an application" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Market Entry applications"
        description="Overseas brands and importers applying for a managed Bangladesh entry. Each application gets one named officer."
        actions={<Badge tone="navy">{active.length} on retainer</Badge>}
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Applications">
        <DataTable
          columns={[
            { key: "id", label: "Ref", emphasis: true },
            {
              key: "company",
              label: "Company",
              emphasis: true,
              render: (row) => (
                <span className="flex flex-col gap-0.5">
                  <span>{row.company}</span>
                  <span className="text-[12px] font-normal text-slate-500">
                    {row.category || "—"} · {row.contactEmail}
                  </span>
                </span>
              ),
            },
            { key: "targetMarket", label: "Target market" },
            { key: "createdAt", label: "Submitted", render: (row) => formatDate(row.createdAt) },
            {
              key: "stage",
              label: "Stage",
              render: (row) => (
                <span className="flex flex-col gap-1.5">
                  <Badge tone={STAGE_TONE[row.stage] || "slate"}>{stageLabel(row.stage)}</Badge>
                  <StaffSelect
                    value={row.stage}
                    options={STAGE_OPTIONS}
                    placeholder="Advance…"
                    onAction={(stage) => advanceMarketEntryStage(row.id, stage)}
                  />
                </span>
              ),
            },
            {
              key: "officer",
              label: "Officer",
              render: (row) => (
                <StaffSelect
                  value={row.officer}
                  options={officerOptions}
                  placeholder="Assign officer…"
                  onAction={(officer) => assignMarketEntryOfficer(row.id, officer)}
                />
              ),
            },
            {
              key: "actions",
              label: "",
              render: (row) =>
                ["contract", "active"].includes(row.stage) ? (
                  <ModerationRow
                    id={row.id}
                    onAction={issueMarketEntryRetainer}
                    actions={[{ label: "Issue retainer", value: "retainer" }]}
                  />
                ) : null,
            },
          ]}
          rows={applications}
          empty="No applications yet."
        />
      </Section>

      <Section className="mt-8" title="Active engagements on retainer">
        <DataTable
          columns={[
            { key: "id", label: "Ref", emphasis: true },
            { key: "company", label: "Company" },
            { key: "officer", label: "Officer" },
            { key: "updatedAt", label: "Updated", render: (row) => formatDate(row.updatedAt) },
          ]}
          rows={active}
          empty="No active engagements — issue a retainer from a contract-stage application."
        />
      </Section>
    </>
  );
}
