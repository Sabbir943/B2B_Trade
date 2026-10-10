"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import BrandLogo from "@/components/brand-logo";
import { Button, Field, Input } from "@/components/ui";
import { CheckIcon, ShieldIcon } from "@/components/icons";

const LENGTH = 6;

/**
 * Hidden staff login (/secure-admin-login).
 *
 * Two steps, both required for Admin / Super-Admin:
 *   1. Email + password (better-auth session).
 *   2. 6-digit code emailed to the staff account (mandatory 2FA).
 *
 * This page is never linked from the public site. Visiting /admin without a
 * session lands here; the public /sign-in page has no staff affordances.
 */
export default function SecureAdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
          <BrandLogo className="mb-8" />
          <p className="text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <StaffLoginFlow />
    </Suspense>
  );
}

function StaffLoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = (searchParams.get("next") || "").trim();

  const [step, setStep] = useState("password"); // password | code | done
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [pending, setPending] = useState(false);
  const [devOtp, setDevOtp] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const inputs = useRef([]);

  // Auto-send the 2FA code the moment we land on step 2.
  const autoSent = useRef(false);
  useEffect(() => {
    if (step !== "code" || autoSent.current) return;
    autoSent.current = true;
    let cancelled = false;
    fetch("/api/staff-2fa/send", { method: "POST" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) throw new Error(data.error || "Could not send the code.");
        setCooldown(data.resendAfterSeconds ?? 60);
        setDevOtp(data.devOtp || null);
        setInfo(`We sent a 6-digit code to ${email}.`);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause.message);
      });
    return () => {
      cancelled = true;
    };
  }, [step, email]);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handlePassword(event) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const address = String(form.get("email") || "").trim().toLowerCase();
    const { error } = await authClient.signIn.email({
      email: address,
      password: form.get("password"),
      rememberMe: true,
    });

    if (error) {
      setPending(false);
      setError(error.message ?? "Invalid email or password.");
      return;
    }

    // Confirm this account actually holds a staff role before we continue.
    const { data } = await authClient.getSession();
    const role = data?.user?.role || "company_member";
    const staff =
      ["staff_verifier", "staff_support", "staff_content", "staff_sales", "super_admin"].includes(
        role,
      );

    if (!staff) {
      await authClient.signOut();
      setPending(false);
      setError("This sign-in is for staff accounts only. Use the member sign-in page.");
      return;
    }

    setEmail(address);
    setPending(false);
    setStep("code");
  }

  async function resend() {
    if (cooldown > 0) return;
    setError(null);
    try {
      const response = await fetch("/api/staff-2fa/send", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not send the code.");
      setCooldown(data.resendAfterSeconds ?? 60);
      setDevOtp(data.devOtp || null);
      setInfo(`We sent a new code to ${email}.`);
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function handleVerify() {
    const code = digits.join("");
    if (code.length !== LENGTH || pending) return;
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/staff-2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Wrong code. Try again.");
      setStep("done");
      const { data: session } = await authClient.getSession();
      const role = session?.user?.role;
      const destination = next || (role === "super_admin" ? "/console" : "/admin");
      setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 600);
    } catch (cause) {
      setError(cause.message);
      setDigits(Array(LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setPending(false);
    }
  }

  function update(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);
    if (digit && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(event, index) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function onPaste(event) {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!text) return;
    event.preventDefault();
    setDigits(Array.from({ length: LENGTH }, (_, i) => text[i] ?? ""));
    inputs.current[Math.min(text.length, LENGTH - 1)]?.focus();
  }

  const complete = digits.every(Boolean);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <BrandLogo className="mb-8" />

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {step === "password" ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldIcon className="h-6 w-6" />
            </span>
            <p className="eyebrow-text mt-4">Staff access</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-primary">
              Admin sign-in
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Authorised staff only. Every sign-in is checked against the staff
              directory and confirmed with a one-time code.
            </p>

            <form onSubmit={handlePassword} className="mt-6 space-y-4">
              <Field label="Work email" required>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="you@alliedone.com"
                />
              </Field>
              <Field label="Password" required>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Your password"
                />
              </Field>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              ) : null}

              <Button type="submit" variant="navy" disabled={pending} className="w-full">
                {pending ? "Checking…" : "Continue"}
              </Button>
            </form>

            <p className="mt-6 text-center text-[13px] text-slate-500">
              Not staff?{" "}
              <a href="/sign-in" className="font-semibold text-primary hover:underline">
                Member sign-in
              </a>
            </p>
          </>
        ) : step === "code" ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldIcon className="h-6 w-6" />
            </span>
            <p className="eyebrow-text mt-4">Two-factor check</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-primary">
              Enter your login code
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {info ?? `We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
            </p>

            {devOtp ? (
              <p className="mt-3 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
                Dev mode (email not configured) — your code is{" "}
                <strong className="font-bold tabular-nums">{devOtp}</strong>
              </p>
            ) : null}

            <div className="mt-6 flex justify-between gap-2" onPaste={onPaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputs.current[index] = element;
                  }}
                  value={digit}
                  onChange={(event) => update(index, event.target.value)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Digit ${index + 1}`}
                  className="h-12 w-11 rounded-lg border border-slate-300 bg-white text-center font-display text-lg font-bold text-ink transition focus:border-primary focus:outline-2 focus:outline-primary/40"
                />
              ))}
            </div>

            {error ? (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            ) : null}

            <Button
              variant="navy"
              className="mt-6 w-full"
              disabled={!complete || pending}
              onClick={handleVerify}
            >
              {pending ? "Verifying…" : complete ? "Verify and open admin" : "Enter all 6 digits"}
            </Button>

            <div className="mt-4 flex items-center justify-between text-[13px]">
              <button
                type="button"
                disabled={cooldown > 0}
                className="font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                onClick={resend}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
              <button
                type="button"
                className="font-semibold text-slate-500 hover:text-ink"
                onClick={() => {
                  setStep("password");
                  setDigits(Array(LENGTH).fill(""));
                  setError(null);
                }}
              >
                Use a different account
              </button>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success text-white">
              <CheckIcon className="h-6 w-6" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold text-primary">
              Signed in
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Opening the admin workspace…
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
