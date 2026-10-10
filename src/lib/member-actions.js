"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext, requireAuth } from "./session";
import { recordAudit } from "./audit";
import { saveProfile, markPhoneVerified, getProfile } from "./profile";
import { sendPhoneOtp, verifyPhoneOtp } from "./phone-otp";
import { createListing, deleteListing, listingAllowance } from "./listings";
import {
  createRequirement,
  requestSourcingHelp,
  setRequirementOutcome,
} from "./requirements";
import { leaveReview } from "./trust";
import { createThread, sendMessage, setThreadStage, revealContact, reportThread } from "./inbox";
import { startVerificationApplication, startRenewal } from "./verification";
import { submitMarketEntryApplication } from "./market-entry";
import { choosePaymentMethod, createInvoice, getInvoice, payWithGateway } from "./billing";
import { getPricingSettings } from "./membership";
import { cleanText } from "./refs";

/**
 * Member-side server actions for the core workflows (spec §7).
 * Every action re-checks the caller's session on the server before touching
 * data; ownership of the target row is verified inside each data function.
 */

function asResult(result) {
  if (result?.ok) return result;
  return { ok: false, error: result?.error || "Something went wrong. Try again." };
}

/* ------------------------------------------------------------------ *
 * §7.1 Registration and onboarding
 * ------------------------------------------------------------------ */

export async function saveCompanyProfile(input) {
  const { user } = await requireAuth("/dashboard/profile");
  const result = await saveProfile(user.email, input);
  if (result.ok) revalidatePath("/dashboard/profile");
  return asResult(result);
}

export async function sendPhoneVerificationCode(phone) {
  const { user } = await requireAuth("/onboarding");
  try {
    const payload = await sendPhoneOtp({ email: user.email, phone });
    return { ok: true, ...payload };
  } catch (error) {
    return { ok: false, error: error.message || "Could not send the code." };
  }
}

export async function verifyPhoneVerificationCode(code) {
  const { user } = await requireAuth("/onboarding");
  try {
    const payload = await verifyPhoneOtp({ email: user.email, code });
    if (payload.ok) revalidatePath("/onboarding");
    return { ok: true, ...payload };
  } catch (error) {
    return { ok: false, error: error.message || "Could not verify the code." };
  }
}

/* ------------------------------------------------------------------ *
 * §7.2 Product listing
 * ------------------------------------------------------------------ */

export async function submitProductListing(input) {
  const { user, tier } = await requireAuth("/dashboard/products");
  const profile = await getProfile(user.email);
  const result = await createListing(user.email, { ...input, currency: profile.currency }, tier);
  if (result.ok) {
    await recordAudit({
      action: "listing.submit",
      target: `listing:${result.listing.id}`,
      detail: { title: result.listing.title, status: result.listing.status },
      actor: user.email,
      actorRole: "company_member",
    });
    revalidatePath("/dashboard/products");
  }
  return asResult(result);
}

export async function removeProductListing(listingId) {
  const { user } = await requireAuth("/dashboard/products");
  const result = await deleteListing(listingId, user.email);
  if (result.ok) revalidatePath("/dashboard/products");
  return asResult({ ...result, error: result.ok ? undefined : "Only drafts and rejected listings can be deleted." });
}

export async function getListingAllowance() {
  const { user, tier } = await requireAuth("/dashboard/products");
  return listingAllowance(user.email, tier);
}

/* ------------------------------------------------------------------ *
 * §7.3 Buy requirement → supplier match
 * ------------------------------------------------------------------ */

export async function postBuyRequirement(input) {
  const { user } = await requireAuth("/rfq");
  const result = await createRequirement(user.email, input);
  if (result.ok) {
    await recordAudit({
      action: "requirement.submit",
      target: `requirement:${result.requirement.id}`,
      detail: { product: result.requirement.product, status: result.requirement.status },
      actor: user.email,
      actorRole: "company_member",
    });
    revalidatePath("/rfq");
    revalidatePath("/dashboard/requirements");
  }
  return asResult(result);
}

