"use client";

import { useState } from "react";
import { Button } from "./ui";
import { sendPartnerMessage } from "../lib/actions";

export default function PartnerMessageForm() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = String(data.get("subject") ?? "");
    const body = String(data.get("body") ?? "");

    setPending(true);
    setResult(null);
    try {
      const response = await sendPartnerMessage(subject, body);
      setResult(response);
      if (response.ok) event.currentTarget.reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="msg-subject" className="label-xs">
          Subject
        </label>
        <input
          id="msg-subject"
          name="subject"
          type="text"
          required
          placeholder="Document question"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>
      <div>
        <label htmlFor="msg-body" className="label-xs">
          Message
        </label>
        <textarea
          id="msg-body"
          name="body"
          required
          rows={4}
          placeholder="Ask your officer about the next step…"
          className="mt-1.5 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>
      <Button type="submit" variant="navy" size="sm" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
      {result ? (
        <p className={`text-[13px] ${result.ok ? "text-success" : "text-red-600"}`}>
          {result.ok
            ? "Message delivered to your assigned officer and recorded in the audit log."
            : result.error}
        </p>
      ) : null}
    </form>
  );
}
