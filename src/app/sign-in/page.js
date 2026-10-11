"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { homeFor } from "@/lib/permissions";
import BrandLogo from "@/components/brand-logo";
import { Button, Field, Input } from "@/components/ui";
import { APP_NAME } from "@/lib/brand";

function VerifiedFlash() {
  const searchParams = useSearchParams();
  if (searchParams.get("verified") !== "1") return null;
  return (
    <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      Email verified — sign in to continue.
    </p>
  );
}

function SuspendedFlash() {
  const searchParams = useSearchParams();
  if (searchParams.get("suspended") !== "1") return null;
  return (
    <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
      This account has been suspended. Contact support if you think this is a
      mistake.
    </p>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = (searchParams.get("next") || "").trim();

  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [unverified, setUnverified] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const { error } = await authClient.signIn.email({
      email,
      password: form.get("password"),
      rememberMe: true,
    });

    if (error) {
      setPending(false);
      if (
        error.code === "EMAIL_NOT_VERIFIED" ||
        /not verified/i.test(error.message ?? "")
      ) {
        setUnverified(email);
        return;
      }
      // The session hook in auth.js refuses new sessions for suspended
      // accounts, which surfaces as a session-creation failure.
      if (
        error.code === "FAILED_TO_CREATE_SESSION" ||
        /failed to create session/i.test(error.message ?? "")
      ) {
        setError(
          "This account has been suspended. Contact support if you think this is a mistake.",
        );
        return;
      }
      setError(error.message ?? "Invalid email or password.");
      return;
    }

    // Land on the requested page (dashboard paths only — staff areas are
    // gated separately and never carry a `next` from the public site),
    // otherwise the role's home area.
    let destination = next || "/dashboard";
    if (!next) {
      const { data } = await authClient.getSession();
      destination = homeFor(data?.user?.role || "company_member");
    }

    router.push(destination);
    router.refresh();
  }

  return (
    <>
      <p className="eyebrow-text">Member access</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-primary">
        Welcome back
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Sign in to continue to {APP_NAME} — your inquiries, listings and trade
        records are waiting.
      </p>

      <Suspense fallback={null}>
        <VerifiedFlash />
        <SuspendedFlash />
      </Suspense>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-ink">
              Password<span className="text-danger">*</span>
            </span>
            <Link
              href="/forgot-password"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
          />
        </div>

        {unverified ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3">
            <p className="text-sm font-semibold text-amber-900">
              Email not verified yet
            </p>
            <p className="mt-1 text-[13px] leading-5 text-amber-800">
              Enter the 6-digit code we&apos;ll email to{" "}
              <strong>{unverified}</strong> to activate your account, then
              sign in.
            </p>
            <Button
              type="button"
              variant="navy"
              size="sm"
              className="mt-3 w-full"
              onClick={() =>
                router.push(
                  `/verify-otp?email=${encodeURIComponent(unverified)}&new=1`,
                )
              }
            >
              Send verification code
            </Button>
          </div>
        ) : error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="navy"
          disabled={pending}
          className="w-full"
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        No account yet?{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-primary hover:underline"
        >
          Join Free
        </Link>
      </p>
    </>
  );
}

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <BrandLogo className="mb-8" />

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-[13px] text-slate-500">
        Trouble signing in?{" "}
        <Link href="/contact" className="font-semibold text-primary hover:underline">
          Contact support
        </Link>
      </p>
    </main>
  );
}
