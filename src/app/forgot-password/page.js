"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { Button, Field, Input } from "@/components/ui";
import { MailIcon } from "@/components/icons";
import { APP_NAME } from "@/lib/brand";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <BrandLogo className="mb-8" />

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {sent ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary">
              <MailIcon className="h-6 w-6" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold text-primary">
              Check your inbox
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              If an account exists for that address, a reset link is on its way.
              The link expires in 30 minutes.
            </p>
            <Button href="/sign-in" variant="navy" className="mt-6 w-full">
              Back to sign in
            </Button>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-3 w-full text-center text-[13px] font-semibold text-primary hover:underline"
            >
              Try a different address
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow-text">Account recovery</p>
            <h1 className="mt-3 font-display text-2xl font-bold text-primary">
              Reset your password
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the email on your {APP_NAME} account and we will send a
              reset link.
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setSent(true);
              }}
            >
              <Field label="Work email" required>
                <Input
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Button type="submit" variant="navy" className="w-full">
                Send reset link
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Remembered it?{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-[13px] text-slate-500">
        Trouble resetting?{" "}
        <Link href="/contact" className="font-semibold text-primary hover:underline">
          Contact support
        </Link>
      </p>
    </main>
  );
}
