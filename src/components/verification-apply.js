"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Field, Input, Select } from "./ui";
import { DOCUMENT_TYPES } from "@/lib/trade-constants";
import { applyForVerification, renewVerificationBadge } from "@/lib/member-actions";

/**
 * §7.5 application form — pick a level, attach document references and
 * submit. Paid levels hand over to the §7.7 checkout; free levels create
 * the case immediately and it lands in the staff Verification Queue.
 */
export default function VerificationApply({ levels = [], fees = {}, country = "", hasOpenCase = false, canRenew = false }) {
  const router = useRouter();
  const [levelKey, setLevelKey] = useState(levels[0]?.key || "company_checked");
  const [docs, setDocs] = useState(() =>
    (levels[0]?.requiredDocs || []).map((type) => ({ type, reference: "" })),
  );
  const [saving, setSaving] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const level = levels.find((item) => item.key === levelKey);
  const fee = fees[levelKey] || { label: "Included", amount: "", currency: "" };

  function chooseLevel(key) {
    setLevelKey(key);
    const next = levels.find((item) => item.key === key);
    setDocs((next?.requiredDocs || []).map((type) => ({ type, reference: "" })));
    setError(null);
    setNotice(null);
  }

  function setDoc(index, key, value) {
    setDocs((list) => list.map((doc, i) => (i === index ? { ...doc, [key]: value } : doc)));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const result = await applyForVerification({
      levelKey,
      documents: docs.filter((doc) => doc.reference.trim()),
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.needsPayment) {
      router.push(`/dashboard/membership/checkout?invoice=${result.invoiceId}`);
      return;
    }
    setNotice(`Application submitted — your ${level?.label || "company"} case is in the Verification Queue.`);
    router.refresh();
  }

  async function handleRenew() {
    setRenewing(true);
    setError(null);
    setNotice(null);
    const result = await renewVerificationBadge();
    setRenewing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.needsPayment) {
      router.push(`/dashboard/membership/checkout?invoice=${result.invoiceId}`);
      return;
    }
    setNotice("Renewal submitted.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {canRenew ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[13px] text-amber-800">
            Your badge is up for its annual renewal — re-verify to keep the badge live.
          </p>
          <Button variant="accent" size="sm" onClick={handleRenew} disabled={renewing}>
            {renewing ? "Starting…" : "Renew badge"}
          </Button>
        </div>
      ) : null}

      {hasOpenCase ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
          You already have a verification in progress — new applications open once it is
          decided.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Verification level" required>
            <div className="grid gap-3 sm:grid-cols-3">
              {levels.map((item) => {
                const active = item.key === levelKey;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => chooseLevel(item.key)}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-slate-200 bg-white hover:border-primary"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-ink">{item.label}</span>
                      <Badge tone={fees[item.key]?.amount ? "amber" : "green"}>
                        {fees[item.key]?.amount ? fees[item.key].amount : "Free"}
                      </Badge>
                    </span>
                    <span className="mt-1 block text-[12px] leading-5 text-slate-500">
                      {item.blurb}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          {fee.label && fee.amount ? (
            <p className="text-[13px] text-slate-600">
              Fee: <strong className="text-ink">{fee.amount}</strong> — payable before the
              case enters the queue.
            </p>
          ) : fee.label ? (
            <p className="text-[13px] text-slate-600">{fee.label}</p>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-ink">Document references</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDocs((list) => [...list, { type: DOCUMENT_TYPES[0], reference: "" }])}
                disabled={docs.length >= 8}
              >
                Add document
              </Button>
            </div>
            {docs.map((doc, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-[200px_1fr]">
                <Select value={doc.type} onChange={(event) => setDoc(index, "type", event.target.value)}>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </Select>
                <div className="flex gap-2">
                  <Input
                    value={doc.reference}
                    onChange={(event) => setDoc(index, "reference", event.target.value)}
                    placeholder="File name, registration number or a link"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDocs((list) => list.filter((_, i) => i !== index))}
                    disabled={docs.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <p className="text-[12px] text-slate-500">
              Uploads are handled by the trade desk after submission — enter the reference
              your auditor or registry issued ({country || "your country"} dossier).
            </p>
          </div>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
          {notice ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              {notice}
            </p>
          ) : null}

          <Button type="submit" variant="navy" disabled={saving}>
            {saving ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      )}
    </div>
  );
}
