"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Field, Input, Select, Textarea } from "./ui";
import { submitProductListing } from "@/lib/member-actions";
import { INCOTERMS } from "@/lib/trade-constants";

/**
 * §7.2.1 — required listing fields (title, category, description, MOQ,
 * price range, Incoterm, images). Currency is not editable: it is forced
 * server-side from the company profile.
 */
export default function ListingForm({ categories = [], currency = "USD", origin = "", onCancel }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: "",
    category: "",
    subcategory: "",
    hsCode: "",
    description: "",
    moq: "",
    priceMin: "",
    priceMax: "",
    incoterm: "FOB",
    capacity: "",
    originCountry: origin || "Bangladesh",
    images: "",
  });

  function set(key, value) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      priceMin: Number(form.priceMin),
      priceMax: Number(form.priceMax === "" ? form.priceMin : form.priceMax),
      images: form.images
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    };

    const result = await submitProductListing(payload);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
    if (onCancel) onCancel();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label-xs">New listing</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Goes to moderation before buyers see it · prices in{" "}
            <strong className="text-ink">{currency}</strong>
          </p>
        </div>
        <Badge tone="navy">{currency}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product title" required>
          <Input
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="e.g. Steam-dried turmeric powder, 50kg bags"
            required
          />
        </Field>
        <Field label="Category" required>
          <Select value={form.category} onChange={(event) => set("category", event.target.value)} required>
            <option value="">Select…</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Subcategory">
          <Input
            value={form.subcategory}
            onChange={(event) => set("subcategory", event.target.value)}
            placeholder="e.g. Turmeric"
          />
        </Field>
        <Field label="HS code" hint="Helps matching">
          <Input
            value={form.hsCode}
            onChange={(event) => set("hsCode", event.target.value)}
            placeholder="0910.30"
          />
        </Field>
        <Field label="Incoterm" required>
          <Select value={form.incoterm} onChange={(event) => set("incoterm", event.target.value)}>
            {INCOTERMS.map((term) => (
              <option key={term}>{term}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Description" required hint="Specs, grades, certifications, packing — at least 20 characters">
        <Textarea
          rows={5}
          value={form.description}
          onChange={(event) => set("description", event.target.value)}
          placeholder="Grade, moisture, mesh size, certifications (ISO, HALAL, organic), pallet configuration…"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="MOQ" required>
          <Input
            value={form.moq}
            onChange={(event) => set("moq", event.target.value)}
            placeholder="e.g. 1 × 40' HC"
            required
          />
        </Field>
        <Field label={`Min price (${currency})`} required>
          <Input
            value={form.priceMin}
            onChange={(event) => set("priceMin", event.target.value)}
            inputMode="decimal"
            placeholder="e.g. 820"
            required
          />
        </Field>
        <Field label={`Max price (${currency})`} required>
          <Input
            value={form.priceMax}
            onChange={(event) => set("priceMax", event.target.value)}
            inputMode="decimal"
            placeholder="e.g. 910"
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Supply capacity" hint="Optional">
          <Input
            value={form.capacity}
            onChange={(event) => set("capacity", event.target.value)}
            placeholder="e.g. 800 MT / month"
          />
        </Field>
        <Field label="Origin country">
          <Input
            value={form.originCountry}
            onChange={(event) => set("originCountry", event.target.value)}
          />
        </Field>
      </div>

      <Field label="Image URLs" hint="Optional — one URL per line, max 5">
        <Textarea
          rows={3}
          value={form.images}
          onChange={(event) => set("images", event.target.value)}
          placeholder="https://…"
        />
      </Field>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        <Button type="submit" variant="navy" disabled={saving}>
          {saving ? "Submitting…" : "Submit for review"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