export async function markRequirementOutcome(requirementId, outcome, awardedTo = "") {
  const { user } = await requireAuth("/dashboard/requirements");
  const result = await setRequirementOutcome(requirementId, user.email, outcome, awardedTo);
  if (result.ok) {
    await recordAudit({
      action: `requirement.${outcome}`,
      target: `requirement:${requirementId}`,
      detail: { outcome, awardedTo: awardedTo || undefined },
      actor: user.email,
      actorRole: "company_member",
    });
    revalidatePath("/dashboard/requirements");
    revalidatePath(`/requirements/${requirementId}`);
  }
  return asResult(result);
}

export async function requestSourcingAssist(requirementId) {
  const { user } = await requireAuth("/dashboard/requirements");
  const result = await requestSourcingHelp(requirementId, user.email);
  if (result.ok) {
    await recordAudit({
      action: "sourcing.request",
      target: `requirement:${requirementId}`,
      detail: { source: "buyer" },
      actor: user.email,
      actorRole: "company_member",
    });
    revalidatePath("/dashboard/requirements");
  }
  return asResult(result);
}

export async function submitDealReview({ requirementId, to, rating, comment }) {
  const { user } = await requireAuth("/dashboard/requirements");
  const result = await leaveReview({ requirementId, from: user.email, to, rating, comment });
  if (result.ok) revalidatePath("/dashboard/requirements");
  return asResult(result);
}

/* ------------------------------------------------------------------ *
 * §7.4 Inquiries and inbox
 * ------------------------------------------------------------------ */

export async function startInquiry({ to, subject, body, listingId = null, requirementId = null }) {
  const context = await getSessionContext();
  const sender = context.user?.email;
  // Every conversation stays inside the platform inbox (§7.4), so both
  // parties must be signed-in members.
  if (!sender) return { ok: false, error: "Sign in to send an inquiry." };

  const result = await createThread({ from: sender, to, subject, body, listingId, requirementId });
  if (result.ok) {
    revalidatePath("/dashboard/inquiries");
    if (requirementId) revalidatePath(`/requirements/${requirementId}`);
    if (listingId) revalidatePath(`/products/${listingId}`);
  }
  return asResult(result);
}

export async function replyToThread(threadId, body) {
  const { user } = await requireAuth("/dashboard/inquiries");
  const result = await sendMessage(threadId, user.email, body);
  if (result.ok) revalidatePath(`/dashboard/inquiries/${threadId}`);
  return asResult(result);
}

export async function updateThreadStage(threadId, stage) {
  const { user } = await requireAuth("/dashboard/inquiries");
  const result = await setThreadStage(threadId, user.email, stage);
  if (result.ok) revalidatePath(`/dashboard/inquiries/${threadId}`);
  return asResult(result);
}

export async function revealThreadContact(threadId) {
  const { user, tier } = await requireAuth("/dashboard/inquiries");
  const result = await revealContact(threadId, user.email, tier);
  return asResult(result);
}

export async function reportConversation(threadId, reason) {
  const { user } = await requireAuth("/dashboard/inquiries");
  const result = await reportThread(threadId, user.email, reason);
  if (result.ok) {
    await recordAudit({
      action: "inquiry.report",
      target: `thread:${threadId}`,
      detail: { reason: cleanText(reason, 160) },
      actor: user.email,
      actorRole: "company_member",
    });
    revalidatePath(`/dashboard/inquiries/${threadId}`);
    revalidatePath("/admin/inquiries");
  }
  return asResult(result);
}

/* ------------------------------------------------------------------ *
 * §7.5 Verification
 * ------------------------------------------------------------------ */

export async function applyForVerification({ levelKey, documents }) {
  const { user, role } = await requireAuth("/dashboard/verification");
  const profile = await getProfile(user.email);
  const result = await startVerificationApplication({
    email: user.email,
    levelKey,
    documents,
    country: profile.country,
  });

  if (result.ok && result.needsPayment) {
    return { ok: true, needsPayment: true, invoiceId: result.invoiceId };
  }
  if (result.ok) {
    await recordAudit({
      action: "verification.apply",
      target: `case:${result.testCase.id}`,
      detail: { level: levelKey },
      actor: user.email,
      actorRole: role,
    });
    revalidatePath("/dashboard/verification");
    revalidatePath("/admin/verification-queue");
  }
  return asResult(result);
}

