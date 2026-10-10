"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select, Textarea } from "./ui";
import { CheckIcon } from "./icons";
import { categories } from "@/lib/catalog";
import { postBuyRequirement } from "@/lib/member-actions";

/**
 * §7.3.1 — buy requirement form. Posts are created in `pending` state and
 * only appear on the public board after staff moderation (12h SLA).
 */
export default function RfqForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const [form, setForm] = useState({
    product: "",
    category: "",
    quantity: "",
    unit: "kg",
    targetDate: "",
    destination: "",
    shippingTerms: "FOB",
    paymentTerms: "",
    hsCode: "",
    details: "",
  });

  function set(key, value) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await postBuyRequirement({
      product: form.product,
      category: form.category,
      quantity: form.quantity,
      unit: form.unit,
      targetDate: form.targetDate,
      destinationPort: form.destination,
      shippingTerms: form.shippingTerms,
      paymentTerms: form.paymentTerms,
      hsCode: form.hsCode,
      specs: form.details,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(result.requirement);
    router.refresh();
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-success text-white">
          <CheckIcon className="h-5 w-5" />
        </span>
        <p className="mt-3 font-display text-lg font-bold text-emerald-800">
          Requirement submitted
        </p>
        <p className="mt-1 text-sm leading-6 text-emerald-700">
          Reference <span className="font-semibold">{done.id}</span>. Moderation runs
          within 12 hours — once published, matching suppliers are notified
          automatically and quotes land in your dashboard inbox.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href="/dashboard/requirements" variant="navy" size="sm">
            Track in dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDone(null)}>
            Post another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product / material" required>
          <Input
            value={form.product}
            onChange={(event) => set("product", event.target.value)}
            placeholder="e.g. Steam sterilised white pepper"
            required
          />
        </Field>
        <Field label="Category" required>
          <Select value={form.category} onChange={(event) => set("category", event.target.value)} required>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Quantity" required>
          <Input
            value={form.quantity}
            onChange={(event) => set("quantity", event.target.value)}
            placeholder="e.g. 20,000"
            required
          />
        </Field>
        <Field label="Unit" required>
          <Select value={form.unit} onChange={(event) => set("unit", event.target.value)} required>
            <option>kg</option>
            <option>MT</option>
            <option>pcs</option>
            <option>rolls</option>
            <option>FCL</option>
          </Select>
        </Field>
        <Field label="Target date" required>
          <Input
            value={form.targetDate}
            onChange={(event) => set("targetDate", event.target.value)}
            type="date"
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Destination market" required>
          <Input
            value={form.destination}
            onChange={(event) => set("destination", event.target.value)}
            placeholder="e.g. Rotterdam, NL"
            required
          />
        </Field>
        <Field label="Incoterm">
          <Select value={form.shippingTerms} onChange={(event) => set("shippingTerms", event.target.value)}>
            <option>EXW</option>
            <option>FCA</option>
            <option>FOB</option>
            <option>CIF</option>
            <option>CFR</option>
            <option>DAP</option>
            <option>DDP</option>
          </Select>
        </Field>
        <Field label="HS code" hint="Optional — improves matching">
          <Input
            value={form.hsCode}
            onChange={(event) => set("hsCode", event.target.value)}
            placeholder="0904.11"
          />
        </Field>
      </div>

      <Field label="Payment terms" hint="Optional — e.g. LC at sight, 30% advance">
        <Input
          value={form.paymentTerms}
          onChange={(event) => set("paymentTerms", event.target.value)}
          placeholder="e.g. Irrevocable LC at sight"
        />
      </Field>

      <Field label="Specifications & requirements" required>
        <Textarea
          rows={5}
          value={form.details}
          onChange={(event) => set("details", event.target.value)}
          placeholder="Grades, packing, certifications, inspection expectations…"
          required
        />
      </Field>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent" disabled={saving}>
          {saving ? "Submitting…" : "Post Your Requirement"}
        </Button>
        <p className="text-[12px] text-slate-500">
          Free to post · your contact details stay hidden until you reply.
        </p>
      </div>
    </form>
  );
}
