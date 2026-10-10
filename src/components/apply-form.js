"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select, Textarea } from "./ui";
import { CheckIcon } from "./icons";
import { categories } from "@/lib/catalog";
import { submitMarketEntry } from "@/lib/member-actions";

/**
 * §7.6 Bangladesh Market Entry — application intake. Applications start at
 * the `submitted` stage; staff drive screening → call → proposal →
 * contract → active from the admin console.
 */
export default function ApplyForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const [form, setForm] = useState({
    company: "",
    website: "",
    category: "",
    market: "",
    name: "",
    email: "",
    details: "",
  });

  function set(key, value) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await submitMarketEntry(form);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(result.application);
    router.refresh();
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-success text-white">
          <CheckIcon className="h-5 w-5" />
        </span>
        <p className="mt-3 font-display text-lg font-bold text-emerald-800">Application received</p>
        <p className="mt-1 text-sm leading-6 text-emerald-700">
          Reference <span className="font-semibold">{done.id}</span>. A market-entry
          officer will contact you within two working days to schedule a scoping call.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href="/dashboard/market-entry" variant="navy" size="sm">
            Track application
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDone(null)}>
            Submit another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company / brand" required>
          <Input
            value={form.company}
            onChange={(event) => set("company", event.target.value)}
            placeholder="Legal entity name"
            required
          />
        </Field>
        <Field label="Website" hint="Optional">
          <Input value={form.website} onChange={(event) => set("website", event.target.value)} placeholder="https://" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" required>
          <Select value={form.category} onChange={(event) => set("category", event.target.value)} required>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.slug} value={category.name}>
                {category.name}
              </option>
            ))}
            <option>Other</option>
          </Select>
        </Field>
        <Field label="Target market" required>
          <Select value={form.market} onChange={(event) => set("market", event.target.value)} required>
            <option value="" disabled>
              Where will you sell?
            </option>
            <option>European Union</option>
            <option>United Kingdom</option>
            <option>North America</option>
            <option>GCC</option>
            <option>Asia-Pacific</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" required>
          <Input value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="Full name" required />
        </Field>
        <Field label="Work email" required>
          <Input
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
            type="email"
            placeholder="name@company.com"
            required
          />
        </Field>
      </div>

      <Field label="What are you looking to source or launch?" required>
        <Textarea
          rows={5}
          value={form.details}
          onChange={(event) => set("details", event.target.value)}
          placeholder="Products, approximate annual volume, timeline, certifications you require…"
          required
        />
      </Field>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="navy" disabled={saving}>
          {saving ? "Submitting…" : "Submit application"}
        </Button>
        <p className="text-[12px] text-slate-500">
          No fee to apply — fees only start when an engagement is agreed.
        </p>
      </div>
    </form>
  );
}
