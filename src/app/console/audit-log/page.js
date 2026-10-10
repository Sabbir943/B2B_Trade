import { FileTextIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { listAuditEntries } from "@/lib/audit";
import { formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Audit log" };

const DAY = 24 * 60 * 60 * 1000;

function weekAgoCutoff() {
  return Date.now() - 7 * DAY;
}

export default async function ConsoleAuditLogPage() {
  await requirePermission("console.audit_log");
  const entries = await listAuditEntries(200);

  const rows = entries.map((entry) => ({
    id: entry.id,
    time: formatDate(entry.at),
    actor: entry.actor,
    role: entry.actorRole,
    action: entry.action,
    target: entry.target,
  }));

  const cutoff = weekAgoCutoff();
  const week = entries.filter((entry) => new Date(entry.at).getTime() >= cutoff);
  const actors = new Set(entries.map((entry) => entry.actor));
  const families = new Map();
  for (const entry of entries) {
    const family = `${String(entry.action).split(".")[0]}.*`;
    families.set(family, (families.get(family) || 0) + 1);
  }
  const familyRows = [...families.entries()].sort((a, b) => b[1] - a[1]);

  const stats = [
    { label: "Entries loaded", value: String(entries.length), hint: "Most recent 200" },
    { label: "Last 7 days", value: String(week.length), hint: "Rolling window" },
    { label: "Distinct actors", value: String(actors.size), hint: "Staff + system" },
    { label: "Action families", value: String(familyRows.length), hint: "e.g. verification.*, billing.*" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Audit log"
        description="Every privileged action with actor, target and timestamp. Entries cannot be edited or deleted."
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Live audit stream">
        {rows.length ? (
          <DataTable
            columns={[
              { key: "time", label: "Timestamp", emphasis: true },
              { key: "actor", label: "Actor" },
              { key: "role", label: "Role" },
              { key: "action", label: "Action" },
              { key: "target", label: "Target" },
            ]}
            rows={rows}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No entries yet. Verification decisions, listing moderation, staff
            role assignments and pricing edits land here the moment they run.
          </div>
        )}
      </Section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <p className="label-xs">Action families (loaded window)</p>
          {familyRows.length ? (
            <div className="mt-4 space-y-3">
              {familyRows.map(([family, count]) => (
                <div
                  key={family}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span className="grid h-9 w-14 shrink-0 place-items-center rounded-lg bg-surface font-mono text-[11px] font-bold text-primary">
                    {family.split(".")[0]}
                  </span>
                  <p className="min-w-0 flex-1 text-sm font-semibold text-ink">{family}</p>
                  <span className="shrink-0 text-[13px] font-semibold text-slate-600">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[13px] leading-6 text-slate-600">
              No actions recorded yet.
            </p>
          )}
        </div>

        <div className="panel p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-primary">
            <FileTextIcon className="h-4 w-4 text-secondary" />
            Immutability
          </p>
          <p className="mt-2 text-[13px] leading-6 text-slate-600">
            Entries are append-only — the audit collection has no update or
            delete path in the application. Every staff action (moderation,
            role changes, pricing edits, verification decisions) writes actor,
            role, target and a JSON detail payload.
          </p>
        </div>
      </div>
    </>
  );
}
