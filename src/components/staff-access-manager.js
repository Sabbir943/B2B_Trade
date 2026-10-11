"use client";

import { useState } from "react";
import ConfirmDialog from "./confirm-dialog";
import { ROLE_LABELS, STAFF_ROLES } from "@/lib/permissions";
import {
  createStaffAccount,
  deactivateStaffAccount,
  grantExtraPermission,
  revokeExtraPermission,
} from "@/lib/member-admin-actions";

/** Permission keys a Super Admin can hand to a single account. */
const GRANTABLE = [
  "admin.overview",
  "admin.members",
  "admin.inquiries",
  "admin.listings",
  "admin.requirements",
  "admin.verification_queue",
  "admin.market_entry",
  "admin.content",
  "admin.leads",
  "admin.payments",
  "admin.reports",
  "admin.roles",
  "console.overview",
  "console.sourcing_desk",
  "console.revenue",
  "console.pricing",
  "console.audit_log",
];

/**
 * Staff account provisioning + per-account extra permissions.
 * Every call is a server action that re-checks `admin.roles` and writes an
 * audit entry; this component only collects input and shows the result.
 */
export default function StaffAccessManager({ initialStaff }) {
  const [staff, setStaff] = useState(initialStaff);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [pendingTarget, setPendingTarget] = useState(null);
  const [grant, setGrant] = useState({});

  async function run(action, message) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      if (result?.ok) {
        setNotice(message ?? result.done ?? "Saved.");
        return result;
      }
      setError(result?.error ?? "That action failed.");
      return result;
    } catch {
      setError("That action failed.");
      return { ok: false };
    } finally {
      setBusy(false);
      setPendingTarget(null);
    }
  }

  async function onCreate(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      role: String(data.get("role") ?? ""),
      password: String(data.get("password") ?? ""),
    };

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await createStaffAccount(input);
      if (result?.ok) {
        setStaff((current) => [
          ...current,
          {
            email: result.email,
            name: input.name,
            role: result.role,
            extraPermissions: [],
          },
        ]);
        setNotice(`Staff account created for ${result.email}.`);
        form.reset();
      } else {
        setError(result?.error ?? "The account could not be created.");
      }
    } catch {
      setError("The account could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function onGrant(email) {
    const permission = String(grant[email] ?? "");
    if (!permission) return;
    const result = await run(
      () => grantExtraPermission(email, permission),
      `Granted ${permission} to ${email}.`,
    );
    if (result?.ok) {
      setStaff((current) =>
        current.map((row) =>
          row.email === email
            ? { ...row, extraPermissions: [...row.extraPermissions, permission] }
            : row,
        ),
      );
    }
  }

  async function onRevoke(email, permission) {
    const result = await run(
      () => revokeExtraPermission(email, permission),
      `Removed ${permission} from ${email}.`,
    );
    if (result?.ok) {
      setStaff((current) =>
        current.map((row) =>
          row.email === email
            ? { ...row, extraPermissions: row.extraPermissions.filter((p) => p !== permission) }
            : row,
        ),
      );
    }
  }

  async function onDeactivate() {
    const email = pendingTarget;
    const result = await run(
      () => deactivateStaffAccount(email),
      `${email} is no longer a staff account.`,
    );
    if (result?.ok) {
      setStaff((current) => current.filter((row) => row.email !== email));
    }
  }

  return (
    <div className="space-y-6">
      {notice ? (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-[13px] font-semibold text-success">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {/* ---------------- create staff account ---------------- */}
      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="staff-name" className="label-xs">
            Full name
          </label>
          <input
            id="staff-name"
            name="name"
            required
            placeholder="Nusrat Jahan"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="staff-email" className="label-xs">
            Work email
          </label>
          <input
            id="staff-email"
            name="email"
            type="email"
            required
            placeholder="name@company.com"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="staff-role" className="label-xs">
            Role
          </label>
          <select
            id="staff-role"
            name="role"
            defaultValue="staff_support"
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          >
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="staff-password" className="label-xs">
            Temporary password (10+ characters)
          </label>
          <input
            id="staff-password"
            name="password"
            type="password"
            required
            minLength={10}
            placeholder="At least 10 characters"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Working…" : "Create staff account"}
          </button>
          <p className="mt-2 text-[12px] leading-5 text-slate-500">
            The email is pre-verified so the account can sign in right away.
            Tell the person to change the password after first sign-in.
          </p>
        </div>
      </form>

      {/* ---------------- existing staff accounts ---------------- */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-surface text-left">
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Account
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Role
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Extra permissions
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.length ? (
              staff.map((row) => (
                <tr key={row.email} className="transition hover:bg-surface/70">
                  <td className="px-4 py-3">
                    <span className="block font-semibold text-ink">{row.name}</span>
                    <span className="block text-[12px] text-slate-500">{row.email}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{ROLE_LABELS[row.role] || row.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {row.extraPermissions.length ? (
                        row.extraPermissions.map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#0a5486]"
                          >
                            {permission}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => onRevoke(row.email, permission)}
                              aria-label={`Remove ${permission}`}
                              className="text-[#0a5486]/70 transition hover:text-red-600 disabled:opacity-50"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-[12px] text-slate-400">None</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Permission to grant ${row.email}`}
                        value={grant[row.email] ?? ""}
                        onChange={(event) =>
                          setGrant((current) => ({ ...current, [row.email]: event.target.value }))
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[12px] text-ink outline-none focus:border-primary"
                      >
                        <option value="">Add a permission…</option>
                        {GRANTABLE.filter(
                          (permission) => !row.extraPermissions.includes(permission),
                        ).map((permission) => (
                          <option key={permission} value={permission}>
                            {permission}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busy || !grant[row.email]}
                        onClick={() => onGrant(row.email)}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50"
                      >
                        Grant
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPendingTarget(row.email)}
                      className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                  No staff accounts yet — create the first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(pendingTarget)}
        title="Deactivate this staff account?"
        body="Their role is removed, every session ends and the account becomes a regular company member. This is recorded in the audit log."
        confirmLabel="Deactivate"
        busy={busy}
        onConfirm={onDeactivate}
        onCancel={() => setPendingTarget(null)}
      />
    </div>
  );
}
