"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select, Textarea, Badge } from "./ui";
import { saveCompanyProfile } from "@/lib/member-actions";
import { BUSINESS_TYPES as PROFILE_BUSINESS_TYPES } from "@/lib/trade-constants";

/**
 * Company details editor (spec §7.1.2–3). The country select is the only
 * way currency changes — it is derived server-side (Bangladesh → BDT, else
 * USD) and shown read-only here, so members cannot pick their own currency.
 */
export default function ProfileForm({ user = {}, profile = {}, categories = [], categoriesById = {} }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [meter, setMeter] = useState(null);
  const [form, setForm] = useState({
    legalName: profile.legalName || "",
    country: profile.country || "Bangladesh",
    city: profile.city || "",
    businessType: profile.businessType || "",
    yearEstablished: profile.yearEstablished || "",
    website: profile.website || "",
    phone: profile.phone || "",
    about: profile.about || "",
    tradeVolume: profile.tradeVolume || "",
    categories: profile.categories || [],
  });

  const currency = form.country === "Bangladesh" ? "BDT" : "USD";

  function set(key, value) {
    setSaved(false);
    setForm((state) => ({ ...state, [key]: value }));
  }

  function toggleCategory(slug) {
    setSaved(false);
    setForm((state) => ({
      ...state,
      categories: state.categories.includes(slug)
        ? state.categories.filter((item) => item !== slug)
        : [...state.categories, slug].slice(0, 5),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await saveCompanyProfile(form);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    setMeter(result.completeness);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Legal company name" required>
          <Input
            value={form.legalName}
            onChange={(event) => set("legalName", event.target.value)}
            placeholder="Legal entity name"
            required
          />
        </Field>
        <Field label="Business type">
          <Select value={form.businessType} onChange={(event) => set("businessType", event.target.value)}>
            <option value="">Select…</option>
            {PROFILE_BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country" required hint={`Account currency: ${currency} (set by country)`}>
          <Select value={form.country} onChange={(event) => set("country", event.target.value)} required>
            <option>Bangladesh</option>
            <option>Germany</option>
            <option>Netherlands</option>
            <option>United Kingdom</option>
            <option>United Arab Emirates</option>
            <option>United States</option>
            <option>India</option>
            <option>Pakistan</option>
            <option>Turkey</option>
            <option>Vietnam</option>
          </Select>
        </Field>
        <Field label="City" required>
          <Input value={form.city} onChange={(event) => set("city", event.target.value)} placeholder="e.g. Dhaka" required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Year established">
          <Input
            value={form.yearEstablished}
            onChange={(event) => set("yearEstablished", event.target.value)}
            inputMode="numeric"
            placeholder="e.g. 2005"
          />
        </Field>
        <Field label="Website">
          <Input value={form.website} onChange={(event) => set("website", event.target.value)} placeholder="https://" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" hint={profile.phoneVerified ? "Verified" : "Verify from onboarding"}>
          <Input
            value={form.phone}
            onChange={(event) => set("phone", event.target.value)}
            placeholder="+880 1XXX XXXXXX"
          />
        </Field>
        <Field label="Annual trade volume">
          <Select value={form.tradeVolume} onChange={(event) => set("tradeVolume", event.target.value)}>
            <option value="">Prefer not to say</option>
            <option>Under $100k</option>
            <option>$100k – $500k</option>
            <option>$500k – $2M</option>
            <option>Over $2M</option>
          </Select>
        </Field>
      </div>

      <Field label="Main categories" hint="Up to 5 — these drive matching and search">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = form.categories.includes(category.slug);
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => toggleCategory(category.slug)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-primary hover:text-primary"
                }`}
              >
                {categoriesById[category.slug]?.name || category.name}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Company description" hint="What you trade, where, and any certifications">
        <Textarea
          rows={5}
          value={form.about}
          onChange={(event) => set("about", event.target.value)}
          placeholder="Products, destination markets, certifications…"
        />
      </Field>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

      {saved && meter ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <span className="text-[13px] font-semibold text-emerald-800">Profile saved</span>
          <Badge tone={meter.percent >= 70 ? "green" : "amber"}>{meter.percent}% complete</Badge>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="navy" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setForm({
            legalName: profile.legalName || "",
            country: profile.country || "Bangladesh",
            city: profile.city || "",
            businessType: profile.businessType || "",
            yearEstablished: profile.yearEstablished || "",
            website: profile.website || "",
            phone: profile.phone || "",
            about: profile.about || "",
            tradeVolume: profile.tradeVolume || "",
            categories: profile.categories || [],
          })}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
