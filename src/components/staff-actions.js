"use client";

import { useState } from "react";

/**
 * Generic row action buttons for staff tables.
 * The server action passed in as `onAction` re-checks permissions and writes
 * the audit entry — this component only triggers it and shows the result.
 */
export function RowActions({ id, actions, onAction }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  async function run(value) {
    setPending(true);
    setError(null);
    try {
      const result = await onAction(id, value);
      if (result?.ok) {
        setDone(result.decision ?? result.status ?? value);
      } else {
        setError(result?.error ?? "Action failed.");
      }
    } catch {
      setError("Action failed.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold text-success">
        ✓ {done}
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {actions.map((action) => (
        <button
          key={action.value}
          type="button"
          disabled={pending}
          onClick={() => run(action.value)}
          className={`rounded-md border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${
            action.tone === "danger"
              ? "border-red-200 text-red-600 hover:bg-red-50"
              : "border-slate-300 text-slate-600 hover:border-primary hover:text-primary"
          }`}
        >
          {action.label}
        </button>
      ))}
      {error ? (
        <span className="whitespace-nowrap text-[11px] font-semibold text-red-600">
          {error}
        </span>
      ) : null}
    </span>
  );
}
