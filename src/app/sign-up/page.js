"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import BrandLogo from "@/components/brand-logo";
import { Button, Field, Input } from "@/components/ui";
import { CheckIcon } from "@/components/icons";
import { APP_NAME } from "@/lib/brand";

const perks = [
  "Post buy requirements and receive quotes",
  "List products with HS-coded discovery",
  "Free company verification badge",
];

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const { error } = await authClient.signUp.email({
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    });

    setPending(false);

    if (error) {
      setError(error.message ?? "Could not create your account.");
      return;
    }

    const address = String(form.get("email") || "").trim().toLowerCase();
    router.push(`/verify-otp?email=${encodeURIComponent(address)}&new=1`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <BrandLogo className="mb-8" />

      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="eyebrow-text">Free forever plan</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-primary">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Join {APP_NAME} as a buyer, supplier or both — no card required.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Full name" required>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Ayesha Khan"
              />
            </Field>

            <Field label="Work email" required>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
              />
            </Field>

            <Field label="Password" hint="At least 8 characters" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Create a password"
              />
            </Field>

            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="accent"
              disabled={pending}
              className="w-full"
            >
              {pending ? "Creating account…" : "Join Free"}
            </Button>

            <p className="text-[12px] leading-5 text-slate-500">
              By joining you agree to the{" "}
              <Link href="/legal/terms" className="font-semibold text-primary hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already a member?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <aside className="rounded-2xl bg-primary p-6 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
            What you get
          </p>
          <ul className="mt-4 space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex gap-2.5 text-sm leading-6 text-white/85">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15 text-white">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                {perk}
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-3 border-t border-white/15 pt-5 text-[13px] leading-6 text-white/70">
            <p>
              Upgrades later if you need them: unlimited contacts, featured
              listings and desk hours.
            </p>
            <Link
              href="/membership"
              className="inline-block font-semibold text-white underline underline-offset-4"
            >
              See membership plans
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
