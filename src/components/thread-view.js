"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Field, Select, Textarea } from "./ui";
import { AlertIcon, ShieldIcon } from "./icons";
import {
  replyToThread,
  updateThreadStage,
  revealThreadContact,
  reportConversation,
} from "@/lib/member-actions";
import { THREAD_STAGES, FRAUD_BANNER_TEXT } from "@/lib/trade-constants";

const STAGE_TONE = { New: "navy", Negotiating: "amber", Sampling: "blue", Closed: "slate" };

/**
 * §7.4 thread detail — on-platform replies, stage tracking, gated contact
 * reveal against the daily plan quota, fraud banner and reporting.
 */
export default function ThreadView({ thread, messages = [], quota, me = "", tierLabel = "free" }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [contact, setContact] = useState(null);
  const [remaining, setRemaining] = useState(quota?.remaining ?? 0);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");

  async function run(key, action, successNotice = null) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      if (result?.ok) {
        setNotice(successNotice || result.notice || null);
        return result;
      }
      setError(result?.error || "Action failed.");
      return null;
    } catch {
      setError("Action failed.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function handleReply(event) {
    event.preventDefault();
    if (!reply.trim()) return;
    const result = await run("reply", () => replyToThread(thread.id, reply));
    if (result) {
      setReply("");
      router.refresh();
    }
  }

  async function handleReveal() {
    const result = await run("reveal", () => revealThreadContact(thread.id));
    if (result) {
      setContact(result.contact);
      const nextRemaining = typeof result.remaining === "number" ? result.remaining : remaining;
      setRemaining(nextRemaining);
      setNotice(`Contact revealed · ${nextRemaining} daily reveal${nextRemaining === 1 ? "" : "s"} left.`);
    }
  }

  async function handleReport(event) {
    event.preventDefault();
    const result = await run("report", () => reportConversation(thread.id, reportReason));
    if (result) {
      setReporting(false);
      setReportReason("");
      setNotice("Report filed — our team reviews it within 24 hours.");
      router.refresh();
    }
  }

  const fraud = (thread.fraudFlags || []).length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="panel overflow-hidden">
        {error ? (
          <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-[13px] font-semibold text-red-600">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-[13px] font-semibold text-emerald-800">
            {notice}
          </p>
        ) : null}
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold text-primary">
                {thread.subject}
              </p>
              <p className="mt-1 text-[13px] text-slate-500">
                {thread.counterpartName || thread.counterpart}
                {thread.counterpartCountry ? ` · ${thread.counterpartCountry}` : ""} ·{" "}
                {thread.id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={STAGE_TONE[thread.stage] || "slate"}>{thread.stage}</Badge>
              {thread.reported ? <Badge tone="red">Under review</Badge> : null}
            </div>
          </div>

          {thread.requirementId ? (
            <Link
              href={`/requirements/${thread.requirementId}`}
              className="mt-2 inline-block text-[13px] font-semibold text-primary hover:underline"
            >
              View requirement →
            </Link>
          ) : null}
          {thread.listingId ? (
            <Link
              href={`/products/${thread.listingId}`}
              className="mt-2 inline-block text-[13px] font-semibold text-primary hover:underline"
            >
              View listing →
            </Link>
          ) : null}
        </div>

        {fraud ? (
          <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3.5">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[13px] leading-6 text-amber-800">{FRAUD_BANNER_TEXT}</p>
          </div>
        ) : null}

        <div className="max-h-[440px] space-y-4 overflow-y-auto p-5">
          {messages.map((message) => {
            const mine = message.from === me;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    mine ? "bg-primary text-white" : "bg-slate-100 text-ink"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  <p
                    className={`mt-1.5 text-[11px] ${mine ? "text-white/60" : "text-slate-400"}`}
                  >
                    {message.from === me ? "You" : thread.counterpartName || message.from} ·{" "}
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
          {!messages.length ? (
            <p className="text-center text-sm text-slate-500">No messages yet.</p>
          ) : null}
        </div>

        <form onSubmit={handleReply} className="border-t border-slate-100 p-5">
          <Field label="Reply" hint="Replies stay on-platform and keep the trade record for both sides">
            <Textarea
              rows={4}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Write your reply…"
            />
          </Field>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="submit" variant="navy" size="sm" disabled={busy === "reply" || !reply.trim()}>
              {busy === "reply" ? "Sending…" : "Send reply"}
            </Button>
            <span className="text-[12px] text-slate-500">
              {error || notice}
            </span>
            <span className="text-[12px] text-slate-400">
              On-platform replies are recorded for both parties.
            </span>
          </div>
        </form>
      </div>

      <aside className="space-y-4">
        <div className="panel p-5">
          <p className="label-xs">Pipeline stage</p>
          <div className="mt-3">
            <Select
              value={thread.stage}
              disabled={busy === "stage"}
              onChange={(event) => {
                const stage = event.target.value;
                run("stage", () => updateThreadStage(thread.id, stage), `Stage set to ${stage}.`).then(
                  (result) => {
                    if (result) router.refresh();
                  },
                );
              }}
            >
              {THREAD_STAGES.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="panel p-5">
          <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
            <ShieldIcon className="h-4 w-4 text-secondary" />
            Contact details
          </p>
          {contact ? (
            <dl className="mt-3 space-y-2 text-[13px]">
              {[
                ["Name", contact.name],
                ["Company", contact.company],
                ["Email", contact.email],
                ["Phone", contact.phone],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="truncate font-semibold text-ink">{value}</dd>
                  </div>
                ))}
            </dl>
          ) : (
            <>
              <p className="mt-3 text-[13px] leading-6 text-slate-600">
                Reveal uses one of your daily direct-contact slots ({tierLabel} plan:{" "}
                {quota?.limit ?? 0}/day · {remaining} left). Re-checking this thread is
                free.
              </p>
              <Button
                variant="navy"
                size="sm"
                className="mt-4 w-full"
                onClick={handleReveal}
                disabled={busy === "reveal" || (remaining <= 0 && !contact)}
              >
                {busy === "reveal" ? "Revealing…" : "Reveal contact"}
              </Button>
            </>
          )}
        </div>

        <div className="panel p-5">
          <p className="label-xs">Safety</p>
          {reporting ? (
            <form onSubmit={handleReport} className="mt-3 space-y-3">
              <Field label="What looks wrong?">
                <Textarea
                  rows={3}
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  placeholder="Asked to move payment off-platform, changed bank details…"
                  required
                />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" variant="accent" size="sm" disabled={busy === "report"}>
                  {busy === "report" ? "Filing…" : "File report"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setReporting(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Never pay outside the platform or accept sudden bank-detail changes.
                Report anything suspicious.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setReporting(true)}
                disabled={thread.reported}
              >
                {thread.reported ? "Reported" : "Report conversation"}
              </Button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
