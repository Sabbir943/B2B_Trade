import { randomUUID } from "node:crypto";
import { db } from "./db";
import { addDays, addMonths, cleanText, formatDate, isPast, newRef, now } from "./refs";
import { BANK_DETAILS } from "./trade-constants";

export { BANK_DETAILS };

/**
 * Membership & service payments (spec §7.7 — Membership payment).
 *
 *   1. Member chooses a plan.
 *   2. Pays by gateway (card / mobile wallet) or chooses "Pay by Bank
 *      Transfer".
 *   3. Gateway → auto-activation on success. Bank transfer → the system
 *      issues a proforma invoice; staff activate once funds arrive.
 *   4. Final invoice generated automatically.
 *   5. Renewal reminders at 30, 7 and 1 days before expiry.
 *
 * The gateway step is a simulated adapter (`gatewayCharge`) so the whole flow
 * is testable without credentials — swap it for SSLCommerz / ShurjoPay / Stripe
 * and nothing else in this module changes. Card data is never handled here.
 */

const INVOICES = "invoices";
const REMINDERS = "renewal_reminders";

export const INVOICE_STATUS = {
  PENDING: "pending",
  AWAITING_BANK: "awaiting_bank",
  PAID: "paid",
  FAILED: "failed",
  CANCELLED: "cancelled",
  QUOTED: "quoted",
};

export const PAYMENT_METHODS = ["gateway", "bank"];
export const MEMBERSHIP_MONTHS = 12;
export const RENEWAL_REMINDER_DAYS = [30, 7, 1];
export const BANK_TRANSFER_DAYS = 7;

/* ------------------------------------------------------------------ *
 * Invoices
 * ------------------------------------------------------------------ */

export async function createInvoice({
  email,
  kind,
  label,
  amountUsd = 0,
  amountBdt = 0,
  currency = "USD",
  quoted = false,
  context = {},
  tier = null,
  cadence = null,
  dueDays = BANK_TRANSFER_DAYS,
}) {
  const key = String(email || "").toLowerCase();
  if (!key) return { ok: false, error: "Not signed in." };

  const invoice = {
    id: newRef("INV"),
    email: key,
    kind,
    label: cleanText(label, 140),
    tier,
    cadence,
    amountUsd: Number(amountUsd) || 0,
    amountBdt: Number(amountBdt) || 0,
    currency: currency === "BDT" ? "BDT" : "USD",
    quoted: Boolean(quoted),
    context,
    method: null,
    status: quoted ? INVOICE_STATUS.QUOTED : INVOICE_STATUS.PENDING,
    proformaNo: null,
    invoiceNumber: null,
    gatewayRef: null,
    paidAt: null,
    activatedAt: null,
    issuedBy: null,
    dueAt: null,
    createdAt: now(),
    updatedAt: now(),
  };

  try {
    await db.collection(INVOICES).insertOne(invoice);
  } catch (error) {
    console.error("[billing] invoice insert failed", error.message);
    return { ok: false, error: "Could not create the invoice." };
  }
  return { ok: true, invoice };
}

export async function getInvoice(id) {
  try {
    return await db.collection(INVOICES).findOne({ id: String(id || "") });
  } catch (error) {
    console.error("[billing] invoice read failed", error.message);
    return null;
  }
}

export async function getInvoicesFor(email, limit = 50) {
  const key = String(email || "").toLowerCase();
  if (!key) return [];
  try {
    return await db.collection(INVOICES).find({ email: key }).sort({ createdAt: -1 }).limit(limit).toArray();
  } catch (error) {
    console.error("[billing] invoices read failed", error.message);
    return [];
  }
}

