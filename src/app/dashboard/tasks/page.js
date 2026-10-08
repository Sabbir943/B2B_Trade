import { Panel } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getStaffStatuses } from "@/lib/audit";
import { updateAssignedTask } from "@/lib/actions";
import { RowActions } from "@/components/staff-actions";

export const metadata = { title: "Verification tasks" };

const assignedTasks = [
  {
    id: "VT-4102",
    company: "Delta Jute Works",
    type: "Company documents",
    due: "10 Oct 2026",
    defaultStatus: "In progress",
  },
  {
    id: "VT-4098",
    company: "Atrium Leather Co.",
    type: "Factory audit",
    due: "12 Oct 2026",
    defaultStatus: "New",
  },
  {
    id: "VT-4095",
    company: "Sunrise Agro Traders",
    type: "Bank letter check",
    due: "08 Oct 2026",
    defaultStatus: "Completed",
  },
];

export default async function VerificationTasksPage() {
  const { user } = await requirePermission("verification.assigned.view");
  const statuses = await getStaffStatuses("verification_task");
  const rows = assignedTasks.map((task) => ({
    ...task,
    status: statuses[task.id]?.status ?? task.defaultStatus,
  }));

  const open = rows.filter((row) => row.status !== "Completed").length;

  const stats = [
    { label: "Assigned to you", value: String(rows.length), hint: "Nobody else sees these" },
    { label: "Open", value: String(open), hint: "Due this week" },
    { label: "Completed", value: String(rows.length - open), hint: "This cycle" },
    { label: "Account", value: user.email, hint: "Verification Partner" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Verification tasks"
        description="Only the verification tasks assigned to you. You can see and update these — nothing else on the platform."
        actions={
          <span className="inline-flex items-center gap-2 rounded-lg bg-primary/8 px-3 py-2 text-[13px] font-semibold text-primary">
            <ShieldIcon className="h-4 w-4" /> Assigned scope only
          </span>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Assigned tasks">
        <DataTable
          columns={[
            { key: "id", label: "Task", emphasis: true },
            { key: "company", label: "Company" },
            { key: "type", label: "Check type" },
            { key: "due", label: "Due" },
            { key: "status", label: "Status", pill: true },
            {
              key: "actions",
              label: "Update",
              render: (row) => (
                <RowActions
                  id={row.id}
                  onAction={updateAssignedTask}
                  actions={[
                    { label: "Start", value: "In progress" },
                    { label: "Complete", value: "Completed" },
                    { label: "Block", value: "Blocked", tone: "danger" },
                  ]}
                />
              ),
            },
          ]}
          rows={rows}
        />
      </Section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <p className="text-sm font-bold text-primary">Field standard</p>
          <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
            <li>· Verify the registry extract before the physical visit.</li>
            <li>· Photographs must show the address plate at the facility.</li>
            <li>· Bank letters need a callable branch contact.</li>
            <li>· Blocked tasks return to the Dhaka queue with your notes.</li>
          </ul>
        </Panel>

        <Panel>
          <p className="text-sm font-bold text-primary">Access boundary</p>
          <p className="mt-2 text-[13px] leading-6 text-slate-600">
            Your role cannot reach the member directory, payments, the Sourcing
            Desk or platform settings — the server rejects those routes before
            they render. Every update you make here is written to the audit log
            with your account as the actor.
          </p>
        </Panel>
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Sample task rows scoped to your account; updates are real and audited.
      </p>
    </>
  );
}
