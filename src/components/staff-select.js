"use client";

import { useState } from "react";

/**
 * Inline select used by staff tables to hand work to the next step:
 * verification method (§7.5.3), case assignee, market-entry officer (§7.6)
 * and pipeline stage. The server action re-checks permissions; this only
 * renders the current value, applies the pick and shows the outcome.
 */
export function StaffSelect({ value = "", options = [], onAction, placeholder = "Assign…", id }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(value);

  async function choose(next) {
    if (!next || next === current) return;
    setPending(true);
    setError(null);
    try {
      const result = await onAction(next);
      if (result?.ok) {
        setCurrent(next);
      } else {
        setError(result?.error ?? "Could not save.");
      }
    } catch {
      setError("Could not save.");
    } finally {
      setPending(false);
    }
  }

  if (error) {
    return <span className="whitespace-nowrap text-[11px] font-semibold text-red-600">{error}</span>;
  }

  return (
    <select
      id={id}
      value={current}
      disabled={pending}
      onChange={(event) => choose(event.target.value)}
      className="max-w-[190px] rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-primary disabled:opacity-60"
    >
      {current ? null : <option value="">{pending ? "Saving…" : placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