export async function renewVerificationBadge() {
  const { user, role } = await requireAuth("/dashboard/verification");
  const result = await startRenewal(user.email);
  if (result.ok && result.needsPayment) {
    return { ok: true, needsPayment: true, invoiceId: result.invoiceId };
  }
  if (result.ok) {
    await recordAudit({
      action: "verification.renew",
      target: `case:${result.testCase.id}`,
      detail: {},
      actor: user.email,
      actorRole: role,
    });
    revalidatePath("/dashboard/verification");
  }
  return asResult(result);
}

/* ------------------------------------------------------------------ *
 * §7.6 Bangladesh Market Entry
 * ------------------------------------------------------------------ */

export async function submitMarketEntry(input) {
  const { user, role } = await requireAuth("/market-entry/apply");
  const result = await submitMarketEntryApplication(user.email, input);
  if (result.ok) {
    await recordAudit({
      action: "market_entry.apply",
      target: `application:${result.application.id}`,
      detail: { company: result.application.company },
      actor: user.email,
      actorRole: role,
    });
    revalidatePath("/market-entry/apply");
    revalidatePath("/dashboard/market-entry");
    revalidatePath("/admin/market-entry");
  }
  return asResult(result);
}

/* ------------------------------------------------------------------ *
 * §7.7 Membership payment
 * ------------------------------------------------------------------ */

/** §7.7.1 — the member picks a plan; we open an invoice for it. */
export async function startPlanCheckout({ tierKey, cadence = "yearly" }) {
  const { user, tier } = await requireAuth("/dashboard/membership");
  if (tierKey === "free") return { ok: false, error: "The Free plan needs no checkout." };
  if (tier === tierKey) return { ok: false, error: `You are already on the ${tierKey} plan.` };

  const settings = await getPricingSettings();
  const plan = settings.tiers.find((item) => item.key === tierKey);
  if (!plan) return { ok: false, error: "Unknown plan." };

  const founding = settings.founding.enabled;
  const amountUsd = founding ? Number(plan.foundingUsd) || 0 : Number(plan.priceUsd) || 0;
  const amountBdt = founding ? Number(plan.foundingBdt) || 0 : Number(plan.priceBdt) || 0;

  const invoice = await createInvoice({
    email: user.email,
    kind: "membership",
    label: `${plan.name} — ${settings.billing.label}`,
    amountUsd,
    amountBdt,
    currency: amountBdt && !amountUsd ? "BDT" : "USD",
    context: { founding, cadence, listUsd: plan.priceUsd, listBdt: plan.priceBdt },
    tier: tierKey,
    cadence,
  });
  if (!invoice.ok) return asResult(invoice);

  revalidatePath("/dashboard/membership");
  return { ok: true, invoiceId: invoice.invoice.id };
}

/** §7.7.2 — gateway or "Pay by Bank Transfer". */
export async function setPaymentMethod(invoiceId, method) {
  const { user } = await requireAuth("/dashboard/membership");
  const result = await choosePaymentMethod(invoiceId, user.email, method);
  if (result.ok) revalidatePath("/dashboard/membership/checkout");
  return asResult(result);
}

/** §7.7.3 — gateway success → auto-activation + final invoice. */
export async function payInvoiceWithGateway(invoiceId) {
  const { user, role } = await requireAuth("/dashboard/membership");
  const invoice = await getInvoice(invoiceId);
  if (!invoice || invoice.email !== user.email) return { ok: false, error: "Invoice not found." };

  const result = await payWithGateway(invoiceId, user.email);
  if (result.ok) {
    await recordAudit({
      action: `billing.${invoice.kind}.paid`,
      target: `invoice:${invoiceId}`,
      detail: { method: "gateway", tier: invoice.tier ?? null },
      actor: user.email,
      actorRole: role,
    });
    revalidatePath("/dashboard/membership");
    revalidatePath("/dashboard/verification");
  }
  return asResult(result);
}
