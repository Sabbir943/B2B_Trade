"use client";

import { useState } from "react";
import { Button } from "./ui";
import { assignStaffRole } from "../lib/actions";
import { ROLES, ROLE_LABELS } from "../lib/permissions";

const ASSIGNABLE = [
  ROLES.COMPANY_MEMBER,
  ROLES.BRAND_PARTNER,
  ROLES.VERIFICATION_PARTNER,
  ROLES.STAFF_VERIFIER,
  ROLES.STAFF_SUPPORT,
  ROLES.STAFF_CONTENT,
  ROLES.STAFF_SALES,
  ROLES.SUPER_ADMIN,
];

export default function RoleAssignForm() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const role = String(data.get("role") ?? "");

    setPending(true);
    setResult(null);
    try {
      const response = await assignStaffRole(email, role);
      setResult(response);
      if (response.ok) event.currentTarget.reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="assign-email" className="label-xs">
          Account email
        </label>
        <input
          id="assign-email"
          name="email"
          type="email"
          required
          placeholder="name@company.com"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="assign-role" className="label-xs">
          New role
        </label>
        <select
          id="assign-role"
          name="role"
          defaultValue={ROLES.STAFF_SUPPORT}
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        >
          {ASSIGNABLE.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="navy" size="sm" disabled={pending} className="w-full">
        {pending ? "Assigning…" : "Assign role"}
      </Button>

      {result ? (
        <p
          className={`text-[13px] leading-6 ${
            result.ok ? "text-success" : "text-red-600"
          }`}
        >
          {result.ok
            ? `Role updated for ${result.email} → ${ROLE_LABELS[result.role]}. Written to the audit log.`
            : result.error}
        </p>
      ) : null}

      <p className="text-[12px] leading-5 text-slate-500">
        Assignment runs on the server: only the Super Admin can reach this page,
        only one Super Admin can exist, and every change is audited.
      </p>
    </form>
  );
}
