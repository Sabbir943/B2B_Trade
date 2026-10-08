"use client";

import { useState } from "react";
import { Button, Field, Input, Textarea } from "./ui";

export default function InquiryForm({ subject, compact = false }) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="font-display text-[15px] font-bold text-emerald-800">
          Inquiry sent
        </p>
        <p className="mt-1 text-[13px] leading-6 text-emerald-700">
          Your message about <span className="font-semibold">{subject}</span> is on
          its way. Replies arrive in your inbox — typically within a few hours.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setSent(false)}
        >
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
      className="space-y-3"
    >
      {!compact ? (
        <p className="label-xs">Send an inquiry</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input name="name" placeholder="Your name" required />
        </Field>
        <Field label="Company" required>
          <Input name="company" placeholder="Company name" required />
        </Field>
      </div>
      <Field label="Work email" required>
        <Input name="email" type="email" placeholder="name@company.com" required />
      </Field>
      <Field label="Quantity required" hint="Include unit and target date if known">
        <Input name="quantity" placeholder="e.g. 5,000 kg — November" />
      </Field>
      <Field label="Message" required>
        <Textarea
          name="message"
          rows={compact ? 3 : 4}
          placeholder={
            subject
              ? `Ask about ${subject}, pricing, samples or lead times…`
              : "Describe your requirement, specs and timeline…"
          }
          required
        />
      </Field>
      <Button type="submit" variant="navy" className="w-full sm:w-auto">
        Send inquiry
      </Button>
      <p className="text-[12px] text-slate-500">
        Messages stay on-platform so both sides keep a trade record.
      </p>
    </form>
  );
}
