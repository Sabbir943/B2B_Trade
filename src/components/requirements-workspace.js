"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, EmptyState, Field, Select, Textarea } from "./ui";
import { TagIcon } from "./icons";
import { DataTable, Section, StatCards } from "./workspace";
import { markRequirementOutcome, requestSourcingAssist, submitDealReview } from "@/lib/member-actions";

const STATUS_TONE = {
  pending: "amber",
  published: "green",
  rejected: "red",
  awarded: "navy",
  closed: "slate",
};

const STATUS_LABEL = {
  pending: "In moderation",
  published: "Live",
  rejected: "Rejected",
  awarded: "Awarded",
  closed: "Closed",
};

/**
 * §7.3 buyer workspace — award/close (§7.3.6), Sourcing Desk request
 * (§7.3.5) and post-deal reviews, all against real Mongo rows.
 */
export default function RequirementsWorkspace({ posts = [], quoterMap = {} }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [panel, setPanel] = useState(null); // { id, mode: "award" | "review" }
  const [review, setReview] = useState({ to: "", rating: "5", comment: "" });

  const stats = [
    { label: "Live posts", value: String(posts.filter((row) => row.status === "published").length), hint: "On the public board" },
    { label: "Quotes received", value: String(posts.reduce((sum, row) => sum + (row.quotes || 0), 0)), hint: "Threads from suppliers" },
    { label: "In moderation", value: String(posts.filter((row) => row.status === "pending").length), hint: "12h SLA" },
    { label: "Resolved", value: String(posts.filter((row) => ["awarded", "closed"].includes(row.status)).length), hint: "Awarded or closed" },
  ];

  async function run(key, action) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      if (result?.ok) {
        setNotice(result.notice || result.status || "Done.");
        setPanel(null);
        setReview({ to: "", rating: "5", comment: "" });
        router.refresh();
      } else {
        setError(result?.error || "Action failed.");
      }
    } catch {
      setError("Action failed.");
    } finally {
      setBusy(null);
    }
  }

  function quoterSelect(requirementId, value, onChange) {
    const quoters = quoterMap[requirementId] || [];
    if (!quoters.length) {
      return <p className="text-[13px] text-slate-500">No supplier has quoted yet.</p>;
    }
    return (
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Choose supplier…</option>
        {quoters.map((quoter) => (
          <option key={quoter.email} value={quoter.email}>
            {quoter.name || quoter.email}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <>
      <StatCards items={stats} />

      {notice ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <Section className="mt-6" title="Your posts">
        <DataTable
          columns={[
            { key: "id", label: "Ref", emphasis: true },
            {
              key: "product",
              label: "Requirement",
              render: (row) => (
                <span className="flex flex-col gap-0.5">
                  <span>{row.product}</span>
                  {row.status === "rejected" && row.moderationReason ? (
                    <span className="text-[12px] font-normal text-red-600">{row.moderationReason}</span>
                  ) : null}
                </span>
              ),
            },
            { key: "quantity", label: "Quantity", render: (row) => `${row.quantity} ${row.unit}` },
            { key: "quotes", label: "Quotes" },
            { key: "targetDate", label: "Target date" },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <Badge tone={STATUS_TONE[row.status] || "slate"}>{STATUS_LABEL[row.status] || row.status}</Badge>
              ),
            },
            {
              key: "actions",
              label: "",
              render: (row) => (
                <span className="flex flex-wrap items-center gap-1.5">
                  <Link
                    href={`/requirements/${row.id}`}
                    className="whitespace-nowrap text-[11px] font-bold text-primary hover:underline"
                  >
                    View
                  </Link>

                  {row.status === "published" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPanel({ id: row.id, mode: "award" })}
                        className="whitespace-nowrap text-[11px] font-bold text-primary hover:underline"
                      >
                        Award
                      </button>
                      <button
                        type="button"
                        disabled={busy === `close:${row.id}`}
                        onClick={() =>
                          run(`close:${row.id}`, () => markRequirementOutcome(row.id, "closed"))
                        }
                        className="whitespace-nowrap text-[11px] font-bold text-slate-500 hover:underline disabled:opacity-50"
                      >
                        {busy === `close:${row.id}` ? "Closing…" : "Close"}
                      </button>
                      <button
                        type="button"
                        disabled={busy === `sourcing:${row.id}`}
                        onClick={() =>
                          run(`sourcing:${row.id}`, async () => {
                            const result = await requestSourcingAssist(row.id);
                            return result.ok ? { ok: true, notice: "Sourcing Desk request opened." } : result;
                          })
                        }
                        className="whitespace-nowrap text-[11px] font-bold text-accent-ink hover:underline disabled:opacity-50"
                      >
                        Sourcing help
                      </button>
                    </>
                  ) : null}

                  {["awarded", "closed"].includes(row.status) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReview({ to: "", rating: "5", comment: "" });
                        setPanel({ id: row.id, mode: "review" });
                      }}
                      className="whitespace-nowrap text-[11px] font-bold text-primary hover:underline"
                    >
                      Leave review
                    </button>
                  ) : null}
                </span>
              ),
            },
          ]}
          rows={posts}
          empty="You haven't posted a requirement yet."
        />
      </Section>

      {panel ? (
        <Section className="mt-6" title={panel.mode === "award" ? "Award this requirement" : "Leave a review"}>
          <div className="panel space-y-4 p-5">
            {panel.mode === "award" ? (
              <>
                <p className="text-[13px] leading-6 text-slate-600">
                  Choose the supplier you are awarding. The requirement closes for new
                  quotes and a review can be left by both sides afterwards.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Supplier">{quoterSelect(panel.id, review.to, (value) => setReview({ ...review, to: value }))}</Field>
                  <Field label="Outcome">
                    <Select value="awarded" onChange={() => {}}>
                      <option value="awarded">Awarded — deal agreed</option>
                    </Select>
                  </Field>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="navy"
                    size="sm"
                    disabled={!review.to || busy === `award:${panel.id}`}
                    onClick={() =>
                      run(`award:${panel.id}`, () =>
                        markRequirementOutcome(panel.id, "awarded", review.to),
                      )
                    }
                  >
                    {busy === `award:${panel.id}` ? "Awarding…" : "Confirm award"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPanel(null)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Supplier">{quoterSelect(panel.id, review.to, (value) => setReview({ ...review, to: value }))}</Field>
                  <Field label="Rating">
                    <Select value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })}>
                      {["5", "4", "3", "2", "1"].map((value) => (
                        <option key={value} value={value}>
                          {"★".repeat(Number(value))} {value}/5
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Comment" hint="Shows on the supplier's trust score">
                  <Textarea
                    rows={3}
                    value={review.comment}
                    onChange={(event) => setReview({ ...review, comment: event.target.value })}
                    placeholder="Quality, communication, delivery…"
                  />
                </Field>
                <div className="flex gap-3">
                  <Button
                    variant="navy"
                    size="sm"
                    disabled={!review.to || busy === `review:${panel.id}`}
                    onClick={() =>
                      run(`review:${panel.id}`, () =>
                        submitDealReview({
                          requirementId: panel.id,
                          to: review.to,
                          rating: Number(review.rating),
                          comment: review.comment,
                        }),
                      )
                    }
                  >
                    {busy === `review:${panel.id}` ? "Saving…" : "Submit review"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPanel(null)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </Section>
      ) : null}

      {!posts.length ? (
        <div className="mt-6">
          <EmptyState
            icon={<TagIcon className="h-5 w-5" />}
            title="Post what you need to buy"
            text="One requirement reaches every matching supplier in your category — quotes arrive in your inbox."
            action={
              <Button href="/rfq" variant="accent" size="sm">
                Post Your Requirement
              </Button>
            }
          />
        </div>
      ) : null}
    </>
  );
}
