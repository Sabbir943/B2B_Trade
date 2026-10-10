"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/brand-logo";
import { Badge, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { ArrowRightIcon, CheckIcon, ShieldIcon } from "@/components/icons";
import {
  saveCompanyProfile,
  sendPhoneVerificationCode,
  verifyPhoneVerificationCode,
} from "@/lib/member-actions";

const STEPS = ["Company", "Contact & trade", "Review"];

/**
 * Onboarding wizard (spec §7.1).
 *   · Company details → currency follows the country (BDT for Bangladesh,
 *     USD otherwise) and members cannot change it.
 *   · Phone OTP verification alongside the email OTP from sign-up.
 *   · Completeness meter preview — under 70% the profile ranks lower.
 */
export default function OnboardingWizard({
  email,
  name,
  profile,
  meter: initialMeter,
  businessTypes,
  categories,
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [meter, setMeter] = useState(initialMeter);
  const [form, setForm] = useState({
    legalName: profile.legalName || "",
    country: profile.country || "Bangladesh",
    city: profile.city || "",
    businessType: profile.businessType || "",
    yearEstablished: profile.yearEstablished || "",
    website: profile.website || "",
    phone: profile.phone || "",
    categories: profile.categories || [],
    about: profile.about || "",
    tradeVolume: profile.tradeVolume || "",
  });
  const [phone, setPhone] = useState({
    sent: false,
    verifying: false,
    devOtp: null,
    code: "",
    verified: Boolean(profile.phoneVerified),
    error: null,
    info: null,
  });

  const currency = form.country === "Bangladesh" ? "BDT" : "USD";
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  function set(key, value) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  function toggleCategory(slug) {
    setForm((state) => ({
      ...state,
      categories: state.categories.includes(slug)
        ? state.categories.filter((item) => item !== slug)
        : [...state.categories, slug].slice(0, 5),
    }));
  }

  async function persist() {
    setSaving(true);
    setError(null);
    const result = await saveCompanyProfile({ ...form, email });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    setMeter(result.completeness);
    return result;
  }

  async function handleNext() {
    if (step === 0 && (!form.legalName.trim() || !form.country || !form.city.trim())) {
      setError("Legal name, country and city are required.");
      return;
    }
    const saved = await persist();
    if (!saved) return;
    setStep((value) => Math.min(STEPS.length - 1, value + 1));
  }

  async function handleFinish() {
    const saved = await persist();
    if (!saved) return;
    router.push("/dashboard");
  }

  async function sendCode() {
    setPhone((state) => ({ ...state, error: null, info: null }));
    if (!form.phone.trim()) {
      setPhone((state) => ({ ...state, error: "Enter your phone number first." }));
      return;
    }
    const result = await sendPhoneVerificationCode(form.phone);
    if (!result.ok) {
      setPhone((state) => ({ ...state, error: result.error }));
      return;
    }
    setPhone((state) => ({
      ...state,
      sent: true,
      devOtp: result.devOtp || null,
      info: `Code sent to ${result.phone}.`,
    }));
  }

  async function verifyCode() {
    setPhone((state) => ({ ...state, verifying: true, error: null }));
    const result = await verifyPhoneVerificationCode(phone.code);
    setPhone((state) => ({ ...state, verifying: false }));
    if (!result.ok) {
      setPhone((state) => ({ ...state, error: result.error }));
      return;
    }
    setPhone((state) => ({ ...state, verified: true, sent: false, code: "", devOtp: null, info: null }));
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <BrandLogo className="mb-8 justify-center" />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow-text">Account setup{email ? ` · ${email}` : ""}</p>
              <h1 className="mt-3 font-display text-xl font-bold text-primary">
                {STEPS[step]}
              </h1>
            </div>
            <Badge tone="navy">
              Step {step + 1} of {STEPS.length}
            </Badge>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-6 space-y-4">
            {step === 0 ? (
              <>
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
                    <Select
                      value={form.businessType}
                      onChange={(event) => set("businessType", event.target.value)}
                    >
                      <option value="">Select…</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Country" required hint="Sets your account currency">
                    <Select
                      value={form.country}
                      onChange={(event) => set("country", event.target.value)}
                      required
                    >
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
                    <Input
                      value={form.city}
                      onChange={(event) => set("city", event.target.value)}
                      placeholder="e.g. Chattogram"
                      required
                    />
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
                  <Field label="Website" hint="Optional">
                    <Input
                      value={form.website}
                      onChange={(event) => set("website", event.target.value)}
                      placeholder="https://"
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-[13px] text-slate-600">
                    Account currency — set by country, not editable
                  </span>
                  <Badge tone={currency === "BDT" ? "amber" : "navy"}>{currency}</Badge>
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <Field
                  label="Phone number"
                  hint="Verified by SMS code — used for account recovery and trading alerts"
                >
                  <div className="flex gap-2">
                    <Input
                      value={form.phone}
                      onChange={(event) => set("phone", event.target.value)}
                      placeholder="+880 1XXX XXXXXX"
                      disabled={phone.verified}
                    />
                    {phone.verified ? (
                      <Badge tone="green">Verified</Badge>
                    ) : (
                      <Button
                        variant="navy"
                        size="sm"
                        onClick={sendCode}
                        disabled={phone.sent}
                        className="shrink-0"
                      >
                        Send code
                      </Button>
                    )}
                  </div>
                </Field>

                {phone.sent && !phone.verified ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[13px] font-semibold text-ink">
                      Enter the 6-digit code
                    </p>
                    {phone.info ? (
                      <p className="mt-1 text-[12px] text-slate-500">{phone.info}</p>
                    ) : null}
                    {phone.devOtp ? (
                      <p className="mt-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
                        Dev mode (SMS not configured) — your code is{" "}
                        <strong className="font-bold tabular-nums">{phone.devOtp}</strong>
                      </p>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      <Input
                        value={phone.code}
                        onChange={(event) =>
                          setPhone((state) => ({
                            ...state,
                            code: event.target.value.replace(/\D/g, "").slice(0, 6),
                          }))
                        }
                        inputMode="numeric"
                        placeholder="123456"
                        maxLength={6}
                        className="max-w-[160px] tracking-[0.3em]"
                      />
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={verifyCode}
                        disabled={phone.code.length !== 6 || phone.verifying}
                      >
                        {phone.verifying ? "Verifying…" : "Verify"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {phone.error ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {phone.error}
                  </p>
                ) : null}

                <Field label="Main categories" hint="Pick up to 5 — buyers search by these">
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
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="What are you trading?">
                  <Textarea
                    rows={4}
                    value={form.about}
                    onChange={(event) => set("about", event.target.value)}
                    placeholder="Products, destination markets, certifications…"
                  />
                </Field>

                <Field label="Annual trade volume" hint="Rough estimate is fine">
                  <Select
                    value={form.tradeVolume}
                    onChange={(event) => set("tradeVolume", event.target.value)}
                  >
                    <option value="">Prefer not to say</option>
                    <option>Under $100k</option>
                    <option>$100k – $500k</option>
                    <option>$500k – $2M</option>
                    <option>Over $2M</option>
                  </Select>
                </Field>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-ink">Profile completeness</p>
                    <Badge tone={meter.percent >= 70 ? "green" : "amber"}>
                      {meter.percent}%
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${meter.percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600">
                    {meter.percent >= 70
                      ? "Your profile ranks normally in supplier search."
                      : `Profiles under 70% rank lower in search. Still missing: ${meter.missing.join(", ") || "nothing"}.`}
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <div className="text-[13px] leading-6 text-slate-600">
                    <p className="font-semibold text-ink">Verification can run alongside</p>
                    <p>
                      Trade licence, tax ID and address proof go to the Verification
                      Queue — badges show the award date and method on your profile.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 text-[13px] text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span>Company</span>
                    <span className="font-semibold text-ink">{form.legalName || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-2">
                    <span>Location</span>
                    <span className="font-semibold text-ink">
                      {[form.city, form.country].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span>Currency</span>
                    <span className="font-semibold text-ink">{currency}</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          ) : null}

          <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0 || saving}
            >
              Back
            </Button>
            <div className="flex items-center gap-3">
              {saving ? (
                <span className="text-[13px] text-slate-500">Saving…</span>
              ) : null}
              <Button
                variant={step === STEPS.length - 1 ? "accent" : "navy"}
                onClick={step === STEPS.length - 1 ? handleFinish : handleNext}
                disabled={saving}
              >
                {step === STEPS.length - 1 ? "Finish setup" : "Continue"}
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[13px] text-slate-500">
          Signed up as {name || email} · already complete?{" "}
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="font-semibold text-primary hover:underline"
          >
            Go to dashboard
          </button>
        </p>
      </div>
    </main>
  );
}
