"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BrandLogo from "@/components/brand-logo";
import { Button } from "@/components/ui";
import { CheckIcon } from "@/components/icons";
import { sendOtp, verifyOtp } from "@/lib/backend";

const LENGTH = 6;

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
          <BrandLogo className="mb-8" />
          <p className="text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const address = (searchParams.get("email") || "").trim().toLowerCase();
  const isNew = searchParams.get("new") === "1";
  const next = (searchParams.get("next") || "").trim();

  // Where "Continue" goes after a successful verification.
  const continueHref = (() => {
    const params = new URLSearchParams();
    if (isNew) {
      // New members finish onboarding first — sign-in will bounce there.
      params.set("next", next || "/onboarding");
    } else if (next) {
      params.set("next", next);
    }
    params.set("verified", "1");
    return `/sign-in?${params.toString()}`;
  })();

  const inputs = useRef([]);
  const autoSent = useRef(false);
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const [status, setStatus] = useState("idle");
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  // First visit from sign-up / sign-in: email the code right away.
  useEffect(() => {
    if (!isNew || !address || autoSent.current) return;
    autoSent.current = true;
    let cancelled = false;
    sendOtp(address)
      .then((data) => {
        if (cancelled) return;
        setCooldown(data.resendAfterSeconds ?? 60);
        setDevOtp(data.devOtp || null);
        setInfo(`We sent a 6-digit code to ${address}.`);
      })
      .catch((cause) => {
        if (cancelled) return;
        if (cause.status === 429) setCooldown(cause.data?.retryAfterSeconds ?? 15);
        setError(cause.message);
      });
    return () => {
      cancelled = true;
    };
  }, [isNew, address]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function dispatchSend() {
    if (!address || sending) return;
    setSending(true);
    setError(null);
    setInfo(null);
    try {
      const data = await sendOtp(address);
      setCooldown(data.resendAfterSeconds ?? 60);
      setDevOtp(data.devOtp || null);
      setInfo(`We sent a 6-digit code to ${address}.`);
    } catch (cause) {
      if (cause.status === 429) setCooldown(cause.data?.retryAfterSeconds ?? 15);
      setError(cause.message);
    } finally {
      setSending(false);
    }
  }

  function update(index, value) {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((state) => {
      const next = [...state];
      next[index] = clean;
      return next;
    });
    if (clean && index < LENGTH - 1) inputs.current[index + 1]?.focus();
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

  async function handleVerify() {
    if (!complete || pending) return;
    setPending(true);
    setError(null);
    try {
      await verifyOtp(address, digits.join(""));
      setStatus("done");
    } catch (cause) {
      setError(cause.message);
      setDigits(Array(LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setPending(false);
    }
  }

  const complete = digits.every(Boolean);

  if (!address) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
        <BrandLogo className="mb-8" />
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="eyebrow-text">Verify your email</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-primary">
            Missing email address
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Open this page from sign-up or sign-in so we know which address to
            verify.
          </p>
          <div className="mt-6 flex gap-3">
            <Button href="/sign-in" variant="navy" className="flex-1">
              Sign in
            </Button>
            <Button href="/sign-up" variant="outline" className="flex-1">
              Join Free
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <BrandLogo className="mb-8" />

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {status === "done" ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-success text-white">
              <CheckIcon className="h-6 w-6" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold text-primary">
              Email verified
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isNew
                ? "Your account is confirmed. Sign in to finish setting up your company profile."
                : "Your account is confirmed. Sign in with your email and password to continue."}
            </p>
            <Button href={continueHref} variant="navy" className="mt-6 w-full">
              Continue to sign in
            </Button>
            {isNew ? (
              <Button href="/sign-in?verified=1" variant="outline" className="mt-3 w-full">
                Skip onboarding for now
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <p className="eyebrow-text">Verify your email</p>
            <h1 className="mt-3 font-display text-2xl font-bold text-primary">
              Enter the 6-digit code
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {info ?? `We sent a code to ${address}. It expires in 10 minutes.`}
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
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <Button
              variant="navy"
              className="mt-6 w-full"
              disabled={!complete || pending}
              onClick={handleVerify}
            >
              {pending
                ? "Verifying…"
                : complete
                  ? "Verify code"
                  : "Enter all 6 digits"}
            </Button>

            <div className="mt-4 flex items-center justify-between text-[13px]">
              <button
                type="button"
                disabled={cooldown > 0 || sending}
                className="font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:no-underline"
                onClick={dispatchSend}
              >
                {cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : sending
                    ? "Sending…"
                    : "Resend code"}
              </button>
              <span className="text-slate-400">Code valid for 10 minutes</span>
            </div>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-[13px] text-slate-500">
        Wrong address?{" "}
        <Link href="/sign-up" className="font-semibold text-primary hover:underline">
          Create a new account
        </Link>
      </p>
    </main>
  );
}
