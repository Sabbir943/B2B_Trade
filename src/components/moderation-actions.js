"use client";

import { useState } from "react";

/**
 * Staff row controls for decisions that need a written reason
 * (spec §7.2.2 listing rejections, §7.3.2 requirement rejections).
 *
 * The server action re-checks permissions, persists the decision and writes
 * the audit entry — this component only collects the reason and shows the
 * result. Without `needsReason` it behaves exactly like `RowActions`.
 */
export function ModerationRow({ id, actions, onAction }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);
  const [asking, setAsking] = useState(null);
  const [reason, setReason] = useState("");

  async function run(value, detail = "") {
    setPending(true);
    setError(null);
    try {
      const result = await onAction(id, value, detail);
      if (result?.ok) {
        setDone(result.decision ?? result.status ?? value);
        setAsking(null);
        setReason("");
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
    <span className="flex flex-col items-start gap-2">
      <span className="flex flex-wrap items-center gap-1.5">
        {actions.map((action) => (
          <button
            key={action.value}
            type="button"
            disabled={pending}
            onClick={() => (action.needsReason ? setAsking(action) : run(action.value))}
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
          <span className="whitespace-nowrap text-[11px] font-semibold text-red-600">{error}</span>
        ) : null}
      </span>

      {asking ? (
        <span className="flex w-full min-w-[220px] flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
          <span className="text-[11px] font-bold text-ink">
            Reason for “{asking.label}” (shown to the member)
          </span>
          <textarea
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Unit pricing without a basis"
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[12px] outline-none focus:border-primary"
          />
          <span className="flex gap-2">
            <button
              type="button"
              disabled={pending || reason.trim().length < 3}
              onClick={() => run(asking.value, reason.trim())}
              className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-50"
            >
              {pending ? "Saving…" : "Confirm"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setAsking(null);
                setReason("");
              }}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-600"
            >
              Cancel
            </button>
          </span>
        </span>
      ) : null}
    </span>
  );
}
