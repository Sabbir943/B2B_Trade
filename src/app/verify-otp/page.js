"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { Button } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

const LENGTH = 6;

export default function VerifyOtpPage() {
  const inputs = useRef([]);
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const [status, setStatus] = useState("idle");

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

  const complete = digits.every(Boolean);

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
              Your account is confirmed. Continue to company onboarding to finish
              setting up your profile.
            </p>
            <Button href="/onboarding" variant="navy" className="mt-6 w-full">
              Continue to onboarding
            </Button>
          </>
        ) : (
          <>
            <p className="eyebrow-text">Verify your email</p>
            <h1 className="mt-3 font-display text-2xl font-bold text-primary">
              Enter the 6-digit code
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              We sent a code to your inbox. It expires in 10 minutes.
            </p>

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

            <Button
              variant="navy"
              className="mt-6 w-full"
              disabled={!complete}
              onClick={() => setStatus("done")}
            >
              {complete ? "Verify code" : "Enter all 6 digits"}
            </Button>

            <div className="mt-4 flex items-center justify-between text-[13px]">
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => setStatus("idle")}
              >
                Resend code
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
