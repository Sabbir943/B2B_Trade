import { Stat } from "./ui";

const TONES = {
  green: "bg-success/12 text-success",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-600",
  blue: "bg-secondary/12 text-[#0a5486]",
  slate: "bg-slate-100 text-slate-600",
};

const GREEN = ["paid", "live", "active", "approved", "routed", "matched", "closed", "published", "yes", "warm", "met", "completed", "delivered"];
const AMBER = ["pending", "under review", "draft", "matching", "sampling", "negotiating", "due", "paused", "documents", "interview", "new", "quoted", "open", "visit requested", "in progress", "sent"];
const RED = ["failed", "suspended", "escalated", "high", "needs action", "flagged", "rejected", "removed", "blocked"];
const BLUE = ["flagged", "routing", "in review", "current", "hot"];

export function toneFor(value) {
  const text = String(value ?? "").toLowerCase();
  if (GREEN.includes(text)) return "green";
  if (RED.includes(text)) return "red";
  if (BLUE.includes(text)) return "blue";
  if (AMBER.includes(text)) return "amber";
  return "slate";
}

export function Pill({ children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONES[toneFor(children)] ?? TONES.slate}`}
    >
      {children}
    </span>
  );
}

export function WorkspaceHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCards({ items }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Stat key={item.label} label={item.label} value={item.value} hint={item.hint} />
      ))}
    </div>
  );
}

export function DataTable({ columns, rows, empty = "Nothing here yet." }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-surface text-left">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={row.id ?? row.name ?? index} className="transition hover:bg-surface/70">
              {columns.map((column) => {
                const raw = row[column.key];
                const value = column.render ? column.render(row) : raw;
                return (
                  <td
                    key={column.key}
                    className={`px-4 py-3 ${column.emphasis ? "font-semibold text-ink" : "text-slate-600"}`}
                  >
                    {column.pill ? <Pill>{raw}</Pill> : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Section({ title, action, children, className = "" }) {
  return (
    <section className={className}>
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-primary">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function SampleNote({ text = "Sample data shown for preview purposes." }) {
  return <p className="mt-4 text-[12px] text-slate-400">{text}</p>;
}
