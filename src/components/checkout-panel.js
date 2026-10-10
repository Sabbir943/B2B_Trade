"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "./ui";
import { CheckIcon, CreditCardIcon } from "./icons";
import { setPaymentMethod, payInvoiceWithGateway } from "@/lib/member-actions";
import { BANK_DETAILS } from "@/lib/trade-constants";

const STATUS_TONE = { pending: "amber", awaiting_bank: "amber", paid: "green", failed: "red", quoted: "slate" };

/**
 * §7.7.2–4 checkout — gateway (simulated PSP adapter) or bank transfer
 * (proforma now, staff activation later). Card data never touches this app.
 */
export default function CheckoutPanel({ invoice = {}, bankDetails = BANK_DETAILS }) {
  const router = useRouter();
  const [method, setMethod] = useState(invoice.method || null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [paid, setPaid] = useState(invoice.status === "paid");
  const [proformaNo, setProformaNo] = useState(invoice.proformaNo || null);

  const amount =
    invoice.currency === "BDT"
      ? `BDT ${Number(invoice.amountBdt || 0).toLocaleString()}`
      : `$${Number(invoice.amountUsd || 0).toLocaleString()}`;

  async function run(key, action) {
    setBusy(key);
    setError(null);
    try {
      const result = await action();
      if (result?.ok) return result;
      setError(result?.error || "Payment could not be completed.");
      return null;
    } catch {
      setError("Payment could not be completed.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function chooseGateway() {
    setMethod("gateway");
    await run("gateway", () => setPaymentMethod(invoice.id, "gateway"));
  }

  async function chooseBank() {
    setMethod("bank");
    const result = await run("bank", () => setPaymentMethod(invoice.id, "bank"));
    if (result?.proformaNo) setProformaNo(result.proformaNo);
  }

  async function payNow() {
    const result = await run("pay", () => payInvoiceWithGateway(invoice.id));
    if (result) {
      setPaid(true);
      router.refresh();
    }
  }

  if (paid || invoice.status === "paid") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success text-white">
          <CheckIcon className="h-5 w-5" />
        </span>
        <p className="mt-3 font-display text-lg font-bold text-emerald-800">Payment received</p>
        <p className="mt-1 text-sm leading-6 text-emerald-700">
          {invoice.label} · {amount}
          {invoice.invoiceNumber ? ` · Invoice ${invoice.invoiceNumber}` : ""}
          {invoice.gatewayRef ? ` · ref ${invoice.gatewayRef}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button href="/dashboard/membership" variant="navy" size="sm">
            Back to membership
          </Button>
          {invoice.kind === "verification_fee" ? (
            <Button href="/dashboard/verification" variant="outline" size="sm">
              View verification status
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (invoice.status === "quoted") {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-600">
        This fee is quoted by our team — the invoice becomes payable once staff issue it.
      </p>
    );
  }

  if (method === "bank") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[13px] font-semibold text-amber-900">
            Proforma {proformaNo || invoice.proformaNo || "issued"} · due{" "}
            {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : "in 7 days"}
          </p>
          <p className="mt-1 text-[13px] text-amber-800">
            Transfer {amount} to the account below, then send the receipt to
            billing@alliedone.trade. Activation happens within one working day of
            clearing.
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["Account name", bankDetails.account],
            ["Bank", bankDetails.bank],
            ["Account number", bankDetails.accountNumber],
            ["SWIFT", bankDetails.swift],
            ["Note", bankDetails.note],
            ["Reference", `${invoice.id} · ${invoice.email}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 p-4">
              <dt className="label-xs">{label}</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <Button variant="outline" size="sm" onClick={() => setMethod(null)} disabled={busy === "bank"}>
          Change payment method
        </Button>
      </div>
    );
  }

  if (method === "gateway") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <CreditCardIcon className="h-4 w-4 text-secondary" />
            Card payment · {amount}
          </p>
          <p className="mt-1 text-[13px] leading-6 text-slate-600">
            You will be handed to our payment provider. Card details are never
            entered on this platform.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="accent" onClick={payNow} disabled={busy === "pay"}>
            {busy === "pay" ? "Processing…" : `Pay ${amount}`}
          </Button>
          <Button variant="outline" onClick={() => setMethod(null)} disabled={busy === "pay"}>
            Change payment method
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={chooseGateway}
        disabled={busy === "gateway"}
        className="rounded-xl border border-slate-200 p-5 text-left transition hover:border-primary disabled:opacity-60"
      >
        <p className="flex items-center gap-2 text-sm font-bold text-ink">
          <CreditCardIcon className="h-4 w-4 text-secondary" />
          Pay by card
        </p>
        <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
          Instant activation via our payment gateway. {amount}
        </p>
      </button>
      <button
        type="button"
        onClick={chooseBank}
        disabled={busy === "bank"}
        className="rounded-xl border border-slate-200 p-5 text-left transition hover:border-primary disabled:opacity-60"
      >
        <p className="text-sm font-bold text-ink">Pay by Bank Transfer</p>
        <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
          We issue a proforma now; staff activate once the transfer clears.
        </p>
      </button>
      {error ? (
        <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
