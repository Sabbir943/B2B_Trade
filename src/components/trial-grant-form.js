"use client";

import { useState } from "react";
import { Button, Field, Input } from "./ui";
import { grantSilverTrial } from "../lib/actions";

/**
 * Grants the configured free Silver trial to one supplier account.
 * Server action re-checks the admin.members permission, refuses accounts that
 * already hold a paid tier and writes an audit entry.
 */
export default function TrialGrantForm({ months, country }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");

    setPending(true);
    setResult(null);
    try {
      const response = await grantSilverTrial(email);
      setResult(response);
      if (response.ok) event.currentTarget.reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field
        label="Member email"
        hint={`${months}-month free Silver trial — grant only to selected ${country} suppliers.`}
      >
        <Input
          name="email"
          type="email"
          required
          placeholder="supplier@company.com"
          autoComplete="off"
        />
      </Field>

      <Button type="submit" variant="navy" size="sm" disabled={pending} className="w-full">
        {pending ? "Granting…" : `Grant ${months}-month Silver trial`}
      </Button>

      {result ? (
        <p
          className={`text-[13px] leading-6 ${result.ok ? "text-success" : "text-red-600"}`}
          role="status"
        >
          {result.ok
            ? `Trial active for ${result.email} until ${new Date(result.until).toLocaleDateString(
                "en-GB",
                { day: "2-digit", month: "short", year: "numeric" },
              )}. Written to the audit log.`
            : result.error}
        </p>
      ) : null}
    </form>
  );
}
