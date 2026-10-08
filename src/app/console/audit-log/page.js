import { console_ } from "@/lib/catalog";
import { Badge, Button } from "@/components/ui";
import { FileTextIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { listAuditEntries } from "@/lib/audit";

export const metadata = { title: "Audit log" };

export default async function ConsoleAuditLogPage() {
  await requirePermission("console.audit_log");
  const live = await listAuditEntries(25);
  const liveRows = live.map((entry) => ({
    id: entry.id,
    time: new Date(entry.at).toISOString().replace("T", " ").slice(0, 19),
    actor: entry.actor,
    role: entry.actorRole,
    action: entry.action,
    target: entry.target,
  }));
  const stats = [
    { label: "Entries (7d)", value: "412", hint: "Immutable storage" },
    { label: "Sensitive actions", value: "28", hint: "Pricing, roles, refunds" },
    { label: "Failed admin logins", value: "3", hint: "All blocked" },
    { label: "Retention", value: "7 yrs", hint: "Policy AUD-01" },
  ];

  return (
    <>
      <WorkspaceHeader
        title="Audit log"
        description="Every privileged action with actor, target and source IP. Entries cannot be edited or deleted."
        actions={
          <>
            <Button variant="outline" size="sm">
              Filter
            </Button>
            <Button variant="navy" size="sm">
              Export signed copy
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Live audit stream">
        {liveRows.length ? (
          <DataTable
            columns={[
              { key: "time", label: "Timestamp (UTC)", emphasis: true },
              { key: "actor", label: "Actor" },
              { key: "role", label: "Role" },
              { key: "action", label: "Action" },
              { key: "target", label: "Target" },
            ]}
            rows={liveRows}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No entries yet. Verification decisions, listing moderation, staff
            role assignments and pricing edits land here the moment they run.
          </div>
        )}
      </Section>

      <Section className="mt-6" title="Recent entries (sample)">
        <DataTable
          columns={[
            { key: "time", label: "Timestamp", emphasis: true },
            { key: "actor", label: "Actor" },
            { key: "action", label: "Action" },
            { key: "target", label: "Target" },
            { key: "ip", label: "IP" },
          ]}
          rows={console_.audit}
        />
      </Section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <p className="label-xs">Action families (7 days)</p>
          <div className="mt-4 space-y-3">
            {[
              ["member.*", "214 entries", "Suspensions, role tags, merges"],
              ["billing.*", "96 entries", "Retries, refunds, plan changes"],
              ["pricing.*", "18 entries", "Tier floors, offer codes"],
              ["auth.*", "84 entries", "Staff logins, MFA resets"],
            ].map(([family, count, text]) => (
              <div
                key={family}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                <span className="grid h-9 w-14 shrink-0 place-items-center rounded-lg bg-surface font-mono text-[11px] font-bold text-primary">
                  {family.split(".")[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{family}</p>
                  <p className="text-[13px] text-slate-500">{text}</p>
                </div>
                <span className="shrink-0 text-[13px] font-semibold text-slate-600">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              <FileTextIcon className="h-4 w-4 text-secondary" />
              Integrity
            </p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Entries are hash-chained daily. Verify the chain for any date
              range; a broken link raises an alert to the Super Admin group.
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Verify chain
            </Button>
          </div>

          <div className="panel p-5">
            <p className="label-xs">Watch items</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="amber">3 failed logins · same IP</Badge>
              <Badge tone="navy">1 pricing change pending approval</Badge>
              <Badge tone="slate">Export queued · 08 Oct</Badge>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Sample data shown for preview purposes.
      </p>
    </>
  );
}
