"use client";

import { useState } from "react";
import ConfirmDialog from "./confirm-dialog";
import { approveMember, reinstateMember, suspendMember } from "@/lib/member-admin-actions";

/**
 * Per-row member controls on /admin/members.
 *
 * Approve is a one-click fix for an unverified account; Suspend always asks
 * for a reason the member will see; Reinstate is a plain confirmation.
 * The server actions re-check permissions and write the audit entry.
 */
export default function MemberRowActions({ email, emailVerified, suspended, locked }) {
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const canApprove = !emailVerified && !suspended;
  const canSuspend = !suspended && !locked;
  const canReinstate = Boolean(suspended);

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold text-success">
        ✓ {done}
      </span>
    );
  }

  async function run(action, argument, doneLabel) {
    setBusy(true);
    setError(null);
    try {
      const result = await action(argument);
      if (result?.ok) {
        setDialog(null);
        setDone(doneLabel ?? result.done ?? "Saved");
      } else {
        setError(result?.error ?? "That action failed.");
      }
      return result;
    } catch {
      setError("That action failed.");
      return { ok: false };
    } finally {
      setBusy(false);
    }
  }

  async function confirmDialog(reason) {
    if (dialog === "suspend") {
      setBusy(true);
      setError(null);
      try {
        const result = await suspendMember(email, reason);
        if (result?.ok) {
          setDialog(null);
          setDone("Suspended");
        } else {
          setError(result?.error ?? "That action failed.");
        }
      } catch {
        setError("That action failed.");
      } finally {
        setBusy(false);
      }
      return;
    }
    await run(reinstateMember, email, "Reinstated");
  }

  const showActions = canApprove || canSuspend || canReinstate;

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {canApprove ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(approveMember, email, "Approved")}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          Approve
        </button>
      ) : null}

      {canSuspend ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setError(null);
            setDialog("suspend");
          }}
          className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          Suspend
        </button>
      ) : null}

      {canReinstate ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setError(null);
            setDialog("reinstate");
          }}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          Reinstate
        </button>
      ) : null}

      {!showActions ? (
        <span className="whitespace-nowrap text-[12px] text-slate-400">—</span>
      ) : null}

      {error ? (
        <span className="whitespace-nowrap text-[11px] font-semibold text-red-600">{error}</span>
      ) : null}

      <ConfirmDialog
        open={dialog === "suspend"}
        title="Suspend this account?"
        body="They can no longer sign in and every live session ends right away. The reason below is shown to the member."
        confirmLabel="Suspend account"
        busy={busy}
        error={error}
        reasonLabel="Reason for the suspension"
        reasonPlaceholder="For example: payment dispute under review."
        onConfirm={confirmDialog}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "reinstate"}
        title="Reinstate this account?"
        body="They will be able to sign in again straight away."
        confirmLabel="Reinstate"
        tone="amber"
        busy={busy}
        error={error}
        onConfirm={confirmDialog}
        onCancel={() => setDialog(null)}
      />
    </span>
  );
}