export async function listInvoices({ status, kind, limit = 100 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (kind) filter.kind = kind;
  try {
    return await db.collection(INVOICES).find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
  } catch (error) {
    console.error("[billing] invoice list failed", error.message);
    return [];
  }
}

/** §7.7.2 — the member picks how to pay. */
export async function choosePaymentMethod(invoiceId, email, method) {
  const key = String(email || "").toLowerCase();
  if (!PAYMENT_METHODS.includes(method)) return { ok: false, error: "Unknown payment method." };

  try {
    const invoice = await db.collection(INVOICES).findOne({ id: String(invoiceId), email: key });
    if (!invoice) return { ok: false, error: "Invoice not found." };
    if (invoice.status === INVOICE_STATUS.PAID) return { ok: false, error: "That invoice is already paid." };

    if (method === "gateway") {
      await db
        .collection(INVOICES)
        .updateOne({ id: invoice.id }, { $set: { method: "gateway", status: INVOICE_STATUS.PENDING, updatedAt: now() } });
      return { ok: true, method, invoiceId: invoice.id };
    }

    // Bank transfer → proforma invoice issued now, activation by staff later.
    const at = now();
    const proformaNo = `PRO-${at.getFullYear()}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
    await db.collection(INVOICES).updateOne(
      { id: invoice.id },
      {
        $set: {
          method: "bank",
          status: INVOICE_STATUS.AWAITING_BANK,
          proformaNo,
          dueAt: addDays(at, BANK_TRANSFER_DAYS),
          updatedAt: at,
        },
      },
    );
    return { ok: true, method, invoiceId: invoice.id, proformaNo };
  } catch (error) {
    console.error("[billing] method change failed", error.message);
    return { ok: false, error: "Could not update the payment method." };
  }
}

/**
 * Simulated payment gateway (§7.7.3 step 1).
 * Returns a reference on success — replace the body with a real PSP call.
 */
async function gatewayCharge({ invoice }) {
  const reference = `gw_${randomUUID().replace(/-/g, "").slice(0, 14)}`;
  void invoice;
  await new Promise((resolve) => setTimeout(resolve, 150));
  return { ok: true, reference };
}

/** Gateway success path: auto-activation (§7.7.3). */
export async function payWithGateway(invoiceId, email) {
  const key = String(email || "").toLowerCase();
  try {
    const invoice = await db.collection(INVOICES).findOne({ id: String(invoiceId), email: key });
    if (!invoice) return { ok: false, error: "Invoice not found." };
    if (invoice.status === INVOICE_STATUS.PAID) return { ok: false, error: "Already paid." };
    if (invoice.status === INVOICE_STATUS.QUOTED) {
      return { ok: false, error: "This fee is quoted by staff — wait for the invoice to be issued." };
    }

    const charge = await gatewayCharge({ invoice });
    if (!charge.ok) {
      await db
        .collection(INVOICES)
        .updateOne({ id: invoice.id }, { $set: { status: INVOICE_STATUS.FAILED, updatedAt: now() } });
      return { ok: false, error: "The payment was declined." };
    }

    return finalizeInvoice(invoice.id, {
      method: "gateway",
      gatewayRef: charge.reference,
      actor: key,
    });
  } catch (error) {
    console.error("[billing] gateway pay failed", error.message);
    return { ok: false, error: "Could not complete the payment." };
  }
}

/** Staff path for bank transfers (§7.7.3 step 2). */
export async function activateBankTransfer(invoiceId, actor) {
  try {
    const invoice = await db.collection(INVOICES).findOne({ id: String(invoiceId) });
    if (!invoice) return { ok: false, error: "Invoice not found." };
    if (invoice.status === INVOICE_STATUS.PAID) return { ok: false, error: "Already activated." };
    if (invoice.method !== "bank" && invoice.status !== INVOICE_STATUS.AWAITING_BANK) {
      return { ok: false, error: "Only bank-transfer invoices are activated by hand." };
    }
    return finalizeInvoice(invoice.id, { method: "bank", gatewayRef: null, actor });
  } catch (error) {
    console.error("[billing] bank activation failed", error.message);
    return { ok: false, error: "Could not activate the membership." };
  }
}

/**
 * §7.7.3–4 — mark paid, run the activation side effects and generate the
 * final invoice (the paid invoice itself carries `invoiceNumber`).
 */
async function finalizeInvoice(invoiceId, { method, gatewayRef, actor }) {
  const at = now();
  const invoiceNumber = `INV-${at.getFullYear()}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;

  try {
    const result = await db.collection(INVOICES).updateOne(
      { id: String(invoiceId), status: { $ne: INVOICE_STATUS.PAID } },
      {
        $set: {
          status: INVOICE_STATUS.PAID,
          method,
          gatewayRef: gatewayRef ?? null,
          invoiceNumber,
          paidAt: at,
          activatedAt: at,
          updatedAt: at,
        },
      },
    );
    if (result.matchedCount === 0) return { ok: false, error: "Invoice could not be settled." };

    const settled = await getInvoice(invoiceId);
    const sideEffects = await applyInvoiceEffects(settled, actor);
    if (!sideEffects.ok) return sideEffects;

    return { ok: true, invoice: { ...settled, status: INVOICE_STATUS.PAID, invoiceNumber } };
  } catch (error) {
    console.error("[billing] finalize failed", error.message);
    return { ok: false, error: "Could not finalise the invoice." };
  }
}

/** What each invoice kind does once it is paid. */
async function applyInvoiceEffects(invoice, actor) {
  if (invoice.kind === "membership") {
    return activateMembership({
      email: invoice.email,
      tier: invoice.tier,
      months: MEMBERSHIP_MONTHS,
      invoiceId: invoice.id,
      actor,
    });
  }

  if (invoice.kind === "verification_fee") {
    const { createVerificationCase } = await import("./verification");
    const { levelKey, documents, country, renewalOf } = invoice.context || {};
    const created = await createVerificationCase({
      email: invoice.email,
      levelKey,
      documents,
      country,
      renewalOf: renewalOf || null,
    });
    if (!created.ok) return created;
    await db
      .collection(INVOICES)
      .updateOne({ id: invoice.id }, { $set: { "context.caseId": created.testCase.id } });
    return { ok: true };
  }

  // Retainer and quoted invoices only settle.
  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * Membership activation
 * ------------------------------------------------------------------ */

export async function activateMembership({ email, tier, months = MEMBERSHIP_MONTHS, invoiceId = null, actor = "system" }) {
  const key = String(email || "").toLowerCase();
  const at = now();

  try {
    const user = await db.collection("user").findOne({ email: key });
    if (!user) return { ok: false, error: "No account found for that invoice." };

    // Extend from the current expiry when it is still in the future, so a
    // renewal never shortens a paid period.
    const currentExpiry = user.membershipExpiresAt ? new Date(user.membershipExpiresAt) : null;
    const base = currentExpiry && !isPast(currentExpiry) ? currentExpiry : at;
    const expiresAt = addMonths(base, months);

    await db.collection("user").updateOne(
      { email: key },
      {
        $set: {
          tier,
          membershipActivatedAt: user.membershipActivatedAt || at,
          membershipExpiresAt: expiresAt.toISOString(),
          membershipInvoiceId: invoiceId,
          membershipUpdatedBy: actor,
          updatedAt: at,
        },
      },
    );

    return { ok: true, tier, expiresAt: expiresAt.toISOString() };
  } catch (error) {
    console.error("[billing] activation failed", error.message);
    return { ok: false, error: "Could not activate the membership." };
  }
}

/* ------------------------------------------------------------------ *
 * Renewal reminders (§7.7.5)
 * ------------------------------------------------------------------ */

/**
 * Idempotent: writes one reminder per (account, expiry, 30/7/1 days) and
 * returns the ones that are due now — i.e. inside their window but before the
 * membership actually expires.
 */
export async function ensureRenewalReminders(email) {
  const key = String(email || "").toLowerCase();
  if (!key) return [];

  try {
    const user = await db.collection("user").findOne({ email: key });
    const expiry = user?.membershipExpiresAt ? new Date(user.membershipExpiresAt) : null;
    if (!expiry || Number.isNaN(expiry.getTime()) || isPast(expiry)) return [];

    const due = [];
    for (const days of RENEWAL_REMINDER_DAYS) {
      const dueAt = addDays(expiry, -days);
      const keyId = `${key}:${expiry.toISOString()}:${days}`;
      await db.collection(REMINDERS).updateOne(
        { key: keyId },
        {
          $set: { key: keyId, email: key, days, dueAt, expiresAt: expiry.toISOString() },
          $setOnInsert: { createdAt: now() },
        },
        { upsert: true },
      );
      if (dueAt.getTime() <= Date.now()) {
        due.push({ key: keyId, days, dueAt, expiresAt: expiry.toISOString() });
      }
    }
    return due.sort((a, b) => a.days - b.days);
  } catch (error) {
    console.error("[billing] reminders failed", error.message);
    return [];
  }
}

export async function listDueReminders(limit = 100) {
  try {
    const rows = await db.collection(REMINDERS).find({ dueAt: { $lte: now() } }).sort({ dueAt: 1 }).limit(limit).toArray();
    const active = [];
    for (const row of rows) {
      const expiry = row.expiresAt ? new Date(row.expiresAt) : null;
      if (expiry && expiry.getTime() > Date.now()) active.push(row);
    }
    return active;
  } catch (error) {
    console.error("[billing] reminder list failed", error.message);
    return [];
  }
}

/** Everything the membership page needs in one call. */
export async function getMembershipSummary(email) {
  const key = String(email || "").toLowerCase();
  try {
    const user = await db.collection("user").findOne({ email: key });
    const invoices = await getInvoicesFor(key, 12);
    const reminders = await ensureRenewalReminders(key);
    const expiry = user?.membershipExpiresAt ? new Date(user.membershipExpiresAt) : null;
    const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / 86_400_000) : null;
    return {
      tier: user?.tier || "free",
      expiresAt: expiry ? expiry.toISOString() : null,
      expiresLabel: expiry ? formatDate(expiry) : "—",
      daysLeft: expiry && daysLeft > 0 ? daysLeft : null,
      renewing: Boolean(expiry && daysLeft !== null && daysLeft <= 30),
      reminders,
      invoices,
    };
  } catch (error) {
    console.error("[billing] summary failed", error.message);
    return { tier: "free", expiresAt: null, expiresLabel: "—", daysLeft: null, renewing: false, reminders: [], invoices: [] };
  }
}
