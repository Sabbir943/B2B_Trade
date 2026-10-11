"use client";

import { useState } from "react";
import ConfirmDialog from "./confirm-dialog";

/**
 * One destructive row action behind a confirmation modal — used for
 * “Delete listing” / “Delete requirement” in the admin tables.
 * The server action re-checks permissions and writes the audit entry.
 */
export default function DeleteRowAction({
  id,
  onAction,
  title = "Delete this record?",
  body = "This cannot be undone.",
  label = "Delete",
  confirmLabel = "Delete",
  doneLabel = "Deleted",
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const result = await onAction(id);
      if (result?.ok) {
        setDone(true);
        setOpen(false);
      } else {
        setError(result?.error ?? "That action failed.");
      }
    } catch {
      setError("That action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold text-success">
        ✓ {doneLabel}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {label}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        body={body}
        confirmLabel={confirmLabel}
        busy={busy}
        error={error}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
