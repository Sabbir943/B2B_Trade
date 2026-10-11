"use client";

import { useEffect, useRef } from "react";
import { AlertIcon } from "./icons";

/**
 * Reusable confirmation modal for destructive staff actions
 * (suspend member, delete listing/RFQ, revoke role, …).
 *
 * Controlled by the parent: pass `open`, handle `onConfirm` / `onCancel`.
 * Optionally collect a required reason (`reasonLabel`) — used for anything
 * the affected member will see.
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  error = null,
  reasonLabel = null,
  reasonPlaceholder = "Why? This is shown to the member.",
  onConfirm,
  onCancel,
  children,
}) {
  const dialogRef = useRef(null);
  const reasonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector("button")?.focus();
    function onKey(event) {
      if (event.key === "Escape" && !busy) onCancel?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  function confirm() {
    const reason = reasonRef.current?.value?.trim() || "";
    onConfirm?.(reason);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close"
        disabled={busy}
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              tone === "danger" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            <AlertIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="font-display text-lg font-bold text-primary">
              {title}
            </h2>
            {body ? (
              <p className="mt-1.5 text-[13px] leading-6 text-slate-600">{body}</p>
            ) : null}
          </div>
        </div>

        {children}

        {reasonLabel ? (
          <div className="mt-4">
            <label
              htmlFor="confirm-reason"
              className="mb-1.5 block text-[13px] font-semibold text-ink"
            >
              {reasonLabel}
            </label>
            <textarea
              id="confirm-reason"
              ref={reasonRef}
              rows={3}
              disabled={busy}
              placeholder={reasonPlaceholder}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
              tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
