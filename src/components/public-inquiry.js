"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Textarea } from "./ui";
import { startInquiry } from "@/lib/member-actions";

/**
 * §7.4 public inquiry composer — both parties must be signed-in members,
 * so visitors get the sign-up path instead of a dead form.
 */
export default function PublicInquiry({ to, subject, listingId = null, requirementId = null, signedIn = false }) {
  const router = useRouter();
  const [form, setForm] = useState({ subject: subject || "Product inquiry", body: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  if (!signedIn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-sm font-bold text-ink">Sign in to send an inquiry</p>
        <p className="mt-1 text-[13px] leading-6 text-slate-600">
          Conversations stay on-platform so both sides keep the same trade record.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button href="/sign-in" variant="navy" size="sm">
            Sign in
          </Button>
          <Button href="/sign-up" variant="outline" size="sm">
            Create account
          </Button>
        </div>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSending(true);
    setError(null);
    const result = await startInquiry({ to, ...form, listingId, requirementId });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="font-display text-[15px] font-bold text-emerald-800">Inquiry sent</p>
        <p className="mt-1 text-[13px] leading-6 text-emerald-700">
          Your message is on its way. Replies arrive in your dashboard inbox.
        </p>
        <Button
          href="/dashboard/inquiries"
          variant="outline"
          size="sm"
          className="mt-3"
        >
          Open my inbox
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="label-xs">Send an inquiry</p>
      <Field label="Subject">
        <Input
          value={form.subject}
          onChange={(event) => setForm({ ...form, subject: event.target.value })}
          required
        />
      </Field>
      <Field label="Message" required hint="Include quantity, specs and target date">
        <Textarea
          rows={4}
          value={form.body}
          onChange={(event) => setForm({ ...form, body: event.target.value })}
          placeholder={`Ask about ${subject || "this offer"}, pricing, samples or lead times…`}
          required
        />
      </Field>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
      <Button type="submit" variant="navy" size="sm" disabled={sending}>
        {sending ? "Sending…" : "Send inquiry"}
      </Button>
    </form>
  );
}
