"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { Badge, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { ArrowRightIcon, CheckIcon, ShieldIcon } from "@/components/icons";
import { categories } from "@/lib/catalog";

const STEPS = ["Company", "Trade focus", "Verification"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    company: "",
    role: "Supplier",
    country: "Bangladesh",
    category: "",
    volume: "",
    about: "",
    verify: "company",
  });

  function set(key, value) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <BrandLogo className="mb-8 justify-center" />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {done ? (
            <div className="py-6 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success text-white">
                <CheckIcon className="h-7 w-7" />
              </span>
              <h1 className="mt-5 font-display text-2xl font-bold text-primary">
                You are all set
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Your workspace is ready. Start by listing a product or posting a
                buy requirement — verification can run alongside.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button href="/dashboard" variant="navy">
                  Open dashboard
                </Button>
                <Button href="/dashboard/products" variant="navy">
                  List a product
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow-text">Account setup</p>
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
                      <Field label="Company name" required>
                        <Input
                          value={form.company}
                          onChange={(event) => set("company", event.target.value)}
                          placeholder="Legal entity name"
                          required
                        />
                      </Field>
                      <Field label="I am a" required>
                        <Select value={form.role} onChange={(event) => set("role", event.target.value)}>
                          <option>Supplier</option>
                          <option>Buyer</option>
                          <option>Both</option>
                        </Select>
                      </Field>
                    </div>
                    <Field label="Country" required>
                      <Select value={form.country} onChange={(event) => set("country", event.target.value)}>
                        <option>Bangladesh</option>
                        <option>Germany</option>
                        <option>Netherlands</option>
                        <option>United Kingdom</option>
                        <option>United Arab Emirates</option>
                        <option>United States</option>
                      </Select>
                    </Field>
                  </>
                ) : null}

                {step === 1 ? (
                  <>
                    <Field label="Primary category" required>
                      <Select
                        value={form.category}
                        onChange={(event) => set("category", event.target.value)}
                        required
                      >
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
                    <Field label="Annual trade volume" hint="Rough estimate is fine">
                      <Select
                        value={form.volume}
                        onChange={(event) => set("volume", event.target.value)}
                      >
                        <option value="">Prefer not to say</option>
                        <option>Under $100k</option>
                        <option>$100k – $500k</option>
                        <option>$500k – $2M</option>
                        <option>Over $2M</option>
                      </Select>
                    </Field>
                    <Field label="What are you trading?">
                      <Textarea
                        rows={4}
                        value={form.about}
                        onChange={(event) => set("about", event.target.value)}
                        placeholder="Products, destination markets, certifications…"
                      />
                    </Field>
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <p className="text-sm leading-6 text-slate-600">
                      Verification is free for company checks. You can complete it
                      later from the dashboard.
                    </p>
                    <div className="space-y-3">
                      {[
                        {
                          key: "company",
                          title: "Verify my company now",
                          text: "Submit registration details and receive the Verified badge in about 48 hours.",
                          icon: ShieldIcon,
                        },
                        {
                          key: "later",
                          title: "Do this later",
                          text: "Browse and trade right away — add verification whenever you are ready.",
                          icon: ArrowRightIcon,
                        },
                      ].map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => set("verify", option.key)}
                          className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                            form.verify === option.key
                              ? "border-primary bg-primary/5"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span
                            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                              form.verify === option.key
                                ? "bg-primary text-white"
                                : "bg-surface text-secondary"
                            }`}
                          >
                            <option.icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-bold text-ink">
                              {option.title}
                            </span>
                            <span className="mt-0.5 block text-[13px] leading-6 text-slate-600">
                              {option.text}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  disabled={step === 0}
                >
                  Back
                </Button>
                <Button
                  variant={step === STEPS.length - 1 ? "accent" : "navy"}
                  onClick={() => {
                    if (step === STEPS.length - 1) setDone(true);
                    else setStep((value) => value + 1);
                  }}
                  disabled={step === 0 && !form.company}
                >
                  {step === STEPS.length - 1 ? "Finish setup" : "Continue"}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-[13px] text-slate-500">
          Need help?{" "}
          <Link href="/contact" className="font-semibold text-primary hover:underline">
            Talk to support
          </Link>
        </p>
      </div>
    </main>
  );
}
